import { describe, expect, it } from "vitest";
import { CATALOGS, LOCALES } from "@/lib/i18n/messages";
import { pickLocale, translate } from "@/lib/i18n/translate";

describe("translate", () => {
  it("interpolates parameters", () => {
    expect(translate("en", "history.version", { version: 3 })).toBe("Version 3");
    expect(translate("de", "toast.imported", { imported: 2, skipped: 1 })).toBe(
      "2 importiert, 1 Duplikat(e) übersprungen",
    );
  });

  it("keeps literal braces around variable names", () => {
    expect(translate("en", "use.valueFor", { name: "topic" })).toBe("Value for {{topic}}");
  });

  it("uses plural rules of each language", () => {
    expect(translate("en", "list.count", { count: 1 })).toBe("1 prompt");
    expect(translate("en", "list.count", { count: 2 })).toBe("2 prompts");
    expect(translate("pl", "list.count", { count: 2 })).toBe("2 prompty");
    expect(translate("pl", "list.count", { count: 5 })).toBe("5 promptów");
    expect(translate("ru", "list.count", { count: 21 })).toBe("21 промпт");
    expect(translate("ru", "list.count", { count: 3 })).toBe("3 промпта");
    expect(translate("ru", "list.count", { count: 11 })).toBe("11 промптов");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(translate("en", "history.version")).toBe("Version {version}");
  });
});

describe("catalogs", () => {
  it("define the same keys in every language", () => {
    const keys = Object.keys(CATALOGS.en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(CATALOGS[locale]).sort(), locale).toEqual(keys);
    }
  });

  it("use the same placeholders in every language", () => {
    const placeholders = (message: unknown) =>
      JSON.stringify(message)
        .match(/(?<!\{)\{\w+\}(?!\})/g)
        ?.sort() ?? [];
    for (const [key, message] of Object.entries(CATALOGS.en)) {
      for (const locale of LOCALES) {
        const translated = CATALOGS[locale][key as keyof typeof CATALOGS.en];
        const expected =
          typeof message === "string" ? placeholders(message) : placeholders(message.other);
        const actual =
          typeof translated === "string"
            ? placeholders(translated)
            : placeholders(translated.other);
        expect(actual, `${locale}:${key}`).toEqual(expected);
      }
    }
  });
});

describe("pickLocale", () => {
  it("chooses the first supported browser language", () => {
    expect(pickLocale(["fr-FR", "pl-PL", "en"])).toBe("pl");
    expect(pickLocale(["ru"])).toBe("ru");
    expect(pickLocale(["ja"])).toBe("en");
  });
});
