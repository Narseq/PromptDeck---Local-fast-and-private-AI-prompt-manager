"use client";

import { Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { extractVariables, fillVariables } from "@/lib/variables";
import type { Prompt } from "@/lib/types";
import { Button, Field, inputClass, Modal } from "./ui";

/** Asks for values of {{variables}} and copies the filled-in prompt. */
export function UseDialog({
  prompt,
  onClose,
  onCopy,
}: {
  prompt: Prompt | null;
  onClose: () => void;
  onCopy: (prompt: Prompt, text: string) => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      open={prompt !== null}
      onClose={onClose}
      title={prompt ? t("use.title", { title: prompt.title }) : ""}
    >
      {prompt && <UseForm key={prompt.id} prompt={prompt} onCopy={onCopy} />}
    </Modal>
  );
}

function UseForm({
  prompt,
  onCopy,
}: {
  prompt: Prompt;
  onCopy: (prompt: Prompt, text: string) => void;
}) {
  const { t } = useI18n();
  const variables = useMemo(() => extractVariables(prompt.content), [prompt.content]);
  const [values, setValues] = useState<Record<string, string>>({});
  const preview = fillVariables(prompt.content, values);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onCopy(prompt, preview);
      }}
    >
      {variables.map((name, index) => (
        <Field key={name} label={name}>
          {(id) => (
            <input
              id={id}
              className={inputClass}
              autoFocus={index === 0}
              value={values[name] ?? ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [name]: event.target.value }))
              }
              placeholder={t("use.valueFor", { name })}
            />
          )}
        </Field>
      ))}
      <div>
        <p className="mb-1.5 text-sm font-medium">{t("use.preview")}</p>
        <pre
          aria-live="polite"
          className="border-border bg-bg max-h-64 overflow-auto rounded-lg border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap"
        >
          {preview}
        </pre>
        <p className="text-muted mt-1.5 text-xs">{t("use.hint")}</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="primary">
          <Copy size={16} aria-hidden /> {t("use.copy")}
        </Button>
      </div>
    </form>
  );
}
