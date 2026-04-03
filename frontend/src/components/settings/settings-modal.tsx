"use client";

import { useLanguage } from "@/context/language-context";
import { useTheme } from "@/context/theme-context";
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from "@/lib/constants";
import { Modal } from "@/components/common/modal";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onClearHistory: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function SettingsModal({
  open,
  onClose,
  onClearHistory,
  onLogout,
}: SettingsModalProps) {
  const { dictionary, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <Modal
      open={open}
      title={dictionary.settings.title}
      description={dictionary.settings.subtitle}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{dictionary.topbar.language}</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void setLanguage(option.value)}
                className={`rounded-full px-4 py-2.5 text-sm transition ${
                  language === option.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-muted hover:bg-hover hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{dictionary.topbar.theme}</p>
          <div className="flex flex-wrap gap-2">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void setTheme(option.value)}
                className={`rounded-full px-4 py-2.5 text-sm transition ${
                  theme === option.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-muted hover:bg-hover hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void onClearHistory()}
            className="rounded-3xl bg-background px-5 py-4 text-left text-sm text-foreground transition hover:bg-hover"
          >
            {dictionary.settings.clearHistory}
          </button>
          <button
            type="button"
            onClick={() => void onLogout()}
            className="rounded-3xl bg-background px-5 py-4 text-left text-sm text-foreground transition hover:bg-hover"
          >
            {dictionary.settings.logout}
          </button>
        </div>
      </div>
    </Modal>
  );
}
