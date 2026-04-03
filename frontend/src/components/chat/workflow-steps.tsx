import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/types";

export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.id}
          className={cn(
            "rounded-2xl px-4 py-3 transition",
            step.status === "error"
              ? "bg-rose-500/10 text-rose-500"
              : "bg-background text-foreground",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{step.label}</p>
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                step.status === "complete" && "bg-emerald-500",
                step.status === "active" && "bg-amber-500",
                step.status === "pending" && "bg-muted/40",
                step.status === "error" && "bg-rose-500",
              )}
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
