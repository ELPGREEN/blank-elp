import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Mountain, 
  Recycle, 
  Factory, 
  Bot, 
  Globe, 
  Handshake, 
  TrendingUp, 
  Users, 
  Building2, 
  Cpu, 
  ShoppingCart, 
  FileText, 
  Phone,
  Target,
  Award,
  Leaf,
  CheckCircle2,
  Plane
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/glass-card';

// Business Solutions
const businessSolutions = [
  {
    id: 'otr-partnership',
    icon: Bot,
    title: 'OTR Smart Line Partnership',
    subtitle: 'Robotic Tire Recycling',
    description: 'Partner with us to recycle giant OTR tires. We bring the Smart Line technology with robots - you bring the tire sources. First demo line in Australia (April/May 2025).',
    highlights: ['No equipment sales - Partnership model', 'Robot-automated processing', '17-18 factories globally by 2030'],
    cta: 'Become a Partner',
    path: '/partnership/otr',
    gradient: 'from-primary to-secondary',
    featured: true
  },
  {
    id: 'otr-sources',
    icon: Mountain,
    title: 'OTR Tire Source Indication',
    subtitle: 'Find OTR Tire Sources',
    description: 'Indicate sources of OTR tires from mining companies, manufacturers, or dealers. We travel to you and negotiate together with the resource owner.',
    highlights: ['Mining companies', 'Tire manufacturers', 'Tire dealers', 'Ports & terminals'],
    cta: 'Indicate a Source',
    path: '/otr-sources',
    gradient: 'from-slate-600 to-slate-700'
  },
  {
    id: 'tire-recycling',
    icon: Recycle,
    title: 'Tire Recycling Plants',
    subtitle: 'Complete Recycling Lines',
    description: 'Full tire recycling solutions from shredding to granulation. Machines for conventional passenger and truck tires.',
    highlights: ['Shredders & granulators', 'Cracker mills', 'Debeaders', 'Complete lines'],
    cta: 'View Solutions',
    path: '/plants/tire-recycling',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'pyrolysis',
    icon: Factory,
    title: 'Pyrolysis Plants',
    subtitle: 'Waste to Energy',
    description: 'Advanced pyrolysis technology to convert rubber and plastic waste into fuel oil, recovered carbon black (rCB), and steel.',
    highlights: ['Continuous & batch systems', 'Zero emissions', 'Oil & rCB output', 'Energy recovery'],
    cta: 'Learn More',
    path: '/plants/pyrolysis',
    gradient: 'from-slate-500 to-slate-600'
  },
  {
    id: 'saas',
    icon: Cpu,
    title: 'SaaS Platform',
    subtitle: 'Digital Circular Economy',
    description: 'Digital platforms for ESG tracking, blockchain traceability, and IoT monitoring of recycling operations.',
    highlights: ['ESG Dashboard', 'Blockchain traceability', 'IoT sensors', 'Marketplace'],
    cta: 'Explore Platform',
    path: '/saas',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'marketplace',
    icon: ShoppingCart,
    title: 'Marketplace',
    subtitle: 'Buy & Sell Recycled Materials',
    description: 'Connect with buyers and sellers of recycled rubber products, recovered carbon black, and recycled steel.',
    highlights: ['Rubber granules', 'Recovered carbon black', 'Recycled steel', 'TDF'],
    cta: 'Access Marketplace',
    path: '/marketplace',
    gradient: 'from-primary to-secondary'
  },
];

// Global Presence
const globalPresence = [
  { region: 'Europe', location: 'Milan, Italy', role: 'EU Headquarters' },
  { region: 'Asia', location: 'Zhangjiagang, China', role: 'Manufacturing Partner (TOPS)' },
  { region: 'South America', location: 'São Paulo, Brazil', role: 'LATAM Operations' },
  { region: 'Oceania', location: 'Australia', role: 'First Smart Line (2025)' },
];

// Key Stats
const keyStats = [
  { value: '1M', label: 'Tons/Year Target', suffix: '' },
  { value: '17-18', label: 'Factories by 2030', suffix: '' },
  { value: '175', label: 'Tons/Hour Global', suffix: '' },
  { value: '60+', label: 'Partner Countries', suffix: '' },
];

