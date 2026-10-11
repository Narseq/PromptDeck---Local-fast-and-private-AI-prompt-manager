"use client";

import { useCallback, useSyncExternalStore } from "react";
import { type Locale, type MessageKey } from "./messages";
import { DEFAULT_LOCALE, isLocale, pickLocale, translate, type Params } from "./translate";

const STORAGE_KEY = "promptdeck-locale";
const CHANGE_EVENT = "promptdeck-locale-change";

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be unavailable (private mode); fall back to the browser language.
  }
  return pickLocale(navigator.languages ?? [navigator.language]);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // The language still changes for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Current language (saved choice, else browser language, else English) and a `t` function. */
export function useI18n() {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE);
  const t = useCallback(
    (key: MessageKey, params?: Params) => translate(locale, key, params),
    [locale],
  );
  return { locale, t };
}
