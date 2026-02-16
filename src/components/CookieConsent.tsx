import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Check, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const COOKIE_CONSENT_KEY = 'elp_cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid jarring appearance
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(fullConsent));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimalConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(minimalConsent));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);
  };

  const getTranslation = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: {
        pt: 'Usamos cookies',
        en: 'We use cookies',
        es: 'Usamos cookies',
        zh: '我们使用cookies'
      },
      description: {
        pt: 'Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. Você pode aceitar todos os cookies ou gerenciar suas preferências.',
        en: 'We use cookies to enhance your experience, analyze site traffic, and personalize content. You can accept all cookies or manage your preferences.',
        es: 'Utilizamos cookies para mejorar su experiencia, analizar el tráfico del sitio y personalizar el contenido. Puede aceptar todas las cookies o gestionar sus preferencias.',
        zh: '我们使用cookies来增强您的体验，分析网站流量并个性化内容。您可以接受所有cookies或管理您的偏好设置。'
      },
      acceptAll: {
        pt: 'Aceitar Todos',
        en: 'Accept All',
        es: 'Aceptar Todos',
        zh: '接受全部'
      },
      rejectAll: {
        pt: 'Rejeitar',
        en: 'Reject All',
        es: 'Rechazar Todos',
        zh: '拒绝全部'
      },
      customize: {
        pt: 'Personalizar',
        en: 'Customize',
        es: 'Personalizar',
        zh: '自定义'
      },
      savePreferences: {
        pt: 'Salvar Preferências',
        en: 'Save Preferences',
        es: 'Guardar Preferencias',
        zh: '保存偏好'
      },
      necessary: {
        pt: 'Necessários',
        en: 'Necessary',
        es: 'Necesarios',
        zh: '必要的'
      },
      necessaryDesc: {
        pt: 'Essenciais para o funcionamento do site. Não podem ser desativados.',
        en: 'Essential for website functionality. Cannot be disabled.',
        es: 'Esenciales para el funcionamiento del sitio. No se pueden desactivar.',
        zh: '网站功能必需的。不能禁用。'
      },
      analytics: {
        pt: 'Analíticos',
        en: 'Analytics',
        es: 'Analíticos',
        zh: '分析'
      },
      analyticsDesc: {
        pt: 'Nos ajudam a entender como você usa nosso site.',
        en: 'Help us understand how you use our site.',
        es: 'Nos ayudan a entender cómo usa nuestro sitio.',
        zh: '帮助我们了解您如何使用我们的网站。'
      },
      marketing: {
        pt: 'Marketing',
        en: 'Marketing',
        es: 'Marketing',
        zh: '营销'
      },
      marketingDesc: {
        pt: 'Usados para mostrar anúncios relevantes.',
        en: 'Used to show relevant advertisements.',
        es: 'Usados para mostrar anuncios relevantes.',
        zh: '用于展示相关广告。'
      },
      learnMore: {
        pt: 'Saiba mais em nossa',
        en: 'Learn more in our',
        es: 'Más información en nuestra',
        zh: '在我们的'
      },
      cookiePolicy: {
        pt: 'Política de Cookies',
        en: 'Cookie Policy',
        es: 'Política de Cookies',
        zh: 'Cookie政策'
      }
    };

    const lang = i18n.language?.substring(0, 2) || 'pt';
    return translations[key]?.[lang] || translations[key]?.['pt'] || key;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-6 w-6 text-secondary" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{getTranslation('title')}</h3>
                  <button
                    onClick={handleRejectAll}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {getTranslation('description')}
                </p>

                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 mb-4"
                  >
                    {/* Necessary Cookies */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getTranslation('necessary')}</p>
                        <p className="text-xs text-muted-foreground">{getTranslation('necessaryDesc')}</p>
                      </div>
                    </div>

                    {/* Analytics Cookies */}
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        preferences.analytics ? 'bg-secondary/10' : 'bg-muted/50'
                      }`}
                      onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        preferences.analytics ? 'bg-secondary border-secondary' : 'border-muted-foreground'
                      }`}>
                        {preferences.analytics && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getTranslation('analytics')}</p>
                        <p className="text-xs text-muted-foreground">{getTranslation('analyticsDesc')}</p>
                      </div>
                    </div>

                    {/* Marketing Cookies */}
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        preferences.marketing ? 'bg-secondary/10' : 'bg-muted/50'
                      }`}
                      onClick={() => setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        preferences.marketing ? 'bg-secondary border-secondary' : 'border-muted-foreground'
                      }`}>
                        {preferences.marketing && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getTranslation('marketing')}</p>
                        <p className="text-xs text-muted-foreground">{getTranslation('marketingDesc')}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button 
                    onClick={handleAcceptAll}
                    className="gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {getTranslation('acceptAll')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleRejectAll}
                  >
                    {getTranslation('rejectAll')}
                  </Button>
                  
                  {!showDetails ? (
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowDetails(true)}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {getTranslation('customize')}
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      onClick={handleSavePreferences}
                    >
                      {getTranslation('savePreferences')}
                    </Button>
                  )}
                  
                  <span className="text-xs text-muted-foreground">
                    {getTranslation('learnMore')}{' '}
                    <a href="/cookies" className="text-secondary hover:underline">
                      {getTranslation('cookiePolicy')}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
