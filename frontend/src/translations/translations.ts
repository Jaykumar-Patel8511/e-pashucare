import rawTranslations from "./languages.json";

export type Language = "en" | "gu";

export const translations = rawTranslations;

export type TranslationKey = keyof typeof rawTranslations.en;
