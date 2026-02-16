import { useTranslation } from 'react-i18next';
import { useI18nDebugContext } from './I18nDebugProvider';
import { ReactNode, useEffect, useState } from 'react';
import { getTranslationSync, translateText } from '@/hooks/useTranslationFallback';

interface TProps {
  /** Translation key */
  k: string;
  /** Fallback text if translation is missing (used for auto-translation) */
  fallback?: string;
  /** Interpolation values */
  values?: Record<string, string | number>;
  /** Render as specific element */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'label';
  /** Additional className */
  className?: string;
  /** Children to render after translation */
  children?: ReactNode;
}

/**
 * Translation component with debug support and auto-translation fallback
 * Uses MyMemory API for automatic translation when manual translation is missing
 * 
 * Usage:
 * <T k="hero.title" />
 * <T k="hero.greeting" values={{ name: "John" }} />
 * <T k="hero.title" as="h1" className="text-2xl" />
 * <T k="new.feature" fallback="New Feature" /> // Will auto-translate if missing
 */
export function T({ k, fallback, values, as: Element = 'span', className = '', children }: TProps) {
  const { t, i18n } = useTranslation();
  const { isDebugMode, addMissingKey } = useI18nDebugContext();
  
  const translation = t(k, values || {});
  const isMissing = translation === k || translation === '';
  
  const [autoTranslation, setAutoTranslation] = useState<string | null>(null);
  
  useEffect(() => {
    if (isMissing) {
      addMissingKey(k);
      
      // Try auto-translation if fallback is provided
      if (fallback && i18n.language !== 'en') {
        const cached = getTranslationSync(k, fallback);
        if (cached !== fallback) {
          setAutoTranslation(cached);
        } else {
          // Fetch translation async
          translateText(fallback, i18n.language, 'en').then(translated => {
            if (translated) {
              setAutoTranslation(translated);
            }
          });
        }
      }
    }
  }, [k, isMissing, addMissingKey, fallback, i18n.language]);

  if (isMissing && isDebugMode) {
    return (
      <Element
        className={`relative inline-block ${className}`}
        title={`Missing translation: ${k}\nLanguage: ${i18n.language}${autoTranslation ? `\nAuto-translated: ${autoTranslation}` : ''}`}
      >
        <span className="bg-red-500/20 border border-red-500 border-dashed px-1 rounded text-red-600 dark:text-red-400">
          <span className="text-[10px] bg-red-500 text-white px-1 rounded mr-1">MISSING</span>
          {autoTranslation || fallback || k}
        </span>
        {children}
      </Element>
    );
  }

  if (isMissing && (autoTranslation || fallback)) {
    return (
      <Element className={className}>
        {autoTranslation || fallback}
        {children}
      </Element>
    );
  }

  return (
    <Element className={className}>
      {translation}
      {children}
    </Element>
  );
}

/**
 * Hook for translation with debug support
 * Returns the translation function and a wrapper that tracks missing keys
 */
export function useDebugTranslation() {
  const { t, i18n } = useTranslation();
  const { isDebugMode, addMissingKey } = useI18nDebugContext();

  const debugT = (key: string, options?: Record<string, unknown>): string => {
    const translation = String(t(key, options as never));
    const isMissing = translation === key || translation === '';
    
    if (isMissing) {
      addMissingKey(key);
      if (isDebugMode) {
        return `⚠️ ${key}`;
      }
    }
    
    return translation;
  };

  return {
    t: debugT,
    i18n,
    isDebugMode,
  };
}
