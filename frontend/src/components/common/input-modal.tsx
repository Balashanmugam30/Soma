"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/common/modal";
import { useLanguage } from "@/context/language-context";

export interface SkillFormValue {
  name: string;
  content: string;
}

interface BaseInputModalProps {
  open: boolean;
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  onClose: () => void;
}

interface DefaultInputModalProps extends BaseInputModalProps {
  mode?: "default";
  onConfirm: (value: string) => Promise<void> | void;
}

interface SkillInputModalProps extends BaseInputModalProps {
  mode: "skill";
  onConfirm: (value: SkillFormValue) => Promise<void> | void;
}

type InputModalProps = DefaultInputModalProps | SkillInputModalProps;

export function InputModal({
  open,
  title,
  description,
  placeholder,
  confirmLabel,
  initialValue = "",
  mode = "default",
  onClose,
  onConfirm,
}: InputModalProps) {
  const { dictionary } = useLanguage();
  const [value, setValue] = useState(initialValue);
  const [step, setStep] = useState(1);
  const [skillName, setSkillName] = useState("");
  const [skillContent, setSkillContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValue(initialValue);
    setStep(1);
    setSkillName("");
    setSkillContent("");
    setError(null);
  }, [initialValue, open]);

  async function handleConfirm() {
    if (mode === "skill") {
      if (step === 1) {
        if (!skillName.trim()) {
          return;
        }

        setStep(2);
        return;
      }

      if (!skillContent.trim()) {
        return;
      }
    } else if (!value.trim()) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (mode === "skill") {
        await (onConfirm as SkillInputModalProps["onConfirm"])({
          name: skillName.trim(),
          content: skillContent.trim(),
        });
      } else {
        await (onConfirm as DefaultInputModalProps["onConfirm"])(value.trim());
      }
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : dictionary.modals.saveChangeError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="space-y-4">
        {mode === "skill" ? (
          step === 1 ? (
            <input
              value={skillName}
              onChange={(event) => setSkillName(event.target.value)}
              placeholder="Enter skill name (e.g., PDF Summarizer)"
              className="w-full rounded-3xl bg-background px-5 py-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-foreground/10"
            />
          ) : (
            <textarea
              value={skillContent}
              onChange={(event) => setSkillContent(event.target.value)}
              placeholder="Describe what this skill should do..."
              rows={4}
              className="min-h-32 w-full rounded-3xl bg-background px-5 py-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-foreground/10"
            />
          )
        ) : (
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            rows={4}
            className="min-h-32 w-full rounded-3xl bg-background px-5 py-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-foreground/10"
          />
        )}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <div className="flex justify-end gap-3">
          {mode === "skill" && step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-hover hover:text-foreground"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-hover hover:text-foreground"
          >
            {dictionary.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              submitting ||
              (mode === "skill"
                ? step === 1
                  ? !skillName.trim()
                  : !skillContent.trim()
                : !value.trim())
            }
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? dictionary.common.saving
              : mode === "skill" && step === 1
                ? "Next"
                : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
