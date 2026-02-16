import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export function WhatsAppButton() {
  const {
    t
  } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    // Show banner after 3 seconds
    const showTimer = setTimeout(() => {
      if (!dismissed) {
        setShowBanner(true);
      }
    }, 3000);
    return () => clearTimeout(showTimer);
  }, [dismissed]);
  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
  };
  return <>
      {/* Floating Banner - Redirects to OTR Form instead of direct contact */}
      <AnimatePresence>
        {showBanner && !dismissed && <motion.div initial={{
        opacity: 0,
        y: 100
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 100
      }} className="fixed bottom-4 right-4 z-40 max-w-sm">
            <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl p-4 shadow-2xl border border-white/20">
              <button onClick={handleDismiss} className="absolute -top-2 -right-2 w-6 h-6 bg-background text-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-primary border-primary border-none" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mountain className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-1">
                    {t('otrBanner.title', 'Conhece fontes de pneus OTR?')}
                  </p>
                  <p className="text-xs opacity-90 mb-3">
                    {t('otrBanner.subtitle', 'Mineradoras, revendedores, portos? Indique agora!')}
                  </p>
                  <Link to="/otr-sources" onClick={handleDismiss} className="inline-flex items-center gap-2 bg-white text-primary hover:bg-white/90 transition-colors rounded-lg px-3 py-2 text-sm font-semibold">
                    {t('otrBanner.cta', 'Indique uma Fonte')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <p className="text-xs opacity-70 mt-3 text-center">
                {t('otrBanner.note', 'Revisamos internamente antes de qualquer contato')}
              </p>
            </div>
          </motion.div>}
      </AnimatePresence>

      {/* Floating CTA Button */}
      <motion.div className="fixed bottom-4 right-4 z-50" initial={{
      opacity: 0,
      scale: 0
    }} animate={{
      opacity: 1,
      scale: 1
    }} transition={{
      delay: 1
    }}>
        


      </motion.div>
    </>;
}