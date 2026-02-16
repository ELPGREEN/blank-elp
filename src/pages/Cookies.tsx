import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Cookie, ArrowLeft } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Cookies() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Política de Cookies | ELP Green Technology"
        description="Saiba como utilizamos cookies para melhorar sua experiência. Tipos de cookies, gerenciamento e cookies de terceiros."
        url="https://elpgreen.com/cookies"
      />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-10 w-10 text-white" />
              <h1 className="text-white">{t('legal.cookies.title')}</h1>
            </div>
            <p className="text-xl text-white/80">{t('legal.cookies.subtitle')}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container-wide max-w-4xl">
          <Button asChild variant="ghost" className="mb-8">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('legal.backToHome')}
            </Link>
          </Button>

          <div className="prose prose-lg max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('legal.cookies.what.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.cookies.what.text')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('legal.cookies.types.title')}</h2>
                
                <div className="space-y-6 mt-4">
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-2">{t('legal.cookies.types.essential.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('legal.cookies.types.essential.text')}
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-2">{t('legal.cookies.types.performance.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('legal.cookies.types.performance.text')}
                    </p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-bold text-foreground mb-2">{t('legal.cookies.types.functionality.title')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('legal.cookies.types.functionality.text')}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('legal.cookies.manage.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.cookies.manage.text')}
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('legal.cookies.thirdParty.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.cookies.thirdParty.text')}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>{t('legal.cookies.thirdParty.googleAnalytics')}</li>
                  <li>{t('legal.cookies.thirdParty.youtube')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('legal.cookies.moreInfo.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.cookies.moreInfo.text')}{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    {t('legal.cookies.moreInfo.privacyPolicy')}
                  </Link>.
                </p>
                <p className="text-muted-foreground mt-4">
                  <strong>{t('legal.cookies.moreInfo.email')}:</strong> info@elpgreen.com
                </p>
              </section>

              <p className="text-sm text-muted-foreground border-t pt-6 mt-8">
                {t('legal.lastUpdate')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
