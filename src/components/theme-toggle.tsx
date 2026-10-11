"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/use-i18n";
import { Button } from "./ui";

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const isLightNow = () => document.documentElement.classList.contains("light");

export function ThemeToggle() {
  const { t } = useI18n();
  const isLight = useSyncExternalStore(subscribe, isLightNow, () => false);

  const toggle = () => {
    const next = !isLight;
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("promptdeck-theme", next ? "light" : "dark");
    } catch {
      // Storage may be unavailable (private mode); the theme still applies for this session.
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      aria-label={isLight ? t("header.themeDark") : t("header.themeLight")}
      className="p-2"
    >
      {isLight ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
    </Button>
  );
}
