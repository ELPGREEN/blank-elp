import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  MapPin,
  Factory,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronRight,
  Brain,
  Sparkles,
  Loader2,
  Zap,
  Users,
  Ruler,
  Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeasibilityTemplate {
  id: string;
  nameKey: string;
  regionKey: string;
  country: string;
  flag: string;
  descriptionKey: string;
  daily_capacity_tons: number;
  equipment_cost: number;
  installation_cost: number;
  infrastructure_cost: number;
  working_capital: number;
  other_capex: number;
  raw_material_cost: number;
  labor_cost: number;
  energy_cost: number;
  maintenance_cost: number;
  logistics_cost: number;
  administrative_cost: number;
  other_opex: number;
  rubber_granules_price: number;
  rubber_granules_yield: number;
  steel_wire_price: number;
  steel_wire_yield: number;
  textile_fiber_price: number;
  textile_fiber_yield: number;
  tax_rate: number;
  highlightKeys: string[];
}

const templates: FeasibilityTemplate[] = [
  // NOVO: Template Planilha Padrao com custos operacionais detalhados
  {
    id: 'brazil-standard-excel',
    nameKey: 'brazilStandardExcelName',
    regionKey: 'southAmerica',
    country: 'Brasil',
    flag: '🇧🇷',
    descriptionKey: 'brazilStandardExcelDesc',
    // Parametros de producao: 18h/dia, 26 dias/mes, 12 meses = 10 ton/hora
    daily_capacity_tons: 180, // 10 ton/h x 18h = 180 ton/dia
    // CAPEX baseado na planilha: $50.4M total investment
    equipment_cost: 35000000, // ~70% do CAPEX para equipamentos
    installation_cost: 5000000,
    infrastructure_cost: 6000000,
    working_capital: 3500000,
    other_capex: 921830, // Ajuste para totalizar $50,421,830
    // OPEX mensal detalhado da planilha (valores em USD/mes)
    raw_material_cost: 0, // Recebe pneus sem custo
    labor_cost: 47000, // Factory $30K + Office $17K
    energy_cost: 80613, // Eletricidade: 2650kW x 65% x 18h x 26d x $0.1/kWh
    maintenance_cost: 1500, // Equipment maintenance
    logistics_cost: 20000, // Transporte $15K + Combustivel $5K
    administrative_cost: 10000, // Depreciacao $8.5K + Suprimentos $1.5K
    other_opex: 4558, // Agua $1.558 + Outras $3K
    // Yields e precos da planilha (mercado Brasil Jan 2026)
    rubber_granules_price: 290, // Crumb Rubber R$1.50/kg = $0.29/kg = $290/ton
    rubber_granules_yield: 70,
    steel_wire_price: 480, // Wires R$2.50/kg = $0.48/kg = $480/ton
    steel_wire_yield: 20,
    textile_fiber_price: 410, // Nylon R$2.12/kg = $0.41/kg = $410/ton
    textile_fiber_yield: 10,
    tax_rate: 34,
    highlightKeys: ['excelStandard', 'detailedOpex', 'realMarketPrices', 'brazilBenchmark']
  },
  {
    id: 'australia',
    nameKey: 'australiaName',
    regionKey: 'oceania',
    country: 'Australia',
    flag: '🇦🇺',
    descriptionKey: 'australiaDesc',
    daily_capacity_tons: 100,
    equipment_cost: 3200000,
    installation_cost: 600000,
    infrastructure_cost: 1500000,
    working_capital: 800000,
    other_capex: 400000,
    raw_material_cost: 0,
    labor_cost: 85000,
    energy_cost: 35000,
    maintenance_cost: 28000,
    logistics_cost: 45000,
    administrative_cost: 22000,
    other_opex: 15000,
    rubber_granules_price: 320,
    rubber_granules_yield: 74.7,
    steel_wire_price: 280,
    steel_wire_yield: 15.7,
    textile_fiber_price: 180,
    textile_fiber_yield: 9.7,
    tax_rate: 30,
    highlightKeys: ['freeRawMaterial', 'highPrices', 'strongMiningDemand']
  },
  {
    id: 'brazil-north',
    nameKey: 'brazilNorthName',
    regionKey: 'southAmerica',
    country: 'Brasil',
    flag: '🇧🇷',
    descriptionKey: 'brazilNorthDesc',
    daily_capacity_tons: 85,
    equipment_cost: 2400000,
    installation_cost: 400000,
    infrastructure_cost: 900000,
    working_capital: 500000,
    other_capex: 300000,
    raw_material_cost: 0, // Recebe pneus via Reciclanip
    labor_cost: 28000,
    energy_cost: 18000,
    maintenance_cost: 15000,
    logistics_cost: 35000,
    administrative_cost: 12000,
    other_opex: 8000,
    rubber_granules_price: 220,
    rubber_granules_yield: 74.7,
    steel_wire_price: 200,
    steel_wire_yield: 15.7,
    textile_fiber_price: 100,
    textile_fiber_yield: 9.7,
    tax_rate: 34,
    highlightKeys: ['reciclanipPartner', 'sudamIncentive', 'freeRawMaterial']
  },
  {
    id: 'brazil-mining',
    nameKey: 'brazilMiningName',
    regionKey: 'southAmerica',
    country: 'Brasil',
    flag: '🇧🇷',
    descriptionKey: 'brazilMiningDesc',
    daily_capacity_tons: 120,
    equipment_cost: 3200000,
    installation_cost: 550000,
    infrastructure_cost: 1200000,
    working_capital: 650000,
    other_capex: 400000,
    raw_material_cost: -50, // Recebe taxa por receber pneus OTR
    labor_cost: 35000,
    energy_cost: 22000,
    maintenance_cost: 20000,
    logistics_cost: 45000,
    administrative_cost: 15000,
    other_opex: 10000,
    rubber_granules_price: 250,
    rubber_granules_yield: 74.7,
    steel_wire_price: 220,
    steel_wire_yield: 15.7,
    textile_fiber_price: 120,
    textile_fiber_yield: 9.7,
    tax_rate: 34,
    highlightKeys: ['valePartnership', 'pnrsCompliance', 'carbonCredits']
  },
  {
    id: 'brazil-southeast',
    nameKey: 'brazilSoutheastName',
    regionKey: 'southAmerica',
    country: 'Brasil',
    flag: '🇧🇷',
    descriptionKey: 'brazilSoutheastDesc',
    daily_capacity_tons: 100,
    equipment_cost: 2800000,
    installation_cost: 500000,
    infrastructure_cost: 1100000,
    working_capital: 600000,
    other_capex: 350000,
    raw_material_cost: 0,
    labor_cost: 38000,
    energy_cost: 25000,
    maintenance_cost: 18000,
    logistics_cost: 28000,
    administrative_cost: 14000,
    other_opex: 10000,
    rubber_granules_price: 280,
    rubber_granules_yield: 74.7,
    steel_wire_price: 240,
    steel_wire_yield: 15.7,
    textile_fiber_price: 140,
    textile_fiber_yield: 9.7,
    tax_rate: 34,
    highlightKeys: ['largestMarket', 'cetesb', 'industrialDemand']
  },
  {
    id: 'europe-italy',
    nameKey: 'italyName',
    regionKey: 'europe',
    country: 'Italy',
    flag: '🇮🇹',
    descriptionKey: 'italyDesc',
    daily_capacity_tons: 60,
    equipment_cost: 2800000,
    installation_cost: 550000,
    infrastructure_cost: 1200000,
    working_capital: 600000,
    other_capex: 350000,
    raw_material_cost: 15000,
    labor_cost: 55000,
    energy_cost: 40000,
    maintenance_cost: 22000,
    logistics_cost: 25000,
    administrative_cost: 18000,
    other_opex: 12000,
    rubber_granules_price: 350,
    rubber_granules_yield: 74.7,
    steel_wire_price: 300,
    steel_wire_yield: 15.7,
    textile_fiber_price: 200,
    textile_fiber_yield: 9.7,
    tax_rate: 24,
    highlightKeys: ['premiumPrices', 'strongEuRegulations', 'gateFeePotential']
  },
  {
    id: 'europe-germany',
    nameKey: 'germanyName',
    regionKey: 'europe',
    country: 'Germany',
    flag: '🇩🇪',
    descriptionKey: 'germanyDesc',
    daily_capacity_tons: 70,
    equipment_cost: 3500000,
    installation_cost: 700000,
    infrastructure_cost: 1800000,
    working_capital: 700000,
    other_capex: 500000,
    raw_material_cost: 10000,
    labor_cost: 75000,
    energy_cost: 45000,
    maintenance_cost: 25000,
    logistics_cost: 20000,
    administrative_cost: 20000,
    other_opex: 15000,
    rubber_granules_price: 380,
    rubber_granules_yield: 74.7,
    steel_wire_price: 320,
    steel_wire_yield: 15.7,
    textile_fiber_price: 220,
    textile_fiber_yield: 9.7,
    tax_rate: 30,
    highlightKeys: ['highestQuality', 'automotiveDemand', 'excellentLogistics']
  },
  {
    id: 'chile-mining',
    nameKey: 'chileName',
    regionKey: 'southAmerica',
    country: 'Chile',
    flag: '🇨🇱',
    descriptionKey: 'chileDesc',
    daily_capacity_tons: 90,
    equipment_cost: 2600000,
    installation_cost: 480000,
    infrastructure_cost: 1000000,
    working_capital: 550000,
    other_capex: 350000,
    raw_material_cost: 0,
    labor_cost: 38000,
    energy_cost: 22000,
    maintenance_cost: 18000,
    logistics_cost: 40000,
    administrative_cost: 14000,
    other_opex: 10000,
    rubber_granules_price: 260,
    rubber_granules_yield: 74.7,
    steel_wire_price: 230,
    steel_wire_yield: 15.7,
    textile_fiber_price: 140,
    textile_fiber_yield: 9.7,
    tax_rate: 27,
    highlightKeys: ['largestCopperMines', 'stableEconomy', 'freeTradeAgreements']
  },
  {
    id: 'south-africa',
    nameKey: 'southAfricaName',
    regionKey: 'africa',
    country: 'South Africa',
    flag: '🇿🇦',
    descriptionKey: 'southAfricaDesc',
    daily_capacity_tons: 75,
    equipment_cost: 2300000,
    installation_cost: 380000,
    infrastructure_cost: 850000,
    working_capital: 450000,
    other_capex: 280000,
    raw_material_cost: 0,
    labor_cost: 22000,
    energy_cost: 15000,
    maintenance_cost: 14000,
    logistics_cost: 30000,
    administrative_cost: 10000,
    other_opex: 8000,
    rubber_granules_price: 200,
    rubber_granules_yield: 74.7,
    steel_wire_price: 180,
    steel_wire_yield: 15.7,
    textile_fiber_price: 90,
    textile_fiber_yield: 9.7,
    tax_rate: 28,
    highlightKeys: ['lowOperatingCosts', 'growingAfricanDemand', 'miningHub']
  },
  {
    id: 'mexico-mining',
    nameKey: 'mexicoName',
    regionKey: 'northAmerica',
    country: 'Mexico',
    flag: '🇲🇽',
    descriptionKey: 'mexicoDesc',
    daily_capacity_tons: 80,
    equipment_cost: 2500000,
    installation_cost: 420000,
    infrastructure_cost: 950000,
    working_capital: 520000,
    other_capex: 320000,
    raw_material_cost: 0,
    labor_cost: 25000,
    energy_cost: 20000,
    maintenance_cost: 16000,
    logistics_cost: 32000,
    administrative_cost: 11000,
    other_opex: 8000,
    rubber_granules_price: 240,
    rubber_granules_yield: 74.7,
    steel_wire_price: 210,
    steel_wire_yield: 15.7,
    textile_fiber_price: 110,
    textile_fiber_yield: 9.7,
    tax_rate: 30,
    highlightKeys: ['govPartnership', 'royaltiesProgram', 'environmentalBonus', 'miningPartnerships']
  }
];

