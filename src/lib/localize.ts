import type { Locale } from "./i18n/messages";
import type { Prompt } from "./types";

/** Languages the prompt is available in: the original first, then the translations. */
export const availableLanguages = (prompt: Prompt): Locale[] => [
  prompt.language,
  ...prompt.translations.map((translation) => translation.language),
];

/** Returns the prompt with title and content in the given language (original if unavailable). */
export function localizePrompt(prompt: Prompt, language: Locale): Prompt {
  const translation = prompt.translations.find((item) => item.language === language);
  if (language === prompt.language || !translation) return prompt;
  return {
    ...prompt,
    language,
    title: translation.title || prompt.title,
    content: translation.content,
  };
}
