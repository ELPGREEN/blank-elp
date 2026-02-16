import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Linkedin, Youtube, Mail, Globe, Building2, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNewsletter } from '@/hooks/useNewsletter';
import logoElp from '@/assets/logo-elp.png';
import { openExternal } from '@/lib/openExternal';

// Country icons component
const CountryIcon = ({ country }: { country: 'italy' | 'brazil' | 'germany' | 'china' }) => {
  const colors: Record<string, { bg: string; colors: string[] }> = {
    italy: { bg: 'bg-gradient-to-r', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
    brazil: { bg: 'bg-gradient-to-br', colors: ['#009C3B', '#FFDF00'] },
    germany: { bg: 'bg-gradient-to-b', colors: ['#000000', '#DD0000', '#FFCE00'] },
    china: { bg: 'bg-gradient-to-br', colors: ['#DE2910', '#FFDE00'] },
  };

  return (
    <div className="w-5 h-4 rounded-sm overflow-hidden flex-shrink-0 border border-white/20">
      <div 
        className="w-full h-full"
        style={{
          background: country === 'italy' 
            ? 'linear-gradient(to right, #009246 33%, #FFFFFF 33%, #FFFFFF 66%, #CE2B37 66%)'
            : country === 'brazil'
            ? 'linear-gradient(135deg, #009C3B 50%, #FFDF00 50%)'
            : country === 'germany'
            ? 'linear-gradient(to bottom, #000000 33%, #DD0000 33%, #DD0000 66%, #FFCE00 66%)'
            : 'linear-gradient(135deg, #DE2910 80%, #FFDE00 80%)'
        }}
      />
    </div>
  );
};

export function Footer() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const newsletterMutation = useNewsletter();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    try {
      await newsletterMutation.mutateAsync({
        email,
        language: i18n.language,
      });
      
      toast({
        title: t('newsletter.success'),
        description: t('newsletter.successDesc'),
      });
      
      setEmail('');
    } catch (error: any) {
      toast({
        title: t('newsletter.error'),
        description: error.message || t('newsletter.errorDesc'),
        variant: "destructive",
      });
    }
  };

  const quickLinks = [
    { href: '/about', label: t('nav.about') },
    { href: '/solutions', label: t('nav.solutions') },
    { href: '/marketplace', label: t('nav.marketplace') },
    { href: '/investors', label: t('nav.investors') },
    { href: '/esg', label: t('nav.esg') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const legalLinks = [
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/terms', label: t('footer.terms') },
    { href: '/cookies', label: t('footer.cookies') },
    { href: '/login', label: t('footer.restrictedArea') },
  ];

  return (
    <footer className="section-metal text-white relative">
      {/* Gold top line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      {/* Newsletter Section */}
      <div className="border-b border-sidebar-border/80 border-b-gold/8">
        <div className="container-wide py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">{t('newsletter.title')}</h3>
              <p className="text-sidebar-foreground/70">{t('newsletter.subtitle')}</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto">
              <Input
                type="email"
                placeholder={t('newsletter.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 min-w-[250px]"
                required
              />
              <Button 
                type="submit"
                variant="elp-gold"
                className="whitespace-nowrap rounded-md"
                disabled={newsletterMutation.isPending}
              >
                {newsletterMutation.isPending ? '...' : t('newsletter.subscribe')}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoElp} alt="ELP Global Company" className="h-16 w-auto" />
            </div>
            <p className="text-sidebar-foreground/70 text-sm mb-4">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/company/elpgreen/posts/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@elpgreen/videos"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  openExternal('https://www.youtube.com/@elpgreen/videos');
                }}
                className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/elpgreen_"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Simplified */}
          <div>
            <h4 className="font-semibold mb-4">{t('nav.contact')}</h4>
            <div className="space-y-4 text-sm text-sidebar-foreground/70">
              {/* Global HQs */}
              <div>
                <p className="font-medium text-sidebar-foreground flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  {t('footer.globalHQ')}
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1">
                    <CountryIcon country="italy" />
                    <span>IT</span>
                  </div>
                  <span className="text-sidebar-foreground/30">•</span>
                  <div className="flex items-center gap-1">
                    <CountryIcon country="brazil" />
                    <span>BR</span>
                  </div>
                  <span className="text-sidebar-foreground/30">•</span>
                  <div className="flex items-center gap-1">
                    <CountryIcon country="germany" />
                    <span>DE</span>
                  </div>
                  <span className="text-sidebar-foreground/30">•</span>
                  <div className="flex items-center gap-1">
                    <CountryIcon country="china" />
                    <span>CN</span>
                  </div>
                </div>
              </div>

              {/* Website */}
              <div>
                <p className="font-medium text-sidebar-foreground flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4" />
                  Website
                </p>
                <a href="https://www.elpgreen.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  www.elpgreen.com
                </a>
              </div>

              {/* Email */}
              <div>
                <p className="font-medium text-sidebar-foreground flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" />
                  {t('footer.email')}
                </p>
                <a href="mailto:info@elpgreen.com" className="hover:text-primary transition-colors">
                  info@elpgreen.com
                </a>
              </div>

              {/* OTR Sources */}
              <div className="pt-2 border-t border-sidebar-border">
                <p className="font-medium text-sidebar-foreground flex items-center gap-2 mb-1">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {t('footer.otrIndications')}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('footer.contactAfterReview')}
                </p>
                <Link 
                  to="/otr-sources"
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {t('footer.indicateSource')} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-sidebar-border">
        <div className="container-wide py-6">
          <p className="text-center text-sm text-sidebar-foreground/50">
            © {new Date().getFullYear()} {t('footer.company')}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
