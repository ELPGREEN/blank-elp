import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  MapPin,
  Users,
  Building2,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Mail,
  Target,
  Package,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Country coordinates mapping
const countryCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
  'Brazil': { lat: -14.235, lng: -51.9253, name: 'Brasil' },
  'Brasil': { lat: -14.235, lng: -51.9253, name: 'Brasil' },
  'United States': { lat: 37.0902, lng: -95.7129, name: 'EUA' },
  'USA': { lat: 37.0902, lng: -95.7129, name: 'EUA' },
  'China': { lat: 35.8617, lng: 104.1954, name: 'China' },
  '中国': { lat: 35.8617, lng: 104.1954, name: 'China' },
  'Germany': { lat: 51.1657, lng: 10.4515, name: 'Alemanha' },
  'Alemanha': { lat: 51.1657, lng: 10.4515, name: 'Alemanha' },
  'Italy': { lat: 41.8719, lng: 12.5674, name: 'Itália' },
  'Italia': { lat: 41.8719, lng: 12.5674, name: 'Itália' },
  'Itália': { lat: 41.8719, lng: 12.5674, name: 'Itália' },
  'Australia': { lat: -25.2744, lng: 133.7751, name: 'Austrália' },
  'Austrália': { lat: -25.2744, lng: 133.7751, name: 'Austrália' },
  'Portugal': { lat: 39.3999, lng: -8.2245, name: 'Portugal' },
  'Spain': { lat: 40.4637, lng: -3.7492, name: 'Espanha' },
  'España': { lat: 40.4637, lng: -3.7492, name: 'Espanha' },
  'Espanha': { lat: 40.4637, lng: -3.7492, name: 'Espanha' },
  'France': { lat: 46.2276, lng: 2.2137, name: 'França' },
  'França': { lat: 46.2276, lng: 2.2137, name: 'França' },
  'United Kingdom': { lat: 55.3781, lng: -3.436, name: 'Reino Unido' },
  'UK': { lat: 55.3781, lng: -3.436, name: 'Reino Unido' },
  'Japan': { lat: 36.2048, lng: 138.2529, name: 'Japão' },
  'Japão': { lat: 36.2048, lng: 138.2529, name: 'Japão' },
  'India': { lat: 20.5937, lng: 78.9629, name: 'Índia' },
  'Índia': { lat: 20.5937, lng: 78.9629, name: 'Índia' },
  'Mexico': { lat: 23.6345, lng: -102.5528, name: 'México' },
  'México': { lat: 23.6345, lng: -102.5528, name: 'México' },
  'Argentina': { lat: -38.4161, lng: -63.6167, name: 'Argentina' },
  'Chile': { lat: -35.6751, lng: -71.543, name: 'Chile' },
  'Colombia': { lat: 4.5709, lng: -74.2973, name: 'Colômbia' },
  'Colômbia': { lat: 4.5709, lng: -74.2973, name: 'Colômbia' },
  'Peru': { lat: -9.19, lng: -75.0152, name: 'Peru' },
  'South Africa': { lat: -30.5595, lng: 22.9375, name: 'África do Sul' },
  'África do Sul': { lat: -30.5595, lng: 22.9375, name: 'África do Sul' },
  'Indonesia': { lat: -0.7893, lng: 113.9213, name: 'Indonésia' },
  'Indonésia': { lat: -0.7893, lng: 113.9213, name: 'Indonésia' },
  'Malaysia': { lat: 4.2105, lng: 101.9758, name: 'Malásia' },
  'Malásia': { lat: 4.2105, lng: 101.9758, name: 'Malásia' },
  'Thailand': { lat: 15.87, lng: 100.9925, name: 'Tailândia' },
  'Tailândia': { lat: 15.87, lng: 100.9925, name: 'Tailândia' },
  'Vietnam': { lat: 14.0583, lng: 108.2772, name: 'Vietnã' },
  'Vietnã': { lat: 14.0583, lng: 108.2772, name: 'Vietnã' },
  'Philippines': { lat: 12.8797, lng: 121.774, name: 'Filipinas' },
  'Filipinas': { lat: 12.8797, lng: 121.774, name: 'Filipinas' },
  'Saudi Arabia': { lat: 23.8859, lng: 45.0792, name: 'Arábia Saudita' },
  'Arábia Saudita': { lat: 23.8859, lng: 45.0792, name: 'Arábia Saudita' },
  'UAE': { lat: 23.4241, lng: 53.8478, name: 'Emirados Árabes' },
  'Emirados Árabes': { lat: 23.4241, lng: 53.8478, name: 'Emirados Árabes' },
  'Canada': { lat: 56.1304, lng: -106.3468, name: 'Canadá' },
  'Canadá': { lat: 56.1304, lng: -106.3468, name: 'Canadá' },
  'Russia': { lat: 61.524, lng: 105.3188, name: 'Rússia' },
  'Rússia': { lat: 61.524, lng: 105.3188, name: 'Rússia' },
  'Netherlands': { lat: 52.1326, lng: 5.2913, name: 'Holanda' },
  'Holanda': { lat: 52.1326, lng: 5.2913, name: 'Holanda' },
  'Belgium': { lat: 50.5039, lng: 4.4699, name: 'Bélgica' },
  'Bélgica': { lat: 50.5039, lng: 4.4699, name: 'Bélgica' },
  'Switzerland': { lat: 46.8182, lng: 8.2275, name: 'Suíça' },
  'Suíça': { lat: 46.8182, lng: 8.2275, name: 'Suíça' },
  'Austria': { lat: 47.5162, lng: 14.5501, name: 'Áustria' },
  'Áustria': { lat: 47.5162, lng: 14.5501, name: 'Áustria' },
  'Poland': { lat: 51.9194, lng: 19.1451, name: 'Polônia' },
  'Polônia': { lat: 51.9194, lng: 19.1451, name: 'Polônia' },
  'Sweden': { lat: 60.1282, lng: 18.6435, name: 'Suécia' },
  'Suécia': { lat: 60.1282, lng: 18.6435, name: 'Suécia' },
  'Norway': { lat: 60.472, lng: 8.4689, name: 'Noruega' },
  'Noruega': { lat: 60.472, lng: 8.4689, name: 'Noruega' },
  'Denmark': { lat: 56.2639, lng: 9.5018, name: 'Dinamarca' },
  'Dinamarca': { lat: 56.2639, lng: 9.5018, name: 'Dinamarca' },
  'Finland': { lat: 61.9241, lng: 25.7482, name: 'Finlândia' },
  'Finlândia': { lat: 61.9241, lng: 25.7482, name: 'Finlândia' },
  'Greece': { lat: 39.0742, lng: 21.8243, name: 'Grécia' },
  'Grécia': { lat: 39.0742, lng: 21.8243, name: 'Grécia' },
  'Turkey': { lat: 38.9637, lng: 35.2433, name: 'Turquia' },
  'Turquia': { lat: 38.9637, lng: 35.2433, name: 'Turquia' },
  'Egypt': { lat: 26.8206, lng: 30.8025, name: 'Egito' },
  'Egito': { lat: 26.8206, lng: 30.8025, name: 'Egito' },
  'Morocco': { lat: 31.7917, lng: -7.0926, name: 'Marrocos' },
  'Marrocos': { lat: 31.7917, lng: -7.0926, name: 'Marrocos' },
  'Nigeria': { lat: 9.082, lng: 8.6753, name: 'Nigéria' },
  'Nigéria': { lat: 9.082, lng: 8.6753, name: 'Nigéria' },
  'Kenya': { lat: -0.0236, lng: 37.9062, name: 'Quênia' },
  'Quênia': { lat: -0.0236, lng: 37.9062, name: 'Quênia' },
  'New Zealand': { lat: -40.9006, lng: 174.886, name: 'Nova Zelândia' },
  'Nova Zelândia': { lat: -40.9006, lng: 174.886, name: 'Nova Zelândia' },
  'Singapore': { lat: 1.3521, lng: 103.8198, name: 'Singapura' },
  'Singapura': { lat: 1.3521, lng: 103.8198, name: 'Singapura' },
  'Hong Kong': { lat: 22.3193, lng: 114.1694, name: 'Hong Kong' },
  'Taiwan': { lat: 23.6978, lng: 120.9605, name: 'Taiwan' },
  'South Korea': { lat: 35.9078, lng: 127.7669, name: 'Coreia do Sul' },
  'Coreia do Sul': { lat: 35.9078, lng: 127.7669, name: 'Coreia do Sul' },
  'Israel': { lat: 31.0461, lng: 34.8516, name: 'Israel' },
  'Iran': { lat: 32.4279, lng: 53.688, name: 'Irã' },
  'Irã': { lat: 32.4279, lng: 53.688, name: 'Irã' },
  'Pakistan': { lat: 30.3753, lng: 69.3451, name: 'Paquistão' },
  'Paquistão': { lat: 30.3753, lng: 69.3451, name: 'Paquistão' },
  'Bangladesh': { lat: 23.685, lng: 90.3563, name: 'Bangladesh' },
  'Sri Lanka': { lat: 7.8731, lng: 80.7718, name: 'Sri Lanka' },
};

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  type: 'contact' | 'marketplace' | 'otr';
  created_at: string;
  message: string | null;
  lead_level: string;
}

