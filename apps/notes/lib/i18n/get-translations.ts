/**
 * Translation loader utility
 * Loads translation files dynamically
 */

import type { LocaleCode } from './config';

export type TranslationKey = string;
export type Translations = Record<string, string | Translations>;

const translationCache = new Map<LocaleCode, Translations>();

/**
 * Load translations for a locale
 */
export async function getTranslations(locale: LocaleCode): Promise<Translations> {
  // Check cache first
  if (translationCache.has(locale)) {
    return translationCache.get(locale)!;
  }

  try {
    // Dynamic import of translation file
    const translations = await import(`./locales/${locale}.json`);
    translationCache.set(locale, translations.default);
    return translations.default;
  } catch (error) {
    console.warn(`Failed to load translations for locale ${locale}, falling back to English`, error);
    
    // Fallback to English
    if (locale !== 'en') {
      return getTranslations('en');
    }
    
    // If even English fails, return empty object
    return {};
  }
}

/**
 * Get nested translation value by key path (e.g., 'nav.notebooks')
 */
export function getTranslation(
  translations: Translations,
  key: string,
  fallback?: string
): string {
  const keys = key.split('.');
  let current: any = translations;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return fallback ?? key;
    }
  }

  return typeof current === 'string' ? current : (fallback ?? key);
}

/**
 * Preload translations for better performance
 */
export async function preloadTranslations(locale: LocaleCode): Promise<void> {
  await getTranslations(locale);
}

