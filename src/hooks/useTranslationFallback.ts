import { useState, useCallback } from 'react';
import i18n from '@/i18n';

const TRANSLATION_CACHE_KEY = 'elp-translation-cache';
const API_URL = 'https://api.mymemory.translated.net/get';

// Language codes for MyMemory API
const LANG_CODES: Record<string, string> = {
  en: 'en',
  pt: 'pt-BR',
  es: 'es',
  zh: 'zh-CN',
  it: 'it'
};

interface TranslationCache {
  [key: string]: {
    [lang: string]: string;
  };
}

// Get cached translations from localStorage
const getCache = (): TranslationCache => {
  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

// Save translation to cache
const saveToCache = (key: string, lang: string, translation: string) => {
  try {
    const cache = getCache();
    if (!cache[key]) cache[key] = {};
    cache[key][lang] = translation;
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

// Get cached translation
const getCachedTranslation = (key: string, lang: string): string | null => {
  const cache = getCache();
  return cache[key]?.[lang] || null;
};

// Translate text using MyMemory API (free, 5000 chars/day)
export const translateText = async (
  text: string,
  targetLang: string,
  sourceLang: string = 'en'
): Promise<string | null> => {
  try {
    const source = LANG_CODES[sourceLang] || sourceLang;
    const target = LANG_CODES[targetLang] || targetLang;
    
    const params = new URLSearchParams({
      q: text,
      langpair: `${source}|${target}`
    });

    const response = await fetch(`${API_URL}?${params}`);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    return null;
  } catch (error) {
    console.warn('Translation API error:', error);
    return null;
  }
};

export const useTranslationFallback = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const getTranslation = useCallback(async (
    key: string,
    fallbackText: string
  ): Promise<string> => {
    const currentLang = i18n.language;
    
    // Check if we have a manual translation
    const manualTranslation = i18n.t(key, { defaultValue: '' });
    if (manualTranslation && manualTranslation !== key && manualTranslation !== '') {
      return manualTranslation;
    }

    // Check cache first
    const cached = getCachedTranslation(key, currentLang);
    if (cached) {
      return cached;
    }

    // If current language is English or no fallback text, return as is
    if (currentLang === 'en' || !fallbackText) {
      return fallbackText || key;
    }

    // Translate using API
    setIsTranslating(true);
    try {
      const translated = await translateText(fallbackText, currentLang, 'en');
      if (translated) {
        saveToCache(key, currentLang, translated);
        return translated;
      }
    } finally {
      setIsTranslating(false);
    }

    return fallbackText || key;
  }, []);

  return { getTranslation, isTranslating };
};

// Synchronous version that uses cache only
export const getTranslationSync = (key: string, fallbackText: string): string => {
  const currentLang = i18n.language;
  
  // Check manual translation first
  const manualTranslation = i18n.t(key, { defaultValue: '' });
  if (manualTranslation && manualTranslation !== key && manualTranslation !== '') {
    return manualTranslation;
  }

  // Check cache
  const cached = getCachedTranslation(key, currentLang);
  if (cached) {
    return cached;
  }

  // Schedule async translation for next render
  if (currentLang !== 'en' && fallbackText) {
    translateText(fallbackText, currentLang, 'en').then(translated => {
      if (translated) {
        saveToCache(key, currentLang, translated);
      }
    });
  }

  return fallbackText || key;
};