interface CountryGroup {
  country: string;
  countryName: string;
  lat: number;
  lng: number;
  leads: Lead[];
  count: number;
}

const typeConfig = {
  contact: { label: 'Contato', color: 'bg-blue-500', icon: MessageSquare },
  marketplace: { label: 'Marketplace', color: 'bg-purple-500', icon: Package },
  otr: { label: 'OTR Lead', color: 'bg-emerald-500', icon: Target },
};

export function GlobalLeadMap() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<CountryGroup | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch all leads
  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['global-leads-map'],
    queryFn: async () => {
      const allLeads: Lead[] = [];

      // Fetch contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, company, country, channel, created_at, message, lead_level')
        .order('created_at', { ascending: false });

      contacts?.forEach(c => {
        const isOTR = c.channel === 'otr-source-indication';
        allLeads.push({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          country: c.country,
          type: isOTR ? 'otr' : 'contact',
          created_at: c.created_at,
          message: c.message,
          lead_level: c.lead_level || 'initial',
        });
      });

      // Fetch marketplace
      const { data: marketplace } = await supabase
        .from('marketplace_registrations')
        .select('id, contact_name, email, company_name, country, created_at, message, lead_level')
        .order('created_at', { ascending: false });

      marketplace?.forEach(m => {
        allLeads.push({
          id: m.id,
          name: m.contact_name,
          email: m.email,
          company: m.company_name,
          country: m.country,
          type: 'marketplace',
          created_at: m.created_at,
          message: m.message,
          lead_level: m.lead_level || 'initial',
        });
      });

      return allLeads;
    },
  });

  // Group leads by country
  const countryGroups = useMemo(() => {
    if (!leads) return [];

    const filteredLeads = typeFilter === 'all' 
      ? leads 
      : leads.filter(l => l.type === typeFilter);

    const groups: Record<string, CountryGroup> = {};

    filteredLeads.forEach(lead => {
      const country = lead.country || 'Unknown';
      const coords = countryCoordinates[country];
      
      if (!groups[country]) {
        groups[country] = {
          country,
          countryName: coords?.name || country,
          lat: coords?.lat || 0,
          lng: coords?.lng || 0,
          leads: [],
          count: 0,
        };
      }
      
      groups[country].leads.push(lead);
      groups[country].count++;
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [leads, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const allLeads = leads || [];
    return {
      total: allLeads.length,
      countries: new Set(allLeads.map(l => l.country).filter(Boolean)).size,
      byType: {
        contact: allLeads.filter(l => l.type === 'contact').length,
        marketplace: allLeads.filter(l => l.type === 'marketplace').length,
        otr: allLeads.filter(l => l.type === 'otr').length,
      },
      topCountries: countryGroups.slice(0, 5),
    };
  }, [leads, countryGroups]);

  const handleCountryClick = (group: CountryGroup) => {
    setSelectedCountry(group);
    setDetailsOpen(true);
  };

  // Map projection (simple equirectangular)
  const projectToMap = (lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.globalMap.totalLeads')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.globalMap.countries')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.countries}</p>
              </div>
              <Globe className="h-6 w-6 md:h-8 md:w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.globalMap.marketplace')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.byType.marketplace}</p>
              </div>
              <Package className="h-6 w-6 md:h-8 md:w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.globalMap.otrLead')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.byType.otr}</p>
              </div>
              <Target className="h-6 w-6 md:h-8 md:w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.globalMap.allTypes')}</SelectItem>
            <SelectItem value="contact">{t('admin.globalMap.contact')}</SelectItem>
            <SelectItem value="marketplace">{t('admin.globalMap.marketplace')}</SelectItem>
            <SelectItem value="otr">{t('admin.globalMap.otrLead')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('admin.globalMap.refresh')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* World Map */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Globe className="h-5 w-5" />
              {t('admin.globalMap.title')}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {t('admin.globalMap.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 md:p-4">
            <div className="relative aspect-[2/1] bg-slate-900 rounded-lg overflow-hidden">
              {/* Simple world map background */}
              <svg viewBox="0 0 800 400" className="w-full h-full">
                {/* Ocean background */}
                <rect width="800" height="400" fill="#0f172a" />
                
                {/* Grid lines */}
                {[...Array(9)].map((_, i) => (
                  <line
                    key={`h${i}`}
                    x1="0"
                    y1={i * 50}
                    x2="800"
                    y2={i * 50}
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                ))}
                {[...Array(17)].map((_, i) => (
                  <line
                    key={`v${i}`}
                    x1={i * 50}
                    y1="0"
                    x2={i * 50}
                    y2="400"
                    stroke="#1e293b"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Lead markers */}
                {countryGroups.map((group) => {
                  if (group.lat === 0 && group.lng === 0) return null;
                  const pos = projectToMap(group.lat, group.lng, 800, 400);
                  const size = Math.min(30, Math.max(8, group.count * 2 + 5));
                  
                  return (
                    <g key={group.country}>
                      {/* Glow effect */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={size + 5}
                        fill="url(#glow)"
                        opacity="0.6"
                      />
                      {/* Main circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={size}
                        fill="#3b82f6"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        className="cursor-pointer hover:fill-blue-400 transition-colors"
                        onClick={() => handleCountryClick(group)}
                      />
                      {/* Count label */}
                      <text
                        x={pos.x}
                        y={pos.y + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize={size > 15 ? "12" : "10"}
                        fontWeight="bold"
                      >
                        {group.count}
                      </text>
                    </g>
                  );
                })}

                {/* Gradient definitions */}
                <defs>
                  <radialGradient id="glow">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex gap-4 bg-slate-900/80 rounded-lg p-2">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-white/70">
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    {config.label}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Países
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {countryGroups.slice(0, 10).map((group, index) => (
                  <motion.div
                    key={group.country}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleCountryClick(group)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{group.countryName}</p>
                        <div className="flex gap-1">
                          {group.leads.some(l => l.type === 'contact') && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10">C</Badge>
                          )}
                          {group.leads.some(l => l.type === 'marketplace') && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10">M</Badge>
                          )}
                          {group.leads.some(l => l.type === 'otr') && (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10">O</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {group.count}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Country Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Leads em {selectedCountry?.countryName}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3">
              {selectedCountry?.leads.map((lead) => {
                const config = typeConfig[lead.type];
                const Icon = config.icon;
                return (
                  <div
                    key={lead.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}/10`}>
                        <Icon className={`h-4 w-4 ${config.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        {lead.company && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lead.company}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </p>
                        {lead.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {lead.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
