import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const demoRequestSchema = z.object({
  interest: z.enum(["voice", "chat", "both"]),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  workEmail: z.string().trim().email("Enter a valid work email").max(255),
  company: z.string().trim().min(1, "Company is required").max(150),
  role: z.string().trim().min(1, "Role is required").max(100),
  phone: z.string().trim().min(5, "Phone is required").max(40),
  callsPerMonth: z.string().trim().max(50).optional(),
  callDirection: z.string().trim().max(50).optional(),
  teamSize: z.string().trim().max(50).optional(),
  whatsappConversationsPerMonth: z.string().trim().max(50).optional(),
  currentWhatsappUsage: z.string().trim().max(100).optional(),
  currentCrm: z.string().trim().max(100).optional(),
  primaryGoal: z.string().trim().min(1, "Primary goal is required").max(500),
}).superRefine((value, context) => {
  if (value.interest !== "chat" && !value.callsPerMonth) context.addIssue({ code: "custom", path: ["callsPerMonth"], message: "Choose an approximate call volume" });
  if (value.interest !== "chat" && !value.callDirection) context.addIssue({ code: "custom", path: ["callDirection"], message: "Choose inbound, outbound, or both" });
  if (value.interest !== "voice" && !value.teamSize) context.addIssue({ code: "custom", path: ["teamSize"], message: "Choose your team size" });
  if (value.interest !== "voice" && !value.whatsappConversationsPerMonth) context.addIssue({ code: "custom", path: ["whatsappConversationsPerMonth"], message: "Choose an approximate conversation volume" });
  if (value.interest !== "voice" && !value.currentWhatsappUsage) context.addIssue({ code: "custom", path: ["currentWhatsappUsage"], message: "Choose your current WhatsApp setup" });
});

export type DemoRequestInput = z.input<typeof demoRequestSchema>;

export const submitDemoRequest = createServerFn({ method: "POST" })
  .inputValidator((input: DemoRequestInput) => demoRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demo_requests").insert({
      interest: data.interest,
      full_name: data.fullName,
      work_email: data.workEmail,
      company: data.company,
      role: data.role,
      phone: data.phone,
      calls_per_month: data.callsPerMonth || null,
      call_direction: data.callDirection || null,
      team_size: data.teamSize || null,
      whatsapp_conversations_per_month: data.whatsappConversationsPerMonth || null,
      current_whatsapp_usage: data.currentWhatsappUsage || null,
      current_crm: data.currentCrm || null,
      primary_goal: data.primaryGoal,
    });
    if (error) throw new Error("We couldn't save your request. Please try again.");
    return { ok: true };
  });
