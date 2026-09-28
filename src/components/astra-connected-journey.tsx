import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  Check,
  CircleCheck,
  FileText,
  MessageCircle,
  Phone,
  Play,
  RotateCcw,
  Tag,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JourneyMode = "voice" | "chat" | "connected";

/** Single explicit journey state — never derive UI from scattered booleans. */
type JourneyState =
  | "idle"
  | "voice_dialing"
  | "voice_connected"
  | "voice_transcript"
  | "outcome_extracted"
  | "chat_handoff"
  | "chat_followup"
  | "next_action"
  | "chat_enquiry"
  | "owner_assigned"
  | "tag_added"
  | "pipeline_qualified"
  | "followup_created"
  | "complete";

const modeLabels: Record<JourneyMode, string> = {
  voice: "Voice only",
  chat: "Chat only",
  connected: "Connected",
};

const SEQUENCES: Record<JourneyMode, JourneyState[]> = {
  connected: [
    "voice_dialing",
    "voice_connected",
    "voice_transcript",
    "outcome_extracted",
    "chat_handoff",
    "chat_followup",
    "next_action",
    "complete",
  ],
  voice: [
    "voice_dialing",
    "voice_connected",
    "voice_transcript",
    "outcome_extracted",
    "complete",
  ],
  chat: [
    "chat_enquiry",
    "owner_assigned",
    "tag_added",
    "pipeline_qualified",
    "followup_created",
    "complete",
  ],
};

const REPLAY_GAP_MS = 400;
const STEP_MS = 1150;

const guideBeats = {
  start: "Watch how one customer moves across Voice and Chat.",
  voiceEarly: "Astra Voice qualifies the enquiry.",
  voiceOutcome: "This call becomes structured context.",
  chat: "Astra Chat turns enquiries into accountable follow-up.",
  connectedBridge: "Structured context hands off to Chat follow-up.",
  done: "One customer. One context. One next step.",
} as const;

const fieldDefs = [
  { key: "interest", label: "INTEREST", empty: "—", value: "Product demo" },
  { key: "team", label: "TEAM", empty: "—", value: "Sales" },
  { key: "timing", label: "TIMING", empty: "—", value: "This week" },
  { key: "status", label: "STATUS", empty: "—", value: "Qualified" },
  { key: "next", label: "NEXT ACTION", empty: "—", value: "Send details + book demo" },
] as const;

const connectedChecks = [
  "Call completed",
  "Qualified",
  "Follow-up created",
  "Owner assigned",
  "Next action created",
] as const;

const voiceOnlyChecks = ["Call completed", "Qualified", "Next action captured"] as const;

const chatOnlyChecks = [
  "Enquiry received",
  "Owner assigned",
  "Follow-up created",
  "Qualified",
] as const;

const pipelineSteps = ["New lead", "Contacted", "Qualified"] as const;

function guideText(mode: JourneyMode, state: JourneyState): string {
  if (state === "idle") {
    if (mode === "voice") return guideBeats.voiceEarly;
    if (mode === "chat") return guideBeats.chat;
    return guideBeats.start;
  }
  if (state === "complete") return guideBeats.done;
  if (mode === "chat") return guideBeats.chat;
  if (
    state === "voice_dialing" ||
    state === "voice_connected" ||
    state === "voice_transcript"
  ) {
    return guideBeats.voiceEarly;
  }
  if (state === "outcome_extracted") return guideBeats.voiceOutcome;
  if (mode === "connected") return guideBeats.connectedBridge;
  return guideBeats.voiceOutcome;
}

function CustomerCard({
  complete = false,
  status = "New enquiry",
  compact = false,
}: {
  complete?: boolean;
  status?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", compact && "gap-2.5")}>
      <motion.span
        animate={
          complete
            ? { boxShadow: ["0 0 0 0 color-mix(in oklab, var(--chat) 55%, transparent)", "0 0 0 8px transparent"] }
            : {}
        }
        transition={{ duration: 0.85 }}
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-guide-border bg-guide font-semibold text-guide-foreground",
          compact ? "size-10 text-xs" : "size-12 text-sm",
        )}
      >
        AM
      </motion.span>
      <div className="min-w-0">
        <b className={cn("block truncate", compact ? "text-sm" : "text-[15px]")}>Arjun Mehta</b>
        <p className="truncate text-xs text-guide-muted">New enquiry · Product demo interest</p>
        <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-guide-muted">
          <span className={cn("size-1.5 rounded-full", complete ? "bg-chat" : "bg-voice")} />
          {status}
        </p>
      </div>
    </div>
  );
}

