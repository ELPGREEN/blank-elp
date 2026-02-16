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
        <Link to="/otr-sources" className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-2xl flex items-center justify-center transition-colors group">
          <Mountain className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Link>
      </motion.div>
    </>;
}