import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gauge, Clock, DollarSign, TrendingUp, Package, Settings, ChevronRight, Check, X, ChevronLeft, Truck, Mountain, Anchor, Tractor, ExternalLink, Building2, Bot, Zap, Target, Calendar, Handshake, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';
import { WatermarkImage } from '@/components/ui/watermark-image';
import { PlantQuoteForm } from '@/components/forms/PlantQuoteForm';
import { ROICalculator } from '@/components/plants/ROICalculator';

// Import OTR machine images - Real photos from TOPS Recycling
import otrTirePartnershipImg from '@/assets/otr/otr-tire-partnership.jpg';
import redShredderImg from '@/assets/otr/red-shredder-operation.jpg';
import otrProcessingAreaImg from '@/assets/otr/otr-processing-area.jpg';
import shreddingLineImg from '@/assets/otr/shredding-line-interior.jpg';
import topsFactoryImg from '@/assets/otr/tops-factory-overview.jpg';
import beadRingsImg from '@/assets/otr/bead-rings-stacked.jpg';

// Import official TOPS Recycling product images
import otrSidewallCutterImg from '@/assets/machines/otr-sidewall-cutter-new.jpg';
import otrBlockCutterImg from '@/assets/machines/otr-block-cutter-new.jpg';
import otrStripCutterImg from '@/assets/machines/otr-strip-cutter-new.jpg';
import otrTireCutterImg from '@/assets/machines/otr-tire-cutter-new.jpg';
import otrCompleteLineImg from '@/assets/machines/otr-complete-line-new.jpg';

// OTR Machine Gallery - Real photos from factory visits - Uses translations
const getOtrMachines = (t: (key: string, options?: { defaultValue?: string }) => string) => [
  { 
    src: otrSidewallCutterImg, 
    title: t('plants.otr.machines.sidewallCutter', { defaultValue: 'OTR Side Wall Cutter' }), 
    desc: t('plants.otr.machines.sidewallCutterDesc', { defaultValue: 'Corta laterais de pneus até 59/80R63 - Opera em fosso subterrâneo' }),
    model: 'TPS-OTRSW4500',
    link: 'https://www.topsrecycling.com/amp/Economical-Waste-OTR-Tyre-Side-Wall-Cutter-pd49221560.html'
  },
  { 
    src: otrStripCutterImg, 
    title: t('plants.otr.machines.stripCutter', { defaultValue: 'OTR Crown Strip Cutter' }), 
    desc: t('plants.otr.machines.stripCutterDesc', { defaultValue: 'Processa a coroa do pneu (parte mais grossa >300mm)' }),
    model: 'TPS-OTRCR4500',
    link: 'https://www.topsrecycling.com/amp/Waste-OTR-Tyre-Crown-Strip-Block-Cutter-pd44600560.html'
  },
  { 
    src: otrBlockCutterImg, 
    title: t('plants.otr.machines.blockCutter', { defaultValue: 'OTR Block Cutter' }), 
    desc: t('plants.otr.machines.blockCutterDesc', { defaultValue: 'Converte tiras e laterais em chips prontos para granulação' }),
    model: 'TPS-OTRBC4500',
    link: 'https://www.topsrecycling.com/amp/Waste-OTR-Tyre-Block-Cutter-pd43780560.html'
  },
  { 
    src: otrTireCutterImg, 
    title: t('plants.otr.machines.tireCutter', { defaultValue: 'OTR Tire Cutter em Operação' }), 
    desc: t('plants.otr.machines.tireCutterDesc', { defaultValue: 'Sistema hidráulico cortando pneu gigante de mineração' }),
    model: 'TOPS Recycling'
  },
  { 
    src: otrCompleteLineImg, 
    title: t('plants.otr.machines.completeLine', { defaultValue: 'Linha Completa OTR' }), 
    desc: t('plants.otr.machines.completeLineDesc', { defaultValue: 'Sistema integrado de processamento de pneus OTR' }),
    model: 'TPS-OTR-COMPLETE'
  },
  { 
    src: otrTirePartnershipImg, 
    title: t('plants.otr.machines.partnership', { defaultValue: 'Parceria Estratégica' }), 
    desc: t('plants.otr.machines.partnershipDesc', { defaultValue: 'Visita técnica às instalações da TOPS Recycling na China' }),
    model: 'ELP + TOPS Recycling'
  },
  { 
    src: redShredderImg, 
    title: t('plants.otr.machines.shredder', { defaultValue: 'Triturador Industrial' }), 
    desc: t('plants.otr.machines.shredderDesc', { defaultValue: 'Triturador de alta capacidade para processamento de OTR' }),
    model: 'TOPS Heavy Duty Series'
  },
  { 
    src: beadRingsImg, 
    title: t('plants.otr.machines.beadRings', { defaultValue: 'Anéis de Talão Extraídos' }), 
    desc: t('plants.otr.machines.beadRingsDesc', { defaultValue: 'Aço de alta qualidade recuperado - pronto para fundição' }),
    model: 'Output de Alta Qualidade'
  },
];