function VoicePanel({ state, reduced }: { state: JourneyState; reduced: boolean }) {
  const dialing = state === "voice_dialing";
  const connected =
    state === "voice_connected" ||
    state === "voice_transcript" ||
    state === "outcome_extracted" ||
    state === "chat_handoff" ||
    state === "chat_followup" ||
    state === "next_action" ||
    state === "complete";
  const transcript =
    state === "voice_transcript" ||
    state === "outcome_extracted" ||
    state === "chat_handoff" ||
    state === "chat_followup" ||
    state === "next_action" ||
    state === "complete";
  const qualified =
    state === "outcome_extracted" ||
    state === "chat_handoff" ||
    state === "chat_followup" ||
    state === "next_action" ||
    state === "complete";
  const live = connected && !qualified;
  const statusLabel = !connected && !dialing
    ? "READY"
    : !connected
      ? "DIALING…"
      : qualified
        ? "QUALIFIED · 02:18"
        : "CONNECTED · 02:18";

  return (
    <motion.article
      layout
      className="relative flex min-w-0 flex-col rounded-[16px] border border-voice/45 bg-guide/90 p-4 shadow-panel backdrop-blur-sm sm:p-5"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <motion.span
            animate={live && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 1.2, repeat: live && !reduced ? Infinity : 0 }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-voice/15 text-voice"
          >
            <Phone className="size-4" />
          </motion.span>
          <div className="min-w-0">
            <p className="eyebrow text-[10px] text-voice">ASTRA VOICE</p>
            <b className="block text-[15px]">Maya</b>
            <p className="text-xs text-guide-muted">AI Employee · outbound call</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
            qualified ? "bg-chat/15 text-chat" : connected || dialing ? "bg-voice/15 text-voice" : "bg-guide-border/40 text-guide-muted",
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {(["Dialing", "Connected", "Qualified"] as const).map((label, i) => {
          const active =
            (i === 0 && dialing) ||
            (i === 1 && connected && !qualified) ||
            (i === 2 && qualified);
          const done =
            (i === 0 && (connected || qualified)) ||
            (i === 1 && qualified) ||
            (i === 2 && qualified);
          return (
            <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  active || done ? "bg-voice" : "bg-guide-border",
                  active && !reduced && "animate-pulse",
                )}
              />
              <span className={cn("truncate text-[10px] font-semibold", active || done ? "text-voice" : "text-guide-muted")}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex h-9 items-end gap-1" aria-label={connected ? "Connected call waveform" : dialing ? "Dialing" : "Idle"}>
        {[8, 18, 12, 26, 16, 22, 9, 20, 14, 24, 11, 17, 13, 21].map((height, index) => (
          <motion.i
            key={index}
            animate={
              live && !reduced
                ? { height: [5, height, 6] }
                : connected
                  ? { height: Math.max(6, height * 0.45) }
                  : { height: 5 }
            }
            transition={{ duration: 0.7, repeat: live && !reduced ? Infinity : 0, delay: index * 0.035 }}
            className="w-1 rounded-full bg-voice"
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {transcript ? (
          <motion.div
            key="transcript"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -4 }}
            className="mt-4 space-y-2.5 border-t border-guide-border pt-3 text-[13px] leading-relaxed"
          >
            <p className="text-[10px] font-bold tracking-[0.14em] text-guide-muted">LIVE TRANSCRIPT</p>
            <p>
              <b className="text-voice">Maya</b> “What are you looking for?”
            </p>
            <p>
              <b>Arjun</b> “We’d like a{" "}
              <span data-capture className="rounded bg-voice/15 px-1 font-semibold text-voice">
                demo
              </span>{" "}
              for our{" "}
              <span data-capture className="rounded bg-voice/15 px-1 font-semibold text-voice">
                sales team
              </span>
              .”
            </p>
            <p>
              <b className="text-voice">Maya</b> “When works?”
            </p>
            <p>
              <b>Arjun</b> “
              <span data-capture className="rounded bg-voice/15 px-1 font-semibold text-voice">
                This week
              </span>{" "}
              would be good.”
            </p>
            {qualified && (
              <p className="flex items-center gap-1.5 pt-1 text-[12px] font-semibold text-chat">
                <CircleCheck className="size-3.5" /> Phrases extracted · call qualified
              </p>
            )}
            <p className="pt-0.5 text-[10px] font-semibold tracking-wide text-guide-muted">ILLUSTRATIVE DEMO</p>
          </motion.div>
        ) : (
          <motion.div
            key="voice-idle"
            initial={false}
            className="mt-4 rounded-[12px] border border-dashed border-voice/25 bg-voice/5 px-3 py-3 text-[12px] text-guide-muted"
          >
            {dialing ? "Maya is dialing the enquiry…" : connected ? "Capturing conversation…" : "Press Watch to start the call."}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function OutcomePanel({
  filled,
  emphasize,
  dense = false,
}: {
  filled: boolean;
  emphasize?: boolean;
  dense?: boolean;
}) {
  return (
    <motion.article
      layout
      className={cn(
        "relative flex min-w-0 flex-col rounded-[16px] border bg-guide/95 p-4 backdrop-blur-sm transition-colors sm:p-5",
        filled || emphasize
          ? "border-voice/55 shadow-[0_18px_48px_color-mix(in_oklab,var(--voice)_16%,transparent)]"
          : "border-guide-border shadow-panel",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-[10px] text-guide-muted">CONVERSATION OUTCOME</p>
          <b className="mt-1 block text-[15px]">Customer context</b>
        </div>
        {filled && <CircleCheck className="size-5 shrink-0 text-voice" />}
      </div>
      <div className={cn("mt-4 grid gap-2", dense && "gap-1.5")}>
        {fieldDefs.map((field) => (
          <div
            key={field.key}
            data-field={field.key}
            className={cn(
              "rounded-[10px] border border-guide-border bg-guide px-3 transition-opacity",
              dense ? "py-2" : "py-2.5",
              filled ? "opacity-100" : "opacity-40",
            )}
          >
            <p className="text-[9px] font-bold tracking-[0.12em] text-guide-muted">{field.label}</p>
            <p className="mt-1 text-[13px] font-semibold" data-field-value>
              {filled ? field.value : field.empty}
            </p>
          </div>
        ))}
      </div>
      {filled && (
        <p className="mt-3 text-[11px] font-semibold leading-snug text-voice">
          Structured from the call — ready for follow-up.
        </p>
      )}
    </motion.article>
  );
}

function ChatConnectedPanel({ state, reduced }: { state: JourneyState; reduced: boolean }) {
  const handoff =
    state === "chat_handoff" ||
    state === "chat_followup" ||
    state === "next_action" ||
    state === "complete";
  const showNext =
    state === "chat_followup" || state === "next_action" || state === "complete";
  const done = state === "complete" || state === "next_action";

  return (
    <motion.article
      layout
      className="relative flex min-w-0 flex-col gap-3 rounded-[16px] border border-chat/45 bg-guide/90 p-4 shadow-panel backdrop-blur-sm sm:p-5"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-chat/15 text-chat">
            <MessageCircle className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow text-[10px] text-chat">ASTRA CHAT</p>
            <b className="block truncate text-[15px]">WhatsApp follow-up</b>
            <p className="text-xs text-guide-muted">Arjun Mehta</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
            handoff ? "bg-chat/15 text-chat" : "bg-guide-border/40 text-guide-muted",
          )}
        >
          {done ? "Owner · Ananya" : handoff ? "Qualified" : "Standing by"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {handoff ? (
          <motion.div
            key="thread"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0 }}
            className="space-y-2"
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-chat">
              <Check className="size-3.5" /> {done ? "Handoff complete - Voice to Chat" : "Green handoff from Voice context"}
            </p>
            <div className="ml-3 rounded-[12px] rounded-br-sm bg-chat/15 p-3 text-[13px] leading-relaxed">
              Thanks for speaking with us, Arjun.
              <br />
              Here are the demo details we discussed.
            </div>
            <div className="ml-3 flex items-center gap-2 rounded-[10px] border border-guide-border p-2.5 text-[12px]">
              <FileText className="size-4 shrink-0 text-chat" />
              <span className="min-w-0 truncate">AstraConnect overview.pdf</span>
            </div>
            <p className="text-[10px] font-semibold tracking-wide text-guide-muted">Illustrative demo</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={false}
            className="rounded-[12px] border border-dashed border-chat/30 bg-chat/5 p-3 text-[12px] text-guide-muted"
          >
            Follow-up ready when structured context arrives.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNext && (
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0 }}
            className="space-y-3 border-t border-guide-border pt-3"
          >
            <div>
              <p className="eyebrow text-[9px] text-chat">NEXT ACTION</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                <div>
                  <dt className="text-guide-muted">Owner</dt>
                  <dd className="mt-0.5 font-semibold">Ananya</dd>
                </div>
                <div>
                  <dt className="text-guide-muted">Action</dt>
                  <dd className="mt-0.5 font-semibold">Demo this week</dd>
                </div>
              </dl>
            </div>
            <div className="flex items-center gap-2 rounded-[10px] border border-chat/40 bg-chat/10 p-2.5">
              <CalendarDays className="size-4 shrink-0 text-chat" />
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-chat">FOLLOW-UP CREATED</p>
                <b className="block truncate text-[12px]">Demo follow-up · Tomorrow 10:30 AM</b>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ChatSoloPanel({ state, reduced }: { state: JourneyState; reduced: boolean }) {
  const enquiry =
    state === "chat_enquiry" ||
    state === "owner_assigned" ||
    state === "tag_added" ||
    state === "pipeline_qualified" ||
    state === "followup_created" ||
    state === "complete";
  const owner =
    state === "owner_assigned" ||
    state === "tag_added" ||
    state === "pipeline_qualified" ||
    state === "followup_created" ||
    state === "complete";
  const tagged =
    state === "tag_added" ||
    state === "pipeline_qualified" ||
    state === "followup_created" ||
    state === "complete" ||
    enquiry;
  const qualified =
    state === "pipeline_qualified" ||
    state === "followup_created" ||
    state === "complete";
  const followup = state === "followup_created" || state === "complete";
  const done = state === "complete";
  const pipelineActive = done || followup || qualified ? 2 : owner ? 1 : enquiry ? 0 : -1;

  return (
    <div className="grid min-w-0 gap-3.5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-stretch">
      <motion.article
        layout
        className="relative flex min-w-0 flex-col gap-3 rounded-[16px] border border-chat/45 bg-guide/90 p-4 shadow-panel backdrop-blur-sm sm:p-5"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-chat/15 text-chat">
              <MessageCircle className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-[10px] text-chat">ASTRA CHAT</p>
              <b className="block truncate text-[15px]">WhatsApp conversation</b>
              <p className="text-xs text-guide-muted">Arjun Mehta · +91 ··· ··· 4821</p>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-semibold",
              qualified || done ? "bg-chat/15 text-chat" : enquiry ? "bg-chat/10 text-chat" : "bg-guide-border/40 text-guide-muted",
            )}
          >
            {qualified || done ? "Qualified" : enquiry ? "Open" : "Inbox"}
          </span>
        </div>

        <div className="space-y-2.5 rounded-[12px] border border-guide-border/60 bg-guide/50 p-3 sm:min-h-[140px]">
          <AnimatePresence>
            {enquiry && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mr-6 rounded-[12px] rounded-bl-sm bg-guide-border/40 p-3 text-[13px] leading-relaxed"
              >
                Hi, can we arrange a product demo?
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {owner && (
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-6 rounded-[12px] rounded-br-sm bg-chat/15 p-3 text-[13px] leading-relaxed"
              >
                Absolutely. I can help with that.
              </motion.div>
            )}
          </AnimatePresence>
          {!enquiry && (
            <div className="rounded-[10px] border border-dashed border-guide-border/70 bg-guide/40 p-3 text-[12px] text-guide-muted">
              Inbox ready — WhatsApp enquiry arrives next.
            </div>
          )}
          <p className="pt-1 text-[10px] font-semibold tracking-wide text-guide-muted">Illustrative demo</p>
        </div>
      </motion.article>

      <motion.article
        layout
        className="relative flex min-w-0 flex-col gap-3 rounded-[16px] border border-chat/40 bg-guide/90 p-4 shadow-panel backdrop-blur-sm sm:p-5"
      >
        <div>
          <p className="eyebrow text-[10px] text-chat">CRM ACTIONS</p>
          <b className="mt-1 block text-[15px]">Accountable follow-up</b>
        </div>

        <div className="grid gap-2">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-opacity",
              owner ? "border-chat/35 bg-chat/10 opacity-100" : "border-guide-border bg-guide opacity-45",
            )}
          >
            <UserRound className="size-4 shrink-0 text-chat" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-wide text-guide-muted">OWNER</p>
              <b className="block text-[13px]">{owner ? "Ananya · Sales" : "Unassigned"}</b>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-opacity",
              tagged && enquiry ? "border-chat/35 bg-chat/10 opacity-100" : "border-guide-border bg-guide opacity-45",
            )}
          >
            <Tag className="size-4 shrink-0 text-chat" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-wide text-guide-muted">TAG</p>
              <b className="block text-[13px]">{enquiry ? "New enquiry" : "—"}</b>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-opacity",
              qualified ? "border-chat/35 bg-chat/10 opacity-100" : "border-guide-border bg-guide opacity-45",
            )}
          >
            <CircleCheck className="size-4 shrink-0 text-chat" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-wide text-guide-muted">STAGE</p>
              <b className="block text-[13px]">{qualified ? "Qualified" : enquiry ? "New lead" : "—"}</b>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-opacity",
              followup ? "border-chat/35 bg-chat/10 opacity-100" : "border-guide-border bg-guide opacity-45",
            )}
          >
            <CalendarDays className="size-4 shrink-0 text-chat" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold tracking-wide text-guide-muted">NEXT ACTION</p>
              <b className="block text-[13px]">{followup ? "Share demo details" : "—"}</b>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-guide-border pt-3">
          <p className="text-[10px] font-semibold text-guide-muted">PIPELINE</p>
          <div className="mt-2.5 flex items-center gap-1">
            {pipelineSteps.map((step, i) => {
              const active = i <= pipelineActive;
              return (
                <div key={step} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      active ? "bg-chat" : "bg-guide-border",
                      i === pipelineActive && "ring-2 ring-chat/40",
                    )}
                  />
                  <span className={cn("truncate text-[10px]", i === pipelineActive ? "font-semibold text-chat" : "text-guide-muted")}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
          {done && (
            <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-chat">
              <Check className="size-3.5" /> Chat works independently — no Voice required
            </p>
          )}
        </div>
      </motion.article>
    </div>
  );
}

function BottomSummary({ mode, visible }: { mode: JourneyMode; visible: boolean }) {
  if (!visible) return null;
  const items = mode === "voice" ? voiceOnlyChecks : mode === "chat" ? chatOnlyChecks : connectedChecks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 mt-3.5 rounded-[14px] border border-guide-border bg-guide/95 px-4 py-3 shadow-panel"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full border border-guide-border bg-guide text-[11px] font-semibold">
            AM
          </span>
          <b className="text-sm">ARJUN MEHTA</b>
        </div>
        {items.map((item, index) => (
          <motion.span
            key={item}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="flex items-center gap-1.5 text-[12px] font-medium text-guide-foreground"
          >
            <Check className="size-3.5 text-chat" />
            {item}
          </motion.span>
        ))}
      </div>
      <p className="eyebrow mt-3 text-center text-[10px] text-guide-foreground sm:text-left">
        {mode === "voice"
          ? "THIS CALL BECOMES STRUCTURED CONTEXT."
          : mode === "chat"
            ? "ASTRA CHAT TURNS ENQUIRIES INTO ACCOUNTABLE FOLLOW-UP."
            : "ONE CUSTOMER. ONE CONTEXT. ONE NEXT STEP."}
      </p>
    </motion.div>
  );
}

function JourneyPaths({
  mode,
  state,
  voicePathRef,
  chatPathRef,
  voiceSignalRef,
  chatSignalRef,
  mobile = false,
}: {
  mode: JourneyMode;
  state: JourneyState;
  voicePathRef: RefObject<SVGPathElement | null>;
  chatPathRef: RefObject<SVGPathElement | null>;
  voiceSignalRef: RefObject<SVGCircleElement | null>;
  chatSignalRef: RefObject<SVGCircleElement | null>;
  mobile?: boolean;
}) {
  const uid = useId();
  const voiceLit =
    state === "voice_dialing" ||
    state === "voice_connected" ||
    state === "voice_transcript" ||
    state === "outcome_extracted" ||
    state === "chat_handoff" ||
    state === "chat_followup" ||
    state === "next_action" ||
    state === "complete";
  const chatLit =
    state === "chat_handoff" ||
    state === "chat_followup" ||
    state === "next_action" ||
    state === "chat_enquiry" ||
    state === "owner_assigned" ||
    state === "tag_added" ||
    state === "pipeline_qualified" ||
    state === "followup_created" ||
    state === "complete";

  if (mobile) {
    const showVoice = mode !== "chat";
    const showChat = mode !== "voice";
    return (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full lg:hidden"
        viewBox="0 0 360 980"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {showVoice && (
          <>
            <path d="M180 64 L180 260" fill="none" stroke="currentColor" className="text-guide-border" strokeWidth="1.5" />
            <path
              ref={voicePathRef}
              d="M180 64 L180 260"
              fill="none"
              stroke="currentColor"
              className={cn("text-voice transition-opacity", voiceLit ? "opacity-100" : "opacity-30")}
              strokeWidth="2"
            />
            <circle ref={voiceSignalRef} r="4.5" fill="currentColor" className="text-voice" opacity="0" />
          </>
        )}
        {showChat && (
          <>
            <path
              d={mode === "chat" ? "M180 64 L180 240" : "M180 520 L180 760"}
              fill="none"
              stroke="currentColor"
              className="text-guide-border"
              strokeWidth="1.5"
            />
            <path
              ref={chatPathRef}
              d={mode === "chat" ? "M180 64 L180 240" : "M180 520 L180 760"}
              fill="none"
              stroke="currentColor"
              className={cn("text-chat transition-opacity", chatLit || mode === "chat" ? "opacity-100" : "opacity-30")}
              strokeWidth="2"
            />
            <circle ref={chatSignalRef} r="4.5" fill="currentColor" className="text-chat" opacity="0" />
          </>
        )}
      </svg>
    );
  }

  // Blue: Customer → Voice → Context. Green: Context → Chat → Next action.
  const voiceD =
    mode === "voice"
      ? "M600 48 C340 48 210 100 210 210"
      : "M600 48 C380 48 230 110 210 220";
  const chatD =
    mode === "chat"
      ? "M600 48 C600 48 600 140 600 160"
      : "M600 455 C820 455 990 390 990 230";

  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 1200 620"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={uid + "-voice"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--voice)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--voice)" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={uid + "-chat"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--chat)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--chat)" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {mode !== "chat" && (
        <>
          <path d={voiceD} fill="none" stroke="currentColor" className="text-guide-border" strokeWidth="1.5" />
          <path
            ref={voicePathRef}
            d={voiceD}
            fill="none"
            stroke={"url(#" + uid + "-voice)"}
            className={cn("transition-opacity", voiceLit ? "opacity-100" : "opacity-35")}
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <circle ref={voiceSignalRef} r="5" fill="currentColor" className="text-voice" opacity="0" />
        </>
      )}

      {mode !== "voice" && (
        <>
          <path d={chatD} fill="none" stroke="currentColor" className="text-guide-border" strokeWidth="1.5" />
          <path
            ref={chatPathRef}
            d={chatD}
            fill="none"
            stroke={"url(#" + uid + "-chat)"}
            className={cn("transition-opacity", chatLit || mode === "chat" ? "opacity-100" : "opacity-35")}
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <circle ref={chatSignalRef} r="5" fill="currentColor" className="text-chat" opacity="0" />
        </>
      )}
    </svg>
  );
}

