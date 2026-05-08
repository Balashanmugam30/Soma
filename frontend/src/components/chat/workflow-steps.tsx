"use client";

import { memo } from "react";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "@/types";

interface WorkflowStepsProps {
  steps: WorkflowStep[];
  visibleCount?: number;
}

export const WorkflowSteps = memo(function WorkflowSteps({
  steps,
  visibleCount = steps.length,
}: WorkflowStepsProps) {
  const { dictionary } = useLanguage();
  const visibleSteps = steps.slice(0, visibleCount);
  const planningSteps = visibleSteps.slice(0, Math.max(1, Math.ceil(visibleSteps.length / 2)));
  const executionSteps = visibleSteps.slice(planningSteps.length);

  return (
    <div className="mt-5 space-y-4">
      <section className="rounded-2xl bg-background px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {dictionary.workspace.planning}
        </p>
        <div className="mt-3 space-y-2">
          {planningSteps.map((step) => (
            <div key={step.id} className="flex items-start gap-3 transition-opacity duration-300">
              <span
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 rounded-full",
                  step.status === "error"
                    ? "bg-rose-500"
                    : step.status === "active"
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
              />
              <p className="text-sm leading-6 text-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-background px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {dictionary.workspace.execution}
        </p>
        <div className="mt-3 space-y-2">
          {executionSteps.length > 0 ? (
            executionSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3 transition-opacity duration-300">
                <span
                  className={cn(
                    "mt-1.5 h-2.5 w-2.5 rounded-full",
                    step.status === "error"
                      ? "bg-rose-500"
                      : step.status === "active"
                        ? "bg-amber-500"
                        : "bg-emerald-500",
                  )}
                />
                <p className="text-sm leading-6 text-foreground">{step.description}</p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-muted">{dictionary.workspace.thinking}</p>
          )}
        </div>
      </section>
    </div>
  );
});