// OTR Tire Applications - Uses translations
const getApplications = (t: (key: string, options?: { defaultValue?: string }) => string) => [
  { 
    icon: Mountain, 
    name: t('plants.otr.applications.mining', { defaultValue: 'Mineração' }), 
    description: t('plants.otr.applications.miningDesc', { defaultValue: 'Pneus de caminhões fora de estrada e carregadeiras' }),
    examples: ['Caterpillar 797', 'Komatsu 930E', 'Liebherr T282']
  },
  { 
    icon: Anchor, 
    name: t('plants.otr.applications.ports', { defaultValue: 'Portos' }), 
    description: t('plants.otr.applications.portsDesc', { defaultValue: 'Pneus de empilhadeiras e reach stackers' }),
    examples: ['Reach Stackers', 'Straddle Carriers', 'RTG Cranes']
  },
  { 
    icon: Tractor, 
    name: t('plants.otr.applications.agriculture', { defaultValue: 'Agricultura' }), 
    description: t('plants.otr.applications.agricultureDesc', { defaultValue: 'Pneus de tratores e colheitadeiras gigantes' }),
    examples: ['John Deere 9RX', 'Case IH Steiger', 'New Holland T9']
  },
  { 
    icon: Truck, 
    name: t('plants.otr.applications.construction', { defaultValue: 'Construção' }), 
    description: t('plants.otr.applications.constructionDesc', { defaultValue: 'Pneus de motoniveladoras e scrapers' }),
    examples: ['CAT D11', 'Volvo A60H', 'Komatsu WA1200']
  },
];

