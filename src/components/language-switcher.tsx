"use client";

import { Languages } from "lucide-react";
import { useEffect } from "react";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/messages";
import { isLocale } from "@/lib/i18n/translate";
import { setLocale, useI18n } from "@/lib/i18n/use-i18n";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <label className="text-muted hover:text-fg flex items-center gap-1.5">
      <Languages size={18} aria-hidden />
      <span className="sr-only">{t("header.language")}</span>
      <select
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
        className="border-border bg-bg text-fg rounded-lg border py-1.5 pr-1 pl-2 text-sm"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
