"use client";

import { useState } from "react";
import { Modal } from "@/components/common/modal";

interface InputModalProps {
  open: boolean;
  title: string;
  description: string;
  placeholder: string;
  confirmLabel: string;
  initialValue?: string;
  onClose: () => void;
  onConfirm: (value: string) => Promise<void> | void;
}

export function InputModal({
  open,
  title,
  description,
  placeholder,
  confirmLabel,
  initialValue = "",
  onClose,
  onConfirm,
}: InputModalProps) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!value.trim()) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onConfirm(value.trim());
      onClose();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Unable to save this change.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="space-y-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className="min-h-32 w-full rounded-3xl bg-background px-5 py-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-foreground/10"
        />
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-hover hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !value.trim()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
