# Data Collection: voice runtime contract (Phase 1)

This document describes how the voice runtime (the engine that places and answers calls) should **read** an AI Employee's Data Collection fields and **write** one structured result per call, so Results, Analytics and Excel/CSV export work without any JSON blob columns.

Phase 1 ships the schema, the console UI and this contract. It does **not** change the runtime. The runtime integration is a follow-up.

## 1. Tables

Migration: `drizzle/migrations/0001_data_collection.sql`.

| Table | One row per | Written by |
| --- | --- | --- |
| `ac_employees` | AI Employee | Console (signed-in owner, RLS) |
| `ac_data_fields` | field per employee | Console (signed-in owner, RLS) |
| `ac_call_results` | call | Voice runtime (service role) |
| `ac_call_answers` | field per call | Voice runtime (service role) |

All tables have RLS enabled. Owners can read/write their own rows (`owner_id = auth.uid()`). The runtime writes with the **service role** and must set `owner_id` explicitly to the employee's `owner_id` (service role has no `auth.uid()`).

## 2. Reading the field schema at call start

```sql
select key, label, type, required, prompt, options, condition, source, validation_hint
from ac_data_fields
where employee_id = $1
order by position;
```

- `position` is the order to ask questions in.
- `source = 'contact'` fields are filled from the contact list, not asked.
- `condition` (nullable) is an IF/THEN rule: `{"fieldKey": "...", "operator": "equals|not_equals|includes|is_answered", "value": "..."}`. Ask the field only when the rule matches the normalized answer of `fieldKey`. Booleans compare as `"Yes"` / `"No"`. Reference implementation: `src/lib/data-collection/conditions.ts` (`shouldAsk`).
- The employee's instructions (`ac_employees.config.instructions`) already list every question, its options and its field key. The runtime may hand the field list to the LLM as a tool schema, e.g. a `save_answer(field_key, raw_answer, normalized_answer)` tool.

### Workflow Builder variables

Each field key is exposed to the existing Workflow Builder as `{{data.<key>}}` (e.g. `{{data.candidate_support}}`). After a call, the runtime passes the normalized answers to the attached workflow (`ac_employees.config.workflow.workflowId`) as these variables. This is the only coupling; there is no second workflow engine. For the current platform this maps onto the existing end-of-call `extractedData` payload: send `extractedData` keyed by field key.

## 3. Normalizing answers

Always keep both:

- `raw_answer`: what the caller said (transcript snippet), unchanged.
- `normalized_answer` (jsonb): the value mapped to the field type.

| Field type | `normalized_answer` |
| --- | --- |
| `single_select` | one of `options` exactly (string), else `null` (or `"Other"` if that option exists) |
| `multi_select` | array of `options` values |
| `text`, `long_text` | trimmed string |
| `number` | number |
| `rating` | integer 1–5 |
| `boolean` | `true` / `false` |
| `phone` | digits, leading `+` kept |
| `email` | lowercase address |
| `date` | `YYYY-MM-DD` |

Rules:

1. Never invent a value. If the answer cannot be mapped, write `normalized_answer = null` and keep the raw answer.
2. Refusals ("I'd rather not say", "no comments") are written as `"Prefer not to answer"`.
3. Public-opinion employees (`ac_employees.research_mode = 'neutral'`) must not persuade. `Undecided` and `Prefer not to answer` are always valid.
4. Prefer LLM normalization inside the call (the tool call above). `src/lib/data-collection/normalize.ts` (`normalizeAnswer`) is the deterministic fallback/validator, e.g. "haven't decided yet" -> `Undecided`, "four out of five" -> `4`.
5. Optional `confidence` (0–1) can be stored per answer.

## 4. Writing one call result

At call end (or on each status change), upsert one row per call:

```sql
insert into ac_call_results
  (employee_id, owner_id, call_id, campaign, contact_name, phone, status,
   started_at, duration_seconds, transcript, summary, recording_url, source)
values ($employee_id, $owner_id, $call_id, $campaign, $name, $phone, $status,
        $started_at, $duration_s, $transcript, $summary, $recording_url, 'runtime')
on conflict (employee_id, call_id) do update set
  status = excluded.status, duration_seconds = excluded.duration_seconds,
  transcript = excluded.transcript, summary = excluded.summary,
  recording_url = excluded.recording_url
returning id;
```

Then one row per answered field:

```sql
insert into ac_call_answers
  (call_result_id, employee_id, owner_id, field_key, raw_answer, normalized_answer, confidence)
values ($result_id, $employee_id, $owner_id, $key, $raw, $normalized::jsonb, $confidence)
on conflict (call_result_id, field_key) do update set
  raw_answer = excluded.raw_answer,
  normalized_answer = excluded.normalized_answer,
  confidence = excluded.confidence;
```

- `status` must be one of the locked values: `Ready`, `Calling`, `Connected`, `Completed`, `Qualified`, `Callback`, `Not interested`, `No answer`, `Failed`.
- `source`: `runtime` for real calls, `test` for test calls placed from the console. `sample` is reserved for seeded demo rows created by the console and is always labelled "Sample (not live)" in the UI and exports. The runtime must never write `sample`.
- Never show provider/vendor names in `summary` or anything else that reaches the UI or exports.

## 5. Derived values (computed in the console, not stored)

- **Completion**: `Complete` if every required field that applies (IF/THEN aware) has a non-null normalized answer, `Partial` if some answers exist but a required one is missing, `No response` if none. See `completionOf` in `src/lib/data-collection/analytics.ts`.
- **Export**: one call = one row, one field = one column, flat cells (multi-select joined with `; `, booleans as Yes/No). See `buildExportRows` in `src/lib/data-collection/export.ts`.

## 6. Example (public-opinion survey)

```json
{
  "call": { "call_id": "c_8812", "status": "Completed", "duration_seconds": 164, "source": "runtime" },
  "answers": [
    { "field_key": "constituency", "raw_answer": "Jubilee Hills, sir", "normalized_answer": "Jubilee Hills" },
    { "field_key": "candidate_support", "raw_answer": "I haven't decided yet", "normalized_answer": "Undecided" },
    { "field_key": "undecided_leaning", "raw_answer": "maybe B", "normalized_answer": "Candidate B" },
    { "field_key": "top_issue", "raw_answer": "water problem is big here", "normalized_answer": "Water" },
    { "field_key": "government_satisfaction", "raw_answer": "two", "normalized_answer": 2 },
    { "field_key": "vote_likelihood", "raw_answer": "I'd rather not say", "normalized_answer": "Prefer not to answer" }
  ]
}
```

`support_reason` is not asked because its condition (`candidate_support is not "Undecided"`) did not match.
