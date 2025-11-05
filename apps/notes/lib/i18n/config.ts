/**
 * i18n Configuration
 * Supports multiple languages with RTL support
 */

export const supportedLocales = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'es', name: 'Español', rtl: false },
  { code: 'fr', name: 'Français', rtl: false },
  { code: 'de', name: 'Deutsch', rtl: false },
  { code: 'zh', name: '中文', rtl: false },
  { code: 'ja', name: '日本語', rtl: false },
  { code: 'ar', name: 'العربية', rtl: true },
  { code: 'he', name: 'עברית', rtl: true },
  { code: 'pt', name: 'Português', rtl: false },
  { code: 'ru', name: 'Русский', rtl: false },
] as const;

export type LocaleCode = typeof supportedLocales[number]['code'];

export const defaultLocale: LocaleCode = 'en';

export function isRTL(locale: LocaleCode): boolean {
  return supportedLocales.find(l => l.code === locale)?.rtl ?? false;
}

export function isValidLocale(locale: string): locale is LocaleCode {
  return supportedLocales.some(l => l.code === locale);
}

export function getLocaleFromHeader(acceptLanguage?: string): LocaleCode {
  if (!acceptLanguage) return defaultLocale;
  
  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.split('-')[0], quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported locale
  for (const { code } of languages) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