export default function BusinessIndex() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900">
        <div className="absolute inset-0 bg-hero-pattern opacity-5" />
        
        <div className="container-wide relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Building2 className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">ELP Green Technology</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Business Solutions & Partnerships
            </h1>
            
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connecting green technology to sustainable capital. Explore our complete ecosystem 
              for tire recycling, circular economy, and global partnerships.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="elp-white" asChild>
                <Link to="/partnership/otr">
                  OTR Partnership
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="elp-white-outline" asChild>
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {keyStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Partnership - OTR Smart Line */}
      <section className="py-20">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">Featured Opportunity</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">OTR Smart Line Partnership</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our biggest opportunity: Partner with us to set up Smart Lines for OTR tire recycling worldwide.
            </p>
          </motion.div>

          <GlassCard className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">How It Works</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We are upgrading our OTR tire recycling plant to a Smart Line with <strong>robots</strong>. 
                  Just put OTR tires on the platform, then the robot will position and cut the tires automatically.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm"><strong>First Demo:</strong> Australia (April/May 2025)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm"><strong>Global Goal:</strong> 1 million tons/year capacity (~175 tons/hour)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm"><strong>Expansion:</strong> 17-18 factories overseas within 5 years</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm"><strong>Your Role:</strong> Find OTR tire sources, we bring the technology</p>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-primary font-medium">
                    ⚠️ We don't sell the Smart Line – we're looking for partners to operate together.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button asChild size="lg" variant="elp-solid">
                    <Link to="/partnership/otr">
                      Become a Partner
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/otr-sources">
                      Indicate OTR Source
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-5 text-center">
                    <Plane className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">We Travel</p>
                    <p className="text-xs text-muted-foreground">To meet your sources</p>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <Handshake className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">Together</p>
                    <p className="text-xs text-muted-foreground">We negotiate jointly</p>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">10 ton/h</p>
                    <p className="text-xs text-muted-foreground">Per factory capacity</p>
                  </GlassCard>
                  <GlassCard className="p-5 text-center">
                    <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">Global</p>
                    <p className="text-xs text-muted-foreground">Expansion 2025-2030</p>
                  </GlassCard>
                </div>

                {/* OTR Source Types */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="font-medium mb-3">OTR Sources We're Looking For:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mountain className="h-4 w-4 text-primary" />
                      <span>Mining Companies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-primary" />
                      <span>Tire Manufacturers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span>Tire Dealers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Ports & Terminals</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* All Business Solutions */}
      <section className="py-20 bg-muted/30">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">All Business Solutions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Complete ecosystem for tire recycling, circular economy, and sustainable business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessSolutions.map((solution, index) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={solution.path}>
                  <GlassCard className={`h-full p-6 hover:border-primary/30 transition-all group ${solution.featured ? 'ring-2 ring-primary/30' : ''}`}>
                    {solution.featured && (
                      <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full mb-4">
                        <Award className="h-3 w-3" />
                        Featured
                      </div>
                    )}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <solution.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{solution.title}</h3>
                    <p className="text-sm text-primary font-medium mb-3">{solution.subtitle}</p>
                    <p className="text-sm text-muted-foreground mb-4">{solution.description}</p>
                    <div className="space-y-1 mb-4">
                      {solution.highlights.slice(0, 3).map((highlight) => (
                        <div key={highlight} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {highlight}
                        </div>
                      ))}
                    </div>
                    <div className="inline-flex items-center text-primary font-medium text-sm gap-2 group-hover:gap-3 transition-all">
                      {solution.cta} <ArrowRight className="w-4 h-4" />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="py-20">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">Global Network</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Global Presence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Strategic locations across 4 continents for manufacturing, operations, and expansion.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {globalPresence.map((location, index) => (
              <motion.div
                key={location.region}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">{location.region}</h3>
                  <p className="text-sm text-primary mb-2">{location.location}</p>
                  <p className="text-xs text-muted-foreground">{location.role}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-90" />
        <div className="container-wide text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Partner With Us?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Whether you have OTR tire sources, need recycling equipment, or want to join our marketplace - we're here to help.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="elp-white" asChild>
                <Link to="/partnership/otr">
                  OTR Partnership
                  <Handshake className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" className="bg-white/10 text-white border-2 border-white hover:bg-white/20" asChild>
                <Link to="/contact">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
