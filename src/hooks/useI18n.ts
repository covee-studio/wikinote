import { useState, useEffect } from 'react';
import enTranslations from '../locales/en.json';

type TranslationKey = string;

export function useI18n() {
  const [currentLocale] = useState<string>(() => {
    const saved = localStorage.getItem('locale');
    // UI strings are English-only for now
    if (saved && saved !== 'en') {
      localStorage.setItem('locale', 'en');
      return 'en';
    }
    return 'en';
  });

  useEffect(() => {
    // Always persist as English for UI strings
    localStorage.setItem('locale', 'en');
  }, [currentLocale]);

  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    // Always use English translations
    let value: unknown = enTranslations;
    
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  const setLocale = (_locale: string) => {
    void _locale; // mark as used to satisfy no-unused-vars
    // No-op; UI language is locked to English for now
    console.warn('Interface language is locked to English');
  };

  return {
    t,
    currentLocale: 'en',
    setLocale,
    availableLocales: ['en'],
  };
}