// OTR Equipment Specifications - Real TOPS Recycling data - Uses translations
const getEquipmentSpecs = (t: (key: string, options?: { returnObjects?: boolean; defaultValue?: string | string[] }) => string | string[]) => [
  { 
    name: 'OTR Side Wall Cutter',
    model: 'TPS-OTRSW4500',
    power: '22.5 kW',
    capacity: String(t('plants.otr.equipmentSpecs.sidewallCutter.capacity', { defaultValue: '2-4 tires/hour' })),
    maxDiameter: '4500mm (59/80R63)',
    dimensions: '6000 × 6000 × 4000mm',
    bladeLife: String(t('plants.otr.equipmentSpecs.sidewallCutter.bladeLife', { defaultValue: '15-20 tires' })),
    image: otrSidewallCutterImg,
    link: 'https://www.topsrecycling.com/amp/Economical-Waste-OTR-Tyre-Side-Wall-Cutter-pd49221560.html',
    features: t('plants.otr.equipmentSpecs.sidewallCutter.features', { returnObjects: true, defaultValue: ['Operates in underground pit', 'Cuts both sidewalls simultaneously', 'Crane/forklift loading', 'Cutting time: 3-5 minutes'] }) as string[]
  },
  { 
    name: 'OTR Crown Strip Cutter',
    model: 'TPS-OTRCR4500',
    power: '22.5 kW',
    capacity: String(t('plants.otr.equipmentSpecs.stripCutter.capacity', { defaultValue: '2-3 crowns/hour' })),
    bladeSize: '1000mm',
    dimensions: '6000 × 6000 × 1800mm',
    bladeLife: String(t('plants.otr.equipmentSpecs.stripCutter.bladeLife', { defaultValue: '500-800 tires' })),
    powerConsumption: '~15 kW',
    weight: '~11 ton',
    image: otrStripCutterImg,
    link: 'https://www.topsrecycling.com/amp/Waste-OTR-Tyre-Crown-Strip-Block-Cutter-pd44600560.html',
    features: t('plants.otr.equipmentSpecs.stripCutter.features', { returnObjects: true, defaultValue: ['Processes crown >300mm thick', 'Normal shredders cannot process', 'Precise strip cutting', 'High strength and durability'] }) as string[]
  },
  { 
    name: 'OTR Block Cutter',
    model: 'TPS-OTRBC4500',
    power: '90 kW (50-60%)',
    capacity: String(t('plants.otr.equipmentSpecs.blockCutter.capacity', { defaultValue: '8-10 ton/hour' })),
    bladeLife: String(t('plants.otr.equipmentSpecs.blockCutter.bladeLife', { defaultValue: '1000-1500 tons' })),
    dimensions: '3300 × 2200 × 1800mm',
    weight: '~8 ton',
    image: otrBlockCutterImg,
    link: 'https://www.topsrecycling.com/amp/Waste-OTR-Tyre-Block-Cutter-pd43780560.html',
    features: t('plants.otr.equipmentSpecs.blockCutter.features', { returnObjects: true, defaultValue: ['Processes strips and sidewalls', 'Output: chips for rasper/cracker', 'Blade life: 20-40 tires', 'Continuous 24/7 operation'] }) as string[]
  },
  { 
    name: 'Complete OTR Line',
    model: 'TPS-OTR-COMPLETE',
    power: '~135 kW',
    capacity: String(t('plants.otr.equipmentSpecs.completeLine.capacity', { defaultValue: '8-10 ton/hour' })),
    process: String(t('plants.otr.equipmentSpecs.completeLine.process', { defaultValue: '3 integrated steps' })),
    weight: '~30 ton',
    image: otrCompleteLineImg,
    features: t('plants.otr.equipmentSpecs.completeLine.features', { returnObjects: true, defaultValue: ['Sidewall + Strip + Block Cutter', 'Supervised installation included', 'Operator training', 'Permanent technical support'] }) as string[]
  },
];

// Output Products from OTR Recycling - Uses translations
const getOutputProducts = (t: (key: string, options?: { defaultValue?: string }) => string) => [
  { 
    name: t('plants.otr.products.rubberBlocks', { defaultValue: 'Blocos de Borracha' }), 
    percentage: '65%', 
    price: '$0.35/kg', 
    color: 'from-slate-600 to-slate-700',
    applications: String(t('plants.otr.products.rubberBlocksApps', { defaultValue: 'TDF (Combustível), Pirólise, Granulação, Co-processamento' })).split(', ')
  },
  { 
    name: t('plants.otr.products.steel', { defaultValue: 'Aço de Alta Qualidade' }), 
    percentage: '25%', 
    price: '$0.55/kg', 
    color: 'from-slate-500 to-gray-600',
    applications: String(t('plants.otr.products.steelApps', { defaultValue: 'Siderúrgicas, Fundições, Refino, Reciclagem' })).split(', ')
  },
  { 
    name: t('plants.otr.products.textileFibers', { defaultValue: 'Fibras Têxteis' }), 
    percentage: '10%', 
    price: '$0.20/kg', 
    color: 'from-blue-500 to-indigo-600',
    applications: String(t('plants.otr.products.textileFibersApps', { defaultValue: 'Isolamento, Absorventes, Geotêxteis, Compósitos' })).split(', ')
  },
];

