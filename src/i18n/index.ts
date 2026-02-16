import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all locale files - updated to force cache refresh
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import it from './locales/it.json';

/**
 * Deep merge function to fill missing keys from reference locale
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: T): T {
  const result = { ...target } as Record<string, unknown>;
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (result[key] === undefined) {
        result[key] = sourceValue;
      }
    }
  }
  
  return result as T;
}

// Merge missing keys from EN into each locale for 100% coverage
const mergedPt = deepMerge(pt as Record<string, unknown>, en as Record<string, unknown>);
const mergedEs = deepMerge(es as Record<string, unknown>, en as Record<string, unknown>);
const mergedZh = deepMerge(zh as Record<string, unknown>, en as Record<string, unknown>);
const mergedIt = deepMerge(it as Record<string, unknown>, en as Record<string, unknown>);

const resources = {
  en: { translation: en },
  pt: { translation: mergedPt },
  es: { translation: mergedEs },
  zh: { translation: mergedZh },
  it: { translation: mergedIt },
};

// Get saved language or detect from browser
const getSavedLanguage = () => {
  const saved = localStorage.getItem('elp-language');
  if (saved && ['en', 'pt', 'es', 'zh', 'it'].includes(saved)) {
    return saved;
  }
  
  // Detect browser language with extended matching
  const browserLang = navigator.language.toLowerCase();
  const primaryLang = browserLang.split('-')[0];
  
  // Check for exact matches first (e.g., pt-BR, es-MX, zh-CN)
  if (browserLang.startsWith('pt')) return 'pt';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('it')) return 'it';
  if (browserLang.startsWith('en')) return 'en';
  
  // Fallback check for primary language
  if (['en', 'pt', 'es', 'zh', 'it'].includes(primaryLang)) {
    return primaryLang;
  }
  
  return 'pt'; // Default to Portuguese (company is Brazilian)
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
