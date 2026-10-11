"use client";

import { diffLines } from "diff";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/client";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/use-i18n";
import type { Prompt, PromptVersion } from "@/lib/types";
import { Button, Modal } from "./ui";

interface HistoryDialogProps {
  prompt: Prompt | null;
  onClose: () => void;
  onRestored: (message: string) => void;
}

export function HistoryDialog({ prompt, onClose, onRestored }: HistoryDialogProps) {
  const { t } = useI18n();
  return (
    <Modal
      open={prompt !== null}
      onClose={onClose}
      title={prompt ? t("history.title", { title: prompt.title }) : ""}
      wide
    >
      {prompt && (
        <HistoryBody key={prompt.id} prompt={prompt} onClose={onClose} onRestored={onRestored} />
      )}
    </Modal>
  );
}

const asDocument = (
  v: { title: string; description: string; content: string },
  labels: { title: string; description: string },
) => `${labels.title}: ${v.title}\n${labels.description}: ${v.description}\n\n${v.content}\n`;

function HistoryBody({
  prompt,
  onClose,
  onRestored,
}: {
  prompt: Prompt;
  onClose: () => void;
  onRestored: (message: string) => void;
}) {
  const { t, locale } = useI18n();
  const [versions, setVersions] = useState<PromptVersion[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<PromptVersion[]>(`/api/prompts/${prompt.id}/versions`)
      .then((list) => {
        if (cancelled) return;
        setVersions(list);
        setSelected(list[1]?.version ?? list[0]?.version ?? null);
      })
      .catch((cause: Error) => !cancelled && setError(cause.message));
    return () => {
      cancelled = true;
    };
  }, [prompt.id]);

  if (error)
    return (
      <p role="alert" className="text-danger text-sm">
        {error}
      </p>
    );
  if (!versions) return <p className="text-muted text-sm">{t("history.loading")}</p>;

  const latest = versions[0];
  const labels = { title: t("form.title"), description: t("form.description") };
  const chosen = versions.find((version) => version.version === selected);
  const isLatest = chosen?.version === latest?.version;

  const restore = async () => {
    if (!chosen) return;
    try {
      await api(`/api/prompts/${prompt.id}/versions/${chosen.version}/restore`, { method: "POST" });
      onRestored(t("toast.versionRestored", { version: chosen.version }));
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("history.errorRestore"));
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
      <ul
        aria-label={t("history.versions")}
        className="max-h-72 space-y-1 overflow-y-auto md:max-h-[60dvh]"
      >
        {versions.map((version) => (
          <li key={version.id}>
            <button
              type="button"
              aria-current={version.version === selected ? "true" : undefined}
              onClick={() => setSelected(version.version)}
              className={cn(
                "hover:bg-surface-2 w-full rounded-lg px-3 py-2 text-left text-sm",
                version.version === selected && "bg-accent/15 text-accent",
              )}
            >
              <span className="font-medium">
                {t("history.version", { version: version.version })}
                {version.version === latest?.version && ` ${t("history.current")}`}
              </span>
              <span className="text-muted block text-xs">
                {formatDate(version.createdAt, locale)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <section aria-label={t("history.comparison")} className="min-w-0 space-y-3">
        {chosen && latest && (
          <>
            <p className="text-muted text-sm">
              {isLatest
                ? t("history.isCurrent")
                : t("history.changes", { from: chosen.version, to: latest.version })}
            </p>
            <pre className="border-border bg-bg max-h-[50dvh] overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed">
              {diffLines(asDocument(chosen, labels), asDocument(latest, labels)).map(
                (part, index) => (
                  <span
                    key={index}
                    className={cn(
                      "block whitespace-pre-wrap",
                      part.added && "bg-[var(--added)]",
                      part.removed && "bg-[var(--removed)]",
                    )}
                  >
                    {part.added ? "+ " : part.removed ? "− " : "  "}
                    {part.value.replace(/\n$/, "")}
                  </span>
                ),
              )}
            </pre>
            <div className="flex justify-end">
              <Button variant="primary" disabled={isLatest} onClick={() => void restore()}>
                <RotateCcw size={16} aria-hidden />{" "}
                {t("history.restore", { version: chosen.version })}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
