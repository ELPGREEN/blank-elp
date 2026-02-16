import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MapPin, Mountain, Recycle, FileCheck, Phone, Mail, Building2, Truck, Factory, Shield, Leaf, Globe, ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/SEO";
import { BrazilMiningMap } from "@/components/maps/BrazilMiningMap";

const BrazilLatam = () => {
  const { t } = useTranslation();

  const miningRegions = [
    {
      key: "north",
      icon: Mountain,
    },
    {
      key: "southeast",
      icon: Factory,
    },
    {
      key: "midwest",
      icon: Truck,
    }
  ];

  const pnrsKeys = ["pnrs", "reciclanip", "conama", "esg"];
  const pnrsIcons = {
    pnrs: Recycle,
    reciclanip: FileCheck,
    conama: Shield,
    esg: Leaf
  };

  const advantageKeys = ["spOperations", "smartLine", "miningFocus", "logistics"];
  const advantageIcons = {
    spOperations: Building2,
    smartLine: Globe,
    miningFocus: Mountain,
    logistics: Truck
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Brasil & América Latina - Parcerias OTR | ELP Green Technology"
        description="Oportunidades de parceria para reciclagem de pneus OTR no Brasil. Mineração no Norte e Sudeste, alinhado com PNRS e Reciclanip."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-emerald-900" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10 bg-cover bg-center" />
        
        {/* Brazilian flag colors accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-yellow-400 to-green-500" />
        
        <div className="container relative z-10 px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-4xl">🇧🇷</span>
              <span className="text-4xl">🇦🇷</span>
              <span className="text-4xl">🇨🇱</span>
              <span className="text-4xl">🇵🇪</span>
              <span className="text-4xl">🇨🇴</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('brazilLatam.title')}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-4">
              {t('brazilLatam.subtitle')}
            </p>
            <p className="text-lg text-green-200/80 mb-8 max-w-3xl mx-auto">
              {t('brazilLatam.heroDescription')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                <Link to="/otr-sources">
                  <Mountain className="mr-2 h-5 w-5" />
                  {t('brazilLatam.indicateInBrazil')}
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/20 text-white border border-white/50 hover:bg-white/30 font-semibold">
                <Link to="/partnership/otr">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {t('brazilLatam.knowTech')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mining Regions Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('brazilLatam.miningRegions.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('brazilLatam.miningRegions.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {miningRegions.map((region, index) => {
              const Icon = region.icon;
              const states = t(`brazilLatam.miningRegions.${region.key}.states`, { returnObjects: true }) as string[];
              return (
                <motion.div
                  key={region.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{t(`brazilLatam.miningRegions.${region.key}.region`)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {Array.isArray(states) ? states.join(" • ") : ""}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{t(`brazilLatam.miningRegions.${region.key}.description`)}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{t('brazilLatam.miningRegions.companiesInRegion')}:</p>
                          <p className="text-sm text-muted-foreground">{t(`brazilLatam.miningRegions.${region.key}.companies`)}</p>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            📊 {t(`brazilLatam.miningRegions.${region.key}.volume`)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Mining Map Section */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Map className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold">
                {t('brazilLatam.map.title')}
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('brazilLatam.map.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <BrazilMiningMap />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 p-4 bg-muted/50 rounded-xl text-center"
          >
            <p className="text-sm text-muted-foreground">
              {t('brazilLatam.map.dataSource')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* PNRS & Reciclanip Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('brazilLatam.legislation.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('brazilLatam.legislation.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {pnrsKeys.map((key, index) => {
              const Icon = pnrsIcons[key as keyof typeof pnrsIcons];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-green-200 dark:border-green-800">
                    <CardContent className="p-6 flex gap-4">
                      <div className="p-3 rounded-full bg-green-500/10 h-fit">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-2">{t(`brazilLatam.legislation.${key}.title`)}</h3>
                        <p className="text-sm text-muted-foreground">{t(`brazilLatam.legislation.${key}.description`)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-6 bg-white dark:bg-card rounded-2xl shadow-lg max-w-3xl mx-auto"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <FileCheck className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{t('brazilLatam.legislation.destination.title')}</h3>
                <p className="text-muted-foreground">
                  {t('brazilLatam.legislation.destination.description')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Our Advantages Section */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('brazilLatam.advantages.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('brazilLatam.advantages.subtitle')}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantageKeys.map((key, index) => {
              const Icon = advantageIcons[key as keyof typeof advantageIcons];
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold mb-2">{t(`brazilLatam.advantages.${key}.title`)}</h3>
                      <p className="text-sm text-muted-foreground">{t(`brazilLatam.advantages.${key}.description`)}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('brazilLatam.cta.title')}
            </h2>
            <p className="text-xl text-green-100 mb-8">
              {t('brazilLatam.cta.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button asChild size="lg" className="bg-white text-green-700 hover:bg-green-50 font-semibold">
                <Link to="/otr-sources">
                  <Mountain className="mr-2 h-5 w-5" />
                  {t('globalExpansion.indicateSource')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 hover:text-white">
                <Link to="/partnership/otr">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  {t('globalExpansion.knowSmartLine')}
                </Link>
              </Button>
            </div>

            <div className="text-center text-sm text-green-200/80">
              <p className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@elpgreen.com</span>
              </p>
              <p className="mt-2 text-xs text-green-200/60">
                {t('brazilLatam.cta.contactNote')}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Other LATAM Countries */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('brazilLatam.expansion.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('brazilLatam.expansion.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
            {[
              { key: "chile", flag: "🇨🇱" },
              { key: "peru", flag: "🇵🇪" },
              { key: "argentina", flag: "🇦🇷" },
              { key: "colombia", flag: "🇨🇴" },
              { key: "mexico", flag: "🇲🇽" },
            ].map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <span className="text-3xl mb-2 block">{item.flag}</span>
                    <h3 className="font-bold text-sm">{t(`brazilLatam.expansion.${item.key}.country`)}</h3>
                    <p className="text-xs text-muted-foreground">{t(`brazilLatam.expansion.${item.key}.focus`)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrazilLatam;
