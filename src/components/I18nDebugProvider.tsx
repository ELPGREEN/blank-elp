import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useI18nDebug } from '@/hooks/useI18nDebug';
import { toast } from 'sonner';

interface I18nDebugContextType {
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  missingKeys: Set<string>;
  addMissingKey: (key: string) => void;
}

const I18nDebugContext = createContext<I18nDebugContextType | null>(null);

// Global set to track missing keys
const missingKeysSet = new Set<string>();

export function I18nDebugProvider({ children }: { children: ReactNode }) {
  const { isDebugMode, toggleDebugMode } = useI18nDebug();

  // Show toast when debug mode changes
  useEffect(() => {
    if (isDebugMode) {
      toast.info('🔍 i18n Debug Mode Enabled', {
        description: 'Missing translations will be highlighted. Press Ctrl+Shift+I to toggle.',
        duration: 3000,
      });
    }
  }, [isDebugMode]);

  const addMissingKey = (key: string) => {
    if (!missingKeysSet.has(key)) {
      missingKeysSet.add(key);
      if (isDebugMode) {
        console.warn(`[i18n] Missing translation: "${key}"`);
      }
    }
  };

  return (
    <I18nDebugContext.Provider value={{
      isDebugMode,
      toggleDebugMode,
      missingKeys: missingKeysSet,
      addMissingKey,
    }}>
      {children}
      {isDebugMode && <I18nDebugOverlay />}
    </I18nDebugContext.Provider>
  );
}

export function useI18nDebugContext() {
  const context = useContext(I18nDebugContext);
  if (!context) {
    // Return a default context if not wrapped in provider
    return {
      isDebugMode: false,
      toggleDebugMode: () => {},
      missingKeys: new Set<string>(),
      addMissingKey: () => {},
    };
  }
  return context;
}

// Floating overlay showing debug status
function I18nDebugOverlay() {
  const { toggleDebugMode, missingKeys } = useI18nDebugContext();
  
  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-2">
      <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <span className="animate-pulse">🔍</span>
        <span>i18n Debug Mode</span>
        <span className="bg-black/20 px-2 py-0.5 rounded">
          {missingKeys.size} missing
        </span>
        <button
          onClick={toggleDebugMode}
          className="ml-2 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="text-[10px] text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
        Ctrl+Shift+I to toggle
      </div>
    </div>
  );
}