// Key Specifications Summary - Real TOPS data - Uses translations
const getKeySpecs = (t: (key: string, options?: { defaultValue?: string }) => string) => [
  { label: t('plants.otr.specs.lineCapacity', { defaultValue: 'Capacidade Linha' }), value: '8-10 ton/hora' },
  { label: t('plants.otr.specs.maxDiameter', { defaultValue: 'Diâmetro Máximo' }), value: '4500mm (59/80R63)' },
  { label: t('plants.otr.specs.maxTireWeight', { defaultValue: 'Peso Máximo Pneu' }), value: '4,5 toneladas' },
  { label: t('plants.otr.specs.cutTime', { defaultValue: 'Tempo de Corte' }), value: '3-5 min/pneu' },
  { label: t('plants.otr.specs.totalPower', { defaultValue: 'Potência Total' }), value: '~135 kW' },
  { label: t('plants.otr.specs.bladeLife', { defaultValue: 'Vida das Lâminas' }), value: '1000-1500 ton' },
  { label: t('plants.otr.specs.operators', { defaultValue: 'Operadores' }), value: '2-3 pessoas/turno' },
  { label: t('plants.otr.specs.certifications', { defaultValue: 'Certificações' }), value: 'CE / ISO' },
];

export default function OTRPlant() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeEquipment, setActiveEquipment] = useState(0);

  // Get translated data
  const otrMachines = getOtrMachines(t);
  const applications = getApplications(t);
  const outputProducts = getOutputProducts(t);
  const keySpecs = getKeySpecs(t);
  const equipmentSpecs = getEquipmentSpecs(t);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        
        <div className="container-wide relative z-10">
          <Link to="/solutions" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('plants.backToSolutions', 'Voltar para Soluções')}
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-primary text-sm font-medium">
                    {t('plants.otr.badge', 'Soluções para Pneus Gigantes')}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2">
                  <Building2 className="h-4 w-4 text-secondary" />
                  <span className="text-secondary text-sm font-medium">
                    {t('plants.otr.poweredByTops', 'Technology by TOPS Recycling')}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {t('plants.otr.title', 'Reciclagem de Pneus OTR')}
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-4 leading-relaxed">
                {t('plants.otr.description', 'Sistema especializado para reciclagem de pneus gigantes de mineração, portos, agricultura e construção. Processa pneus de até 4,5 toneladas com diâmetro de até 4500mm.')}
              </p>

              {/* TOPS Credit */}
              <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4 mb-8">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-secondary">{t('plants.otr.topsCredit', 'TOPS Recycling Group:')}</strong>{' '}
                  {t('plants.otr.topsCreditDesc', 'All OTR Smart Line equipment is designed and manufactured by our strategic partner TOPS, with over 15 years of experience in tire recycling solutions across 60+ countries.')}
                </p>
              </div>

              {/* Key Metrics - Real TOPS data */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Gauge className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">8-10</div>
                  <div className="text-xs text-muted-foreground">ton/hora</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">4.5</div>
                  <div className="text-xs text-muted-foreground">ton/pneu max</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">3-5</div>
                  <div className="text-xs text-muted-foreground">min/corte</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">135</div>
                  <div className="text-xs text-muted-foreground">kW total</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  variant="elp-solid"
                  asChild
                >
                  <Link to="/partnership/otr">
                    {t('plants.otr.becomePartner', 'Seja Nosso Parceiro')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById('smart-line')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('plants.otr.smartLine', 'Smart Line')}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => document.getElementById('equipment')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('plants.viewEquipment', 'Ver Equipamentos')}
                </Button>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <WatermarkImage 
                  src={otrTirePartnershipImg} 
                  alt="Pneu OTR Gigante com Equipe" 
                  className="aspect-video"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg">
                <div className="text-sm text-muted-foreground">{t('plants.otr.maxSize', 'Tamanho Máximo')}</div>
                <div className="text-2xl font-bold text-primary">59/80R63</div>
                <div className="text-xs text-muted-foreground">4.500mm diâmetro</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Applications Section */}
      <section className="py-16 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('plants.otr.applicationsTitle', 'Aplicações')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('plants.otr.applicationsDesc', 'Nossa linha OTR processa pneus gigantes de diversas indústrias')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {applications.map((app, index) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.15, 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <GlassCard className="h-full p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                  >
                    <app.icon className="h-10 w-10 text-primary mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{app.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{app.description}</p>
                  <div className="space-y-1">
                    {app.examples.map((ex, i) => (
                      <motion.div 
                        key={ex} 
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="text-xs text-primary/80 flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        {ex}
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Line Section */}
      <section id="smart-line" className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-primary text-sm font-medium">{t('plants.otr.smartLine.badge', 'New Technology 2025')}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {t('plants.otr.smartLine.title', 'Smart Line – Reciclagem Automatizada')}
              </h2>
              
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {t('plants.otr.smartLine.description', 'Nossa fábrica foi significativamente ampliada, aumentando nossa capacidade de produção e inovação. O upgrade para linha inteligente inclui robôs para posicionamento e corte automático de pneus OTR.')}
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('plants.otr.smartLine.feature1Title', 'Processo Automatizado')}</p>
                    <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.feature1Desc', 'Basta colocar o pneu na plataforma → O robô posiciona e corta')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('plants.otr.smartLine.feature2Title', 'Primeira Instalação: Austrália')}</p>
                    <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.feature2Desc', 'Demonstration line: April/May 2025')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('plants.otr.smartLine.feature3Title', 'Expansão Global')}</p>
                    <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.feature3Desc', '17-18 factories overseas within 5 years')}</p>
                  </div>
                </div>
              </div>

              <Button asChild size="lg" variant="elp-solid">
                <Link to="/partnership/otr">
                  {t('plants.otr.smartLine.cta', 'Seja Nosso Parceiro')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t('plants.otr.smartLine.howItWorks', 'Como Funciona')}
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">1</div>
                    <div>
                      <p className="font-medium">{t('plants.otr.smartLine.step1Title', 'Carregamento')}</p>
                      <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.step1Desc', 'Pneu OTR na plataforma')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">2</div>
                    <div>
                      <p className="font-medium">{t('plants.otr.smartLine.step2Title', 'Posicionamento Robótico')}</p>
                      <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.step2Desc', 'Robô posiciona automaticamente')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">3</div>
                    <div>
                      <p className="font-medium">{t('plants.otr.smartLine.step3Title', 'Corte Preciso')}</p>
                      <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.step3Desc', 'Laterais, coroa e componentes separados')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">4</div>
                    <div>
                      <p className="font-medium">{t('plants.otr.smartLine.step4Title', 'Output')}</p>
                      <p className="text-sm text-muted-foreground">{t('plants.otr.smartLine.step4Desc', 'Borracha, aço e fibras recuperados')}</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Global Expansion Plan */}
      <section className="py-20">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">{t('plants.otr.expansion.badge', 'Plan 2025-2030')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('plants.otr.expansion.title', 'Meta: 1 Milhão de Toneladas/Ano')}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {t('plants.otr.expansion.description', 'Plano ambicioso: 17-18 fábricas no exterior nos próximos 5 anos, com capacidade de ~175 toneladas/hora (~10 ton/hora por fábrica).')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { year: '2025', milestone: 'Australia', factories: '1', capacity: '10 ton/h' },
              { year: '2026', milestone: 'South America & Europe', factories: '3-4', capacity: '30-40 ton/h' },
              { year: '2027', milestone: 'Africa & Middle East', factories: '8-10', capacity: '80-100 ton/h' },
              { year: '2028-30', milestone: 'Global Goal', factories: '17-18', capacity: '175 ton/h' },
            ].map((phase, index) => (
              <motion.div
                key={phase.year}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="h-full p-6 hover:border-primary/50 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-xl font-bold text-primary">{phase.year}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{phase.milestone}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium text-foreground">{t('plants.otr.expansion.factories', 'Fábricas')}:</span> {phase.factories}</p>
                    <p><span className="font-medium text-foreground">{t('plants.otr.expansion.capacity', 'Capacidade')}:</span> {phase.capacity}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <GlassCard className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <Handshake className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-semibold">{t('plants.otr.expansion.partnerCta', 'Quer fazer parte desta expansão?')}</p>
                <p className="text-sm text-muted-foreground">{t('plants.otr.expansion.partnerDesc', 'Buscamos parceiros com acesso a fontes de pneus OTR')}</p>
              </div>
              <Button asChild variant="elp-outline">
                <Link to="/partnership/otr">{t('plants.otr.expansion.partnerBtn', 'Saiba Mais')}</Link>
              </Button>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Machine Gallery */}
      <section className="py-16">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('plants.otr.galleryTitle', 'Galeria de Equipamentos OTR')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('plants.otr.galleryDesc', 'Conheça os equipamentos especializados para reciclagem de pneus gigantes')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {otrMachines.map((machine, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ 
                  delay: index * 0.1, 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 80
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 20px 40px rgba(245, 158, 11, 0.2)",
                  transition: { duration: 0.3 }
                }}
                className="group cursor-pointer"
                onClick={() => setSelectedImage(index)}
              >
                <div className="relative rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300">
                  <WatermarkImage 
                    src={machine.src} 
                    alt={machine.title} 
                    className="aspect-square group-hover:scale-110 transition-transform duration-500"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
                  >
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="text-white text-sm font-medium">{machine.title}</div>
                      <div className="text-primary-foreground text-xs">{machine.model}</div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) => (prev === 0 ? otrMachines.length - 1 : (prev || 0) - 1));
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <div 
              className="max-w-5xl w-full select-none" 
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.preventDefault()}
            >
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl overflow-hidden"
              >
                <WatermarkImage 
                  src={otrMachines[selectedImage].src}
                  alt={otrMachines[selectedImage].title}
                  className="w-full"
                  watermarkOpacity={0.25}
                />
              </motion.div>
              <div className="text-center mt-4">
                <h3 className="text-xl font-semibold text-white">{otrMachines[selectedImage].title}</h3>
                <p className="text-primary-foreground">{otrMachines[selectedImage].model}</p>
                <p className="text-muted-foreground mt-1">{otrMachines[selectedImage].desc}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage((prev) => ((prev || 0) + 1) % otrMachines.length);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Equipment Details */}
      <section id="equipment" className="py-16 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('plants.otr.equipmentTitle', 'Especificações Técnicas')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('plants.otr.equipmentDesc', 'Detalhes técnicos de cada equipamento da linha OTR')}
            </p>
          </div>

          {/* Equipment Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {equipmentSpecs.map((eq, index) => (
              <Button
                key={index}
                variant={activeEquipment === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveEquipment(index)}
              >
                {eq.name.replace('OTR ', '')}
              </Button>
            ))}
          </div>

          {/* Active Equipment Details */}
          <motion.div
            key={activeEquipment}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <GlassCard className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="text-primary text-sm font-medium mb-2">{equipmentSpecs[activeEquipment].model}</div>
                  <h3 className="text-2xl font-bold mb-4">{equipmentSpecs[activeEquipment].name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">{t('plants.otr.specs.power', 'Potência')}</div>
                      <div className="font-semibold">{equipmentSpecs[activeEquipment].power}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">{t('plants.otr.specs.capacity', 'Capacidade')}</div>
                      <div className="font-semibold">{equipmentSpecs[activeEquipment].capacity}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">{t('plants.otr.specs.dimensions', 'Dimensões')}</div>
                      <div className="font-semibold">{equipmentSpecs[activeEquipment].dimensions || 'Consultar'}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">
                        {equipmentSpecs[activeEquipment].maxDiameter ? t('plants.otr.specs.maxDiameter', 'Diâmetro Max') : 
                         equipmentSpecs[activeEquipment].bladeSize ? t('plants.otr.specs.blade', 'Lâmina') :
                         equipmentSpecs[activeEquipment].bladeLife ? t('plants.otr.specs.bladeLife', 'Vida Lâminas') :
                         t('plants.otr.specs.process', 'Processo')}
                      </div>
                      <div className="font-semibold">
                        {equipmentSpecs[activeEquipment].maxDiameter || 
                         equipmentSpecs[activeEquipment].bladeSize ||
                         equipmentSpecs[activeEquipment].bladeLife ||
                         equipmentSpecs[activeEquipment].process}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">{t('plants.otr.specs.features', 'Características')}:</div>
                    {equipmentSpecs[activeEquipment].features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {equipmentSpecs[activeEquipment].link && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => window.open(equipmentSpecs[activeEquipment].link, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('plants.otr.viewOnTops', 'Ver no site TOPS Recycling')}
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="rounded-xl overflow-hidden">
                    <WatermarkImage 
                      src={equipmentSpecs[activeEquipment].image || otrTirePartnershipImg} 
                      alt={equipmentSpecs[activeEquipment].name}
                      className="aspect-video"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Strategic Partner Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('plants.otr.partnerTitle', 'Parceiro Estratégico')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('plants.otr.partnerDesc', 'Equipamentos fornecidos por nosso parceiro exclusivo na China')}
            </p>
          </div>

          <GlassCard className="max-w-4xl mx-auto p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-2xl font-bold">TOPS Recycling</h3>
                    <p className="text-muted-foreground">Zhangjiagang City, Jiangsu Province, China</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">
                  {t('plants.otr.partnerAbout', 'Fabricante líder mundial em equipamentos de reciclagem de pneus OTR. Com mais de 15 anos de experiência, a TOPS Recycling fornece soluções completas para processamento de pneus gigantes de mineração, portos e construção.')}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">15+</div>
                    <div className="text-xs text-muted-foreground">{t('plants.otr.partnerYears', 'Anos de Experiência')}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">50+</div>
                    <div className="text-xs text-muted-foreground">{t('plants.otr.partnerCountries', 'Países Atendidos')}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">CE</div>
                    <div className="text-xs text-muted-foreground">{t('plants.otr.partnerCert', 'Certificação ISO')}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-xs text-muted-foreground">{t('plants.otr.partnerSupport', 'Suporte Técnico')}</div>
                  </div>
                </div>
                <Button 
                  onClick={() => window.open('https://www.topsrecycling.com', '_blank')}
                  variant="elp-solid"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('plants.otr.visitSite', 'Visitar Site Oficial')}
                </Button>
              </div>
              <div className="flex-1">
                <div className="rounded-xl overflow-hidden">
                  <WatermarkImage 
                    src={otrTirePartnershipImg} 
                    alt="Parceria ELP + TOPS Recycling"
                    className="aspect-video"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {t('plants.otr.partnerVisit', 'Visita técnica às instalações da TOPS Recycling')}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Key Specifications Grid */}
      <section className="py-16">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('plants.otr.specsTitle', 'Especificações Gerais')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {keySpecs.map((spec, index) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-4 text-center hover:border-primary/50 transition-colors">
                  <div className="text-sm text-muted-foreground mb-1">{spec.label}</div>
                  <div className="text-lg font-bold text-primary">{spec.value}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Output Products */}
      <section className="py-16 bg-muted/30">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {t('plants.otr.productsTitle', 'Produtos Recuperados')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('plants.otr.productsDesc', 'Materiais de alto valor extraídos dos pneus OTR')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {outputProducts.map((product, index) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="p-6">
                  <div className={`h-2 rounded-full bg-gradient-to-r ${product.color} mb-4`} />
                  <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {product.percentage}
                    </span>
                    <span className="text-muted-foreground text-sm">{t('plants.otr.products.ofTire', 'do pneu')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    {t('plants.otr.products.avgPrice', 'Preço médio')}: <span className="text-foreground font-medium">{product.price}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium mb-2">{t('plants.otr.products.applicationsLabel', 'Aplicações')}:</div>
                    {product.applications.map((app) => (
                      <div key={app} className="text-xs text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-primary" />
                        {app}
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-16">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <ROICalculator 
              plantType="otr"
              baseInvestment={8000000}
              operatingCostPerTon={35}
              revenuePerTon={110}
              defaultCapacity={150}
              maxCapacity={500}
            />
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section id="quote-form" className="py-16 bg-muted/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto">
            <PlantQuoteForm plantType="otr-recycling" plantTitle="Reciclagem de Pneus OTR" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
