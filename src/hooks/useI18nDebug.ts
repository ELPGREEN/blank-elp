import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'elp-i18n-debug';
const QUERY_PARAM = 'i18n-debug';

/**
 * Hook to manage i18n debug mode
 * Enable via:
 * - URL query param: ?i18n-debug=true
 * - Keyboard shortcut: Ctrl+Shift+I (toggle)
 * - localStorage: elp-i18n-debug=true
 */
export function useI18nDebug() {
  const [isDebugMode, setIsDebugMode] = useState(() => {
    // Check URL param first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get(QUERY_PARAM) === 'true') {
        return true;
      }
      // Then check localStorage
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const enableDebugMode = useCallback(() => {
    setIsDebugMode(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const disableDebugMode = useCallback(() => {
    setIsDebugMode(false);
    localStorage.setItem(STORAGE_KEY, 'false');
  }, []);

  // Keyboard shortcut: Ctrl+Shift+I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        toggleDebugMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDebugMode]);

  // Sync with URL param changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get(QUERY_PARAM) === 'true' && !isDebugMode) {
      setIsDebugMode(true);
    }
  }, []);

  return {
    isDebugMode,
    toggleDebugMode,
    enableDebugMode,
    disableDebugMode,
  };
}

// Global state for debug mode (for use outside React components)
let globalDebugMode = false;

export function getI18nDebugMode(): boolean {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get(QUERY_PARAM) === 'true') {
      return true;
    }
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }
  return globalDebugMode;
}

export function setGlobalDebugMode(value: boolean) {
  globalDebugMode = value;
}
