-- Smart AI Employee creation + structured Data Collection (Phase 1).
-- Employees and their Data Collection fields are owned by the signed-in user
-- (RLS: owner_id = auth.uid()). The voice runtime writes call results with the
-- service role; see docs/data-collection-runtime-contract.md.

CREATE TABLE public.ac_employees (
  id text PRIMARY KEY CHECK (char_length(id) BETWEEN 3 AND 64),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  role text NOT NULL DEFAULT '' CHECK (char_length(role) <= 120),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  vertical text NOT NULL DEFAULT 'general',
  research_mode text NOT NULL DEFAULT 'standard' CHECK (research_mode IN ('neutral', 'standard')),
  -- Instructions, opening line, knowledge, workflow attachment, outcomes, setup answers.
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ac_data_fields (
  id text PRIMARY KEY CHECK (char_length(id) BETWEEN 3 AND 64),
  employee_id text NOT NULL REFERENCES public.ac_employees (id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  key text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{0,63}$'),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
  type text NOT NULL CHECK (type IN ('single_select', 'multi_select', 'text', 'long_text', 'number', 'phone', 'email', 'date', 'boolean', 'rating')),
  required boolean NOT NULL DEFAULT false,
  prompt text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'ask' CHECK (source IN ('ask', 'contact')),
  validation_hint text NOT NULL DEFAULT '',
  -- IF/THEN follow-up: {"fieldKey": "...", "operator": "equals|not_equals|includes|is_answered", "value": "..."}
  condition jsonb,
  suggested boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, key)
);
CREATE INDEX ac_data_fields_employee_idx ON public.ac_data_fields (employee_id, position);

CREATE TABLE public.ac_call_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL REFERENCES public.ac_employees (id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  call_id text NOT NULL,
  campaign text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  status text NOT NULL CHECK (status IN ('Ready', 'Calling', 'Connected', 'Completed', 'Qualified', 'Callback', 'Not interested', 'No answer', 'Failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  transcript text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  recording_url text,
  -- 'sample' rows are seeded demo data and must never be presented as live.
  source text NOT NULL DEFAULT 'runtime' CHECK (source IN ('runtime', 'test', 'sample')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, call_id)
);
CREATE INDEX ac_call_results_employee_idx ON public.ac_call_results (employee_id, started_at DESC);

CREATE TABLE public.ac_call_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_result_id uuid NOT NULL REFERENCES public.ac_call_results (id) ON DELETE CASCADE,
  employee_id text NOT NULL REFERENCES public.ac_employees (id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  field_key text NOT NULL,
  raw_answer text NOT NULL DEFAULT '',
  -- string | number | boolean | string[] | null, already mapped to the field's options.
  normalized_answer jsonb,
  confidence real CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (call_result_id, field_key)
);

ALTER TABLE public.ac_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_data_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_call_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ac_call_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY ac_employees_owner ON public.ac_employees FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ac_data_fields_owner ON public.ac_data_fields FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ac_call_results_owner ON public.ac_call_results FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ac_call_answers_owner ON public.ac_call_answers FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ac_employees, public.ac_data_fields, public.ac_call_results, public.ac_call_answers TO authenticated;
GRANT ALL ON public.ac_employees, public.ac_data_fields, public.ac_call_results, public.ac_call_answers TO service_role;

COMMENT ON TABLE public.ac_data_fields IS 'Data Collection fields per AI Employee. Each field key is a Workflow Builder variable ({{data.<key>}}).';
COMMENT ON TABLE public.ac_call_results IS 'One row per call. Results table / export: one call = one row.';
COMMENT ON TABLE public.ac_call_answers IS 'One row per field per call: raw_answer + normalized_answer.';
