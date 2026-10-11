import { CATALOGS, LOCALES, type Locale, type MessageKey } from "./messages";

export type Params = Record<string, string | number>;

export const DEFAULT_LOCALE: Locale = "en";

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/** Picks the first supported language from a list such as `navigator.languages`. */
export function pickLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/**
 * Looks up a message and fills `{name}` placeholders. Messages with plural forms are chosen by
 * the `count` parameter using the locale's plural rules.
 */
export function translate(locale: Locale, key: MessageKey, params: Params = {}): string {
  const message = CATALOGS[locale][key];
  let template: string;
  if (typeof message === "string") {
    template = message;
  } else {
    const rule = new Intl.PluralRules(locale).select(Number(params.count ?? 0));
    template = message[rule] ?? message.other;
  }
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}
