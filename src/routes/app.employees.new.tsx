import { createFileRoute } from "@tanstack/react-router";
import { CreateEmployeeWizard } from "@/components/employees/wizard/wizard-shell";

export const Route = createFileRoute("/app/employees/new")({
  head: () => ({ meta: [{ title: "Create AI Employee · AstraConnect" }] }),
  component: CreateEmployeeWizard,
});