interface FeasibilityTemplatesProps {
  onSelectTemplate: (template: { name: string; country: string; daily_capacity_tons: number; equipment_cost: number; installation_cost: number; infrastructure_cost: number; working_capital: number; other_capex: number; raw_material_cost: number; labor_cost: number; energy_cost: number; maintenance_cost: number; logistics_cost: number; administrative_cost: number; other_opex: number; rubber_granules_price: number; rubber_granules_yield: number; steel_wire_price: number; steel_wire_yield: number; textile_fiber_price: number; textile_fiber_yield: number; tax_rate: number }) => void;
  onCollaborativeAnalysis?: (template: FeasibilityTemplate) => void;
}

export function FeasibilityTemplates({ onSelectTemplate, onCollaborativeAnalysis }: FeasibilityTemplatesProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [analyzingTemplate, setAnalyzingTemplate] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Record<string, { score: number; providers: string[] }>>({});

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const calculateQuickROI = (template: FeasibilityTemplate) => {
    const annualTonnage = template.daily_capacity_tons * 300 * 0.85;
    const revenue = 
      annualTonnage * (template.rubber_granules_yield / 100) * template.rubber_granules_price +
      annualTonnage * (template.steel_wire_yield / 100) * template.steel_wire_price +
      annualTonnage * (template.textile_fiber_yield / 100) * template.textile_fiber_price;
    
    const opex = (
      template.raw_material_cost + template.labor_cost + template.energy_cost +
      template.maintenance_cost + template.logistics_cost + template.administrative_cost +
      template.other_opex
    ) * 12;
    
    const investment = 
      template.equipment_cost + template.installation_cost + 
      template.infrastructure_cost + template.working_capital + template.other_capex;
    
    const ebitda = revenue - opex;
    const roi = (ebitda / investment) * 100;
    return roi;
  };

  const runCollaborativeAnalysis = async (template: FeasibilityTemplate) => {
    setAnalyzingTemplate(template.id);
    
    try {
      const totalInvestment = template.equipment_cost + template.installation_cost + 
        template.infrastructure_cost + template.working_capital + template.other_capex;
      const roi = calculateQuickROI(template);
      const annualTonnage = template.daily_capacity_tons * 300 * 0.85;
      const revenue = 
        annualTonnage * (template.rubber_granules_yield / 100) * template.rubber_granules_price +
        annualTonnage * (template.steel_wire_yield / 100) * template.steel_wire_price +
        annualTonnage * (template.textile_fiber_yield / 100) * template.textile_fiber_price;

      const response = await supabase.functions.invoke('generate-collaborative-document', {
        body: {
          documentType: 'feasibility_summary',
          country: template.country,
          language: i18n.language,
          companyName: t(`admin.feasibility.templates.${template.nameKey}`),
          additionalContext: `Template regional para ${template.country}`,
          feasibilityData: {
            studyName: t(`admin.feasibility.templates.${template.nameKey}`),
            location: template.country,
            totalInvestment,
            annualRevenue: revenue,
            roi,
            paybackMonths: Math.round(totalInvestment / (revenue / 12)),
            dailyCapacity: template.daily_capacity_tons,
          },
          maxIterations: 3,
        }
      });

      const { data, error } = response;

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Analysis failed');

      setAnalysisResults(prev => ({
        ...prev,
        [template.id]: {
          score: data.quality_score,
          providers: data.ai_providers_used || []
        }
      }));

      toast({
        title: 'Análise Colaborativa Completa',
        description: `${template.country}: Score ${data.quality_score}/100`,
      });

      onCollaborativeAnalysis?.(template);

    } catch (err: any) {
      toast({
        title: 'Erro na análise',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setAnalyzingTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">{t('admin.feasibility.templates.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('admin.feasibility.templates.description')}</p>
        
        {/* Feature highlight banner */}
        <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-950/30 dark:to-amber-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-center gap-6 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Terreno (m²)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="font-medium">Energia (kW)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Mão de Obra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Cálculo Automático</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            ⬆️ Clique em "Usar Template" para acessar os calculadores avançados de infraestrutura
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {templates.map((template, index) => {
          const roi = calculateQuickROI(template);
          const totalInvestment = 
            template.equipment_cost + template.installation_cost + 
            template.infrastructure_cost + template.working_capital + template.other_capex;
          const templateName = t(`admin.feasibility.templates.${template.nameKey}`);

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-border/60">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <span className="text-xl sm:text-2xl">{template.flag}</span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                          {t(`admin.feasibility.templates.regions.${template.regionKey}`)}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm sm:text-base leading-tight truncate">{templateName}</CardTitle>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] sm:text-xs text-muted-foreground block">ROI</span>
                      <span className={`font-bold text-sm sm:text-base ${roi > 30 ? 'text-green-600' : roi > 20 ? 'text-primary' : 'text-amber-600'}`}>
                        {roi.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-[10px] sm:text-xs line-clamp-2 mt-1">
                    {t(`admin.feasibility.templates.${template.descriptionKey}`)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Factory className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{template.daily_capacity_tons} t/d</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{formatCurrency(totalInvestment)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.highlightKeys.slice(0, 2).map((highlightKey, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] sm:text-xs font-normal px-1.5 py-0.5">
                        {t(`admin.feasibility.templates.highlights.${highlightKey}`)}
                      </Badge>
                    ))}
                    {analysisResults[template.id] && (
                      <Badge variant="outline" className="text-[9px] sm:text-xs font-normal bg-purple-500/10 text-purple-600 border-purple-500/30 px-1.5 py-0.5">
                        Score: {analysisResults[template.id].score}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button 
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        runCollaborativeAnalysis(template);
                      }}
                      disabled={analyzingTemplate === template.id}
                      className="flex-1 gap-1 h-8 sm:h-9 text-xs sm:text-sm min-w-0"
                    >
                      {analyzingTemplate === template.id ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                      ) : (
                        <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                      )}
                      <span className="truncate">IA Colaborativa</span>
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectTemplate({
                          name: templateName,
                          country: template.country,
                          daily_capacity_tons: template.daily_capacity_tons,
                          equipment_cost: template.equipment_cost,
                          installation_cost: template.installation_cost,
                          infrastructure_cost: template.infrastructure_cost,
                          working_capital: template.working_capital,
                          other_capex: template.other_capex,
                          raw_material_cost: template.raw_material_cost,
                          labor_cost: template.labor_cost,
                          energy_cost: template.energy_cost,
                          maintenance_cost: template.maintenance_cost,
                          logistics_cost: template.logistics_cost,
                          administrative_cost: template.administrative_cost,
                          other_opex: template.other_opex,
                          rubber_granules_price: template.rubber_granules_price,
                          rubber_granules_yield: template.rubber_granules_yield,
                          steel_wire_price: template.steel_wire_price,
                          steel_wire_yield: template.steel_wire_yield,
                          textile_fiber_price: template.textile_fiber_price,
                          textile_fiber_yield: template.textile_fiber_yield,
                          tax_rate: template.tax_rate
                        });
                      }}
                      className="flex-1 gap-1 h-8 sm:h-9 text-xs sm:text-sm min-w-0 bg-primary hover:bg-primary/90"
                    >
                      <Calculator className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{t('admin.feasibility.templates.useTemplate')}</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    </Button>
                  </div>
                  
                  {/* Indicator for advanced calculators */}
                  <div className="flex items-center justify-center gap-2 pt-1 text-[9px] text-muted-foreground">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span>Energia</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Ruler className="h-3 w-3 text-emerald-500" />
                    <span>Terreno</span>
                    <span className="text-muted-foreground/50">•</span>
                    <Users className="h-3 w-3 text-purple-500" />
                    <span>Equipe</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
