import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight, Download, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import logoElp from '@/assets/logo-elp-new.png';
import { PushNotificationButton } from '@/components/PushNotificationButton';

const languages = [
  { code: 'en', name: 'English', shortName: 'EN', flag: '🇬🇧', country: 'UK/AU' },
  { code: 'it', name: 'Italiano', shortName: 'IT', flag: '🇮🇹', country: 'Italia' },
  { code: 'pt', name: 'Português', shortName: 'PT', flag: '🇧🇷', country: 'Brasil' },
  { code: 'es', name: 'Español', shortName: 'ES', flag: '🇪🇸', country: 'España' },
  { code: 'zh', name: '中文', shortName: 'ZH', flag: '🇨🇳', country: '中国' },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/about', label: t('nav.about') },
    { href: '/partnership/otr', label: t('nav.smartOtr', 'Smart OTR') },
    { href: '/global-expansion', label: t('nav.globalExpansion', 'Expansão Global') },
    { href: '/otr-sources', label: t('nav.otrSources', 'Indique Fonte OTR') },
    { href: '/brazil-latam', label: t('nav.brazilLatam', 'Brasil / LATAM') },
    { href: '/solutions', label: t('nav.solutions') },
    { href: '/saas', label: t('nav.saas') },
    { href: '/marketplace', label: t('nav.marketplace') },
    { href: '/investors', label: t('nav.investors') },
    { href: '/esg', label: t('nav.esg') },
    { href: '/media', label: t('nav.media') },
    { href: '/certificates', label: t('nav.certificates') },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: t('nav.contact') },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('elp-language', code);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled 
            ? "bg-gradient-to-b from-background/98 via-background/95 to-background/90 backdrop-blur-xl border-b border-gold/10 shadow-lg shadow-black/5" 
            : "bg-gradient-to-b from-black/40 to-transparent"
        )}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <img 
                src={logoElp} 
                alt="ELP Green Technology" 
                className="h-12 lg:h-14 w-auto" 
              />
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1.5 px-3 h-10 text-foreground/70 hover:text-foreground hover:bg-muted"
                  >
                    <span className="text-lg">{currentLang.flag}</span>
                    <span className="text-sm font-medium">{currentLang.shortName}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-popover border-border shadow-lg"
                >
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={cn(
                        "cursor-pointer flex items-center gap-3 py-2.5",
                        i18n.language === lang.code && "bg-muted"
                      )}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{lang.name}</div>
                      </div>
                      {i18n.language === lang.code && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* CTA Button - Desktop */}
              <Button 
                asChild 
                size="sm"
                className="hidden md:flex h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md border border-gold/20 hover:border-gold/40 hover:shadow-[0_4px_15px_hsl(42_60%_50%/0.1)] transition-all duration-300"
              >
                <Link to="/otr-sources" className="flex items-center gap-2">
                  <span>{t('hero.cta.partner')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              {/* Hamburger Menu Button - All Screens */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <motion.nav
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-2">
                {/* Logo in Menu */}
                <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
                  <img 
                    src={logoElp} 
                    alt="ELP Green Technology" 
                    className="h-10 w-auto" 
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">ELP Green Technology</p>
                    <p className="text-xs text-muted-foreground">Circular Economy Solutions</p>
                  </div>
                </div>

                {/* Navigation Links */}
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all duration-200",
                        location.pathname === item.href
                          ? "bg-primary/10 text-primary border-l-4 border-primary"
                          : "text-foreground/70 hover:text-foreground hover:bg-muted hover:translate-x-1"
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
                
                {/* CTA in Menu */}
                <motion.div 
                  className="pt-6 mt-6 border-t border-border space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    asChild 
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                  >
                    <Link 
                      to="/otr-sources" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="flex items-center justify-center gap-2"
                    >
                      {t('hero.cta.partner')}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>

                  {/* Install App Button */}
                  {isInstallable && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button 
                        onClick={handleInstallClick}
                        size="lg"
                        variant="outline"
                        className="w-full border-primary/50 text-primary hover:bg-primary/10 font-medium"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        {t('pwa.installApp')}
                      </Button>
                    </motion.div>
                  )}

                  {/* Push Notifications Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <PushNotificationButton 
                      variant="outline"
                      size="lg"
                      showLabel={true}
                      className="w-full border-accent/50 text-accent hover:bg-accent/10 font-medium"
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
      
      {/* Spacer for fixed header */}
      <div className="h-16 lg:h-18" />
    </>
  );
}