function clearPathEl(path: SVGPathElement | null, signal: SVGCircleElement | null) {
  if (path) {
    path.style.strokeDasharray = "";
    path.style.strokeDashoffset = "";
  }
  if (signal) {
    signal.style.opacity = "0";
    signal.removeAttribute("transform");
    signal.style.transform = "";
  }
}

export function ConnectedStory() {
  const reduced = useReducedMotion() ?? false;
  const [mode, setMode] = useState<JourneyMode>("connected");
  const [journeyState, setJourneyState] = useState<JourneyState>("idle");
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const animeAnimations = useRef<{ cancel: () => void }[]>([]);
  const runIdRef = useRef(0);
  const voicePathRef = useRef<SVGPathElement>(null);
  const chatPathRef = useRef<SVGPathElement>(null);
  const voiceSignalRef = useRef<SVGCircleElement>(null);
  const chatSignalRef = useRef<SVGCircleElement>(null);
  const mobileVoicePathRef = useRef<SVGPathElement>(null);
  const mobileChatPathRef = useRef<SVGPathElement>(null);
  const mobileVoiceSignalRef = useRef<SVGCircleElement>(null);
  const mobileChatSignalRef = useRef<SVGCircleElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const hardStop = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    animeAnimations.current.forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        /* ignore stale anime handles */
      }
    });
    animeAnimations.current = [];
  }, []);

  const resetVisuals = useCallback(() => {
    clearPathEl(voicePathRef.current, voiceSignalRef.current);
    clearPathEl(chatPathRef.current, chatSignalRef.current);
    clearPathEl(mobileVoicePathRef.current, mobileVoiceSignalRef.current);
    clearPathEl(mobileChatPathRef.current, mobileChatSignalRef.current);
    if (canvasRef.current) {
      canvasRef.current.querySelectorAll<HTMLElement>("[data-field]").forEach((el) => {
        el.style.opacity = "";
        el.style.transform = "";
      });
      canvasRef.current.querySelectorAll<HTMLElement>("[data-capture]").forEach((el) => {
        el.style.transform = "";
      });
    }
  }, []);

  const animateTrack = useCallback(
    async (kind: "voice" | "chat", runId: number) => {
      if (reduced) return;
      if (runId !== runIdRef.current) return;
      const pairs =
        kind === "voice"
          ? [
              [voicePathRef.current, voiceSignalRef.current],
              [mobileVoicePathRef.current, mobileVoiceSignalRef.current],
            ]
          : [
              [chatPathRef.current, chatSignalRef.current],
              [mobileChatPathRef.current, mobileChatSignalRef.current],
            ];
      const { animate, createMotionPath } = await import("animejs");
      if (runId !== runIdRef.current) return;
      for (const [path, signal] of pairs) {
        if (!path || !signal) continue;
        if (runId !== runIdRef.current) return;
        const length = path.getTotalLength();
        path.style.strokeDasharray = String(length);
        path.style.strokeDashoffset = String(length);
        const motionPath = createMotionPath(path);
        const pathAnim = animate(path, { strokeDashoffset: [length, 0], duration: 1100, ease: "inOut(3)" });
        const signalAnim = animate(signal, { ...motionPath, duration: 1100, ease: "inOut(3)", opacity: [0, 1, 1, 0] });
        animeAnimations.current.push(pathAnim, signalAnim);
      }
    },
    [reduced],
  );

  const animateExtraction = useCallback(
    async (runId: number) => {
      if (reduced || !canvasRef.current) return;
      if (runId !== runIdRef.current) return;
      const phrases = canvasRef.current.querySelectorAll<HTMLElement>("[data-capture]");
      const fields = canvasRef.current.querySelectorAll<HTMLElement>("[data-field]");
      const { animate, stagger } = await import("animejs");
      if (runId !== runIdRef.current) return;
      animeAnimations.current.push(
        animate(phrases, { scale: [1, 1.1, 1], duration: 700, delay: stagger(120), ease: "out(3)" }),
        animate(fields, {
          translateY: [10, 0],
          opacity: [0.4, 1],
          duration: 560,
          delay: stagger(95),
          ease: "out(3)",
          complete: () => {
            fields.forEach((el) => {
              el.style.opacity = "";
              el.style.transform = "";
            });
          },
        }),
      );
    },
    [reduced],
  );

  const play = useCallback(() => {
    hardStop();
    const runId = ++runIdRef.current;
    resetVisuals();
    setJourneyState("idle");
    setRunning(true);

    const sequence = SEQUENCES[mode];

    const arm = (delay: number, fn: () => void) => {
      const timer = window.setTimeout(() => {
        if (runId !== runIdRef.current) return;
        fn();
      }, delay);
      timers.current.push(timer);
    };

    if (reduced) {
      arm(REPLAY_GAP_MS, () => {
        setJourneyState("complete");
        setRunning(false);
      });
      return;
    }

    sequence.forEach((next, index) => {
      arm(REPLAY_GAP_MS + index * STEP_MS, () => {
        setJourneyState(next);
        if (next === "voice_dialing") void animateTrack("voice", runId);
        if (next === "outcome_extracted") void animateExtraction(runId);
        if (next === "chat_handoff" || next === "chat_enquiry") void animateTrack("chat", runId);
        if (next === "complete") setRunning(false);
      });
    });
  }, [animateExtraction, animateTrack, hardStop, mode, reduced, resetVisuals]);

  const switchMode = useCallback(
    (next: JourneyMode) => {
      if (next === mode) return;
      hardStop();
      runIdRef.current += 1;
      resetVisuals();
      setMode(next);
      setJourneyState("idle");
      setRunning(false);
    },
    [hardStop, mode, resetVisuals],
  );

  useEffect(() => () => hardStop(), [hardStop]);

  useEffect(() => {
    if (journeyState !== "outcome_extracted" && journeyState !== "complete") return;
    if (!canvasRef.current) return;
    canvasRef.current.querySelectorAll<HTMLElement>("[data-field]").forEach((el) => {
      el.style.opacity = "";
      el.style.transform = "";
    });
  }, [journeyState]);

  const voiceVisible = mode !== "chat";
  const chatVisible = mode !== "voice";
  const outcomeVisible = mode !== "chat";
  const outcomeFilled =
    mode !== "chat" &&
    (journeyState === "outcome_extracted" ||
      journeyState === "chat_handoff" ||
      journeyState === "chat_followup" ||
      journeyState === "next_action" ||
      journeyState === "complete");
  const showSummary = journeyState === "complete";
  const isComplete = journeyState === "complete";
  const isIdle = journeyState === "idle";

  const customerStatus =
    mode === "chat"
      ? isIdle
        ? "New enquiry"
        : isComplete
          ? "Complete"
          : "Chat follow-up"
      : isIdle
        ? "New enquiry"
        : journeyState === "voice_dialing" ||
            journeyState === "voice_connected" ||
            journeyState === "voice_transcript"
          ? "Voice call"
          : journeyState === "outcome_extracted"
            ? "Qualified"
            : isComplete
              ? "Complete"
              : "Follow-up";

  const ctaLabel = isComplete ? "Replay journey ↻" : running ? "Running…" : "Watch journey →";

  return (
    <section
      id="connected"
      className="relative overflow-x-clip bg-guide py-16 text-guide-foreground sm:py-20"
      data-guide="Watch one customer move from enquiry to a clear next action across Voice and Chat."
      data-guide-tone="both"
      data-journey-state={journeyState}
      data-journey-mode={mode}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-700",
          journeyState === "voice_dialing" ||
            journeyState === "voice_connected" ||
            journeyState === "voice_transcript" ||
            journeyState === "outcome_extracted"
            ? "bg-[radial-gradient(circle_at_22%_48%,color-mix(in_oklab,var(--voice)_11%,transparent),transparent_38%)]"
            : journeyState === "chat_handoff" ||
                journeyState === "chat_followup" ||
                journeyState === "next_action" ||
                journeyState === "chat_enquiry" ||
                journeyState === "owner_assigned" ||
                journeyState === "tag_added" ||
                journeyState === "pipeline_qualified" ||
                journeyState === "followup_created" ||
                journeyState === "complete"
              ? "bg-[radial-gradient(circle_at_78%_52%,color-mix(in_oklab,var(--chat)_10%,transparent),transparent_40%)]"
              : "opacity-0",
        )}
        aria-hidden="true"
      />

      <div className="site-container relative">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow text-chat">CONNECTED SETUP</p>
            <span className="rounded-full border border-guide-border px-2.5 py-1 text-[10px] font-semibold">
              ILLUSTRATIVE DEMO
            </span>
          </div>
          <h2 className="section-title mt-4 max-w-3xl text-balance">
            Two products.
            <br />
            Connected when you choose.
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-guide-muted">
            Astra Voice and Astra Chat work independently.
            <br />
            Connect them when your customer journey needs both.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div
            role="group"
            aria-label="Journey mode"
            className="grid grid-cols-3 rounded-[12px] border border-guide-border bg-guide/80 p-1"
          >
            {(["voice", "chat", "connected"] as const).map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                aria-pressed={mode === value}
                onClick={() => switchMode(value)}
                className={cn(
                  "min-w-0 rounded-[10px] px-2 text-xs text-guide-muted hover:bg-guide-border hover:text-guide-foreground",
                  mode === value && "bg-guide-border text-guide-foreground shadow-sm",
                )}
              >
                {modeLabels[value]}
              </Button>
            ))}
          </div>
          <Button
            onClick={play}
            disabled={running}
            className="h-11 w-full rounded-[12px] bg-guide-foreground text-guide hover:bg-guide-muted sm:w-auto"
          >
            <span>{isComplete ? <RotateCcw /> : <Play />}</span>
            {ctaLabel}
          </Button>
        </div>

        <div
          ref={canvasRef}
          className="relative mx-auto mt-6 w-full rounded-[18px] border border-guide-border bg-guide/75 p-3 pb-4 shadow-panel sm:p-5 lg:w-[95%] lg:max-w-[1280px] lg:p-5 lg:pb-4"
        >
          <JourneyPaths
            mode={mode}
            state={journeyState}
            voicePathRef={voicePathRef}
            chatPathRef={chatPathRef}
            voiceSignalRef={voiceSignalRef}
            chatSignalRef={chatSignalRef}
          />
          <JourneyPaths
            mode={mode}
            state={journeyState}
            voicePathRef={mobileVoicePathRef}
            chatPathRef={mobileChatPathRef}
            voiceSignalRef={mobileVoiceSignalRef}
            chatSignalRef={mobileChatSignalRef}
            mobile
          />

          <div className="relative z-10 w-full rounded-[14px] border border-guide-border bg-guide px-4 py-3 shadow-panel">
            <CustomerCard complete={showSummary} status={customerStatus} />
          </div>

          <div
            className={cn(
              "relative z-10 mt-4 hidden gap-3.5 lg:mt-4 lg:grid lg:items-stretch",
              mode === "connected" && "lg:grid-cols-[1.02fr_0.96fr_1.02fr]",
              mode === "voice" && "lg:grid-cols-[1.05fr_1fr] lg:gap-4",
              mode === "chat" && "lg:grid-cols-1",
            )}
          >
            {mode === "chat" ? (
              <ChatSoloPanel state={journeyState} reduced={reduced} />
            ) : (
              <>
                {voiceVisible && <VoicePanel state={journeyState} reduced={reduced} />}
                {outcomeVisible && (
                  <OutcomePanel
                    filled={outcomeFilled}
                    emphasize={mode === "connected" && outcomeFilled}
                    dense={mode === "connected"}
                  />
                )}
                {chatVisible && <ChatConnectedPanel state={journeyState} reduced={reduced} />}
              </>
            )}
          </div>

          <div className="relative z-10 mt-4 flex flex-col gap-3 lg:hidden">
            {mode === "chat" ? (
              <ChatSoloPanel state={journeyState} reduced={reduced} />
            ) : (
              <>
                {voiceVisible && <VoicePanel state={journeyState} reduced={reduced} />}
                {outcomeVisible && <OutcomePanel filled={outcomeFilled} />}
                {chatVisible && <ChatConnectedPanel state={journeyState} reduced={reduced} />}
              </>
            )}
          </div>

          <BottomSummary mode={mode} visible={showSummary} />

          <aside
            className="pointer-events-none relative z-20 mt-3 max-w-[220px] lg:absolute lg:right-3 lg:top-3 lg:mt-0"
            aria-live="polite"
          >
            <div className="flex items-start gap-2 rounded-[11px] border border-guide-border bg-guide/95 p-2 shadow-panel backdrop-blur-md">
              <div className="relative mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-guide-border bg-guide">
                <span className="size-1.5 rounded-full bg-gradient-to-r from-voice to-chat" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-[8px] text-guide-muted">ASTRA GUIDE</p>
                <p className="mt-0.5 text-[11px] leading-snug text-guide-muted sm:text-guide-foreground">
                  {guideText(mode, journeyState)}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-5 text-xs text-guide-muted">
          Connected workflows are configured around your business and integrations. No message is sent from this
          illustrative demo.
        </p>
      </div>
    </section>
  );
}
