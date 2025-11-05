'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LocaleCode } from '@/lib/i18n/config';
import { defaultLocale, isValidLocale, isRTL as checkRTL } from '@/lib/i18n/config';
import { getTranslations, type Translations } from '@/lib/i18n/get-translations';

interface LocaleContextType {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  translations: Translations;
  isLoading: boolean;
  isRTL: boolean;
  t: (key: string, fallback?: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale?: LocaleCode;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<LocaleCode>(() => {
    // Try to get locale from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('locale');
      if (stored && isValidLocale(stored)) {
        return stored;
      }
    }
    return initialLocale ?? defaultLocale;
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when locale changes
  useEffect(() => {
    let mounted = true;

    async function loadTranslations() {
      setIsLoading(true);
      try {
        const loadedTranslations = await getTranslations(locale);
        if (mounted) {
          setTranslations(loadedTranslations);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadTranslations();

    return () => {
      mounted = false;
    };
  }, [locale]);

  // Save locale to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: LocaleCode) => {
    if (isValidLocale(newLocale)) {
      setLocaleState(newLocale);
    }
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
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
  }, [translations]);

  const isRTL = checkRTL(locale);

  // Update HTML dir attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
  }, [locale, isRTL]);

  const value: LocaleContextType = {
    locale,
    setLocale,
    translations,
    isLoading,
    isRTL,
    t,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return context;
}

