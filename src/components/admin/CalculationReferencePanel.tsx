// Calculation Reference Panel - Shows formulas + benchmarks by country
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calculator, Info, Globe, TrendingUp, DollarSign, Percent, Clock, Zap, Users, Truck, Building, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalculationReferencePanelProps {
  country: string;
  taxRate: number;
  discountRate: number;
  depreciationYears: number;
  dailyCapacity: number;
  operatingDays: number;
  utilizationRate: number;
  totalInvestment: number;
  annualRevenue: number;
  annualOpex: number;
  annualEbitda: number;
  roiPercentage: number;
  paybackMonths: number;
  irrPercentage: number;
  npv10Years: number;
  governmentRoyalties?: number;
  environmentalBonus?: number;
}

// Regional benchmarks database
const REGIONAL_BENCHMARKS: Record<string, {
  baseTax: number;
  socialCharges: number;
  electricityRate: number; // $/kWh
  laborMultiplier: number;
  logisticsCostPerTon: number;
  maintenancePercent: number;
  capexRange: { min: number; max: number };
  opexPerTon: { min: number; max: number };
  typicalRoi: { min: number; max: number };
  typicalPayback: { min: number; max: number }; // months
  incentives: string[];
}> = {
  'Brasil': {
    baseTax: 34, socialCharges: 70, electricityRate: 0.12, laborMultiplier: 1.0,
    logisticsCostPerTon: 10, maintenancePercent: 5, 
    capexRange: { min: 8000000, max: 15000000 },
    opexPerTon: { min: 40, max: 80 },
    typicalRoi: { min: 15, max: 35 },
    typicalPayback: { min: 24, max: 60 },
    incentives: ['SUDAM 75%', 'SUDENE 75%', 'ZFM 88%', 'Rota 2030']
  },
  'Australia': {
    baseTax: 30, socialCharges: 25, electricityRate: 0.18, laborMultiplier: 2.5,
    logisticsCostPerTon: 15, maintenancePercent: 5,
    capexRange: { min: 3000000, max: 8000000 },
    opexPerTon: { min: 50, max: 100 },
    typicalRoi: { min: 18, max: 40 },
    typicalPayback: { min: 18, max: 48 },
    incentives: ['R&D Tax Incentive', 'ARENA Grants', 'State Levies']
  },
  'Germany': {
    baseTax: 29.9, socialCharges: 40, electricityRate: 0.35, laborMultiplier: 3.0,
    logisticsCostPerTon: 18, maintenancePercent: 6,
    capexRange: { min: 5000000, max: 12000000 },
    opexPerTon: { min: 60, max: 120 },
    typicalRoi: { min: 12, max: 28 },
    typicalPayback: { min: 30, max: 72 },
    incentives: ['KfW Loans', 'East Germany Grants', 'EU ETS Credits']
  },
  'China': {
    baseTax: 25, socialCharges: 45, electricityRate: 0.08, laborMultiplier: 0.4,
    logisticsCostPerTon: 8, maintenancePercent: 4,
    capexRange: { min: 500000, max: 1500000 },
    opexPerTon: { min: 15, max: 40 },
    typicalRoi: { min: 25, max: 60 },
    typicalPayback: { min: 12, max: 36 },
    incentives: ['VAT Exemption', 'Provincial Subsidies', 'Green Credits']
  },
  'USA': {
    baseTax: 21, socialCharges: 20, electricityRate: 0.12, laborMultiplier: 2.0,
    logisticsCostPerTon: 12, maintenancePercent: 5,
    capexRange: { min: 2000000, max: 6000000 },
    opexPerTon: { min: 45, max: 90 },
    typicalRoi: { min: 18, max: 35 },
    typicalPayback: { min: 24, max: 54 },
    incentives: ['Section 45Q', 'IRA Credits', 'State Incentives']
  },
  'Italy': {
    baseTax: 24, socialCharges: 35, electricityRate: 0.25, laborMultiplier: 2.2,
    logisticsCostPerTon: 14, maintenancePercent: 5,
    capexRange: { min: 3000000, max: 8000000 },
    opexPerTon: { min: 50, max: 95 },
    typicalRoi: { min: 15, max: 32 },
    typicalPayback: { min: 28, max: 60 },
    incentives: ['Transizione 5.0', 'PNRR Funds', 'Mezzogiorno Credits']
  },
  'default': {
    baseTax: 25, socialCharges: 30, electricityRate: 0.15, laborMultiplier: 1.5,
    logisticsCostPerTon: 12, maintenancePercent: 5,
    capexRange: { min: 2000000, max: 8000000 },
    opexPerTon: { min: 40, max: 80 },
    typicalRoi: { min: 15, max: 35 },
    typicalPayback: { min: 24, max: 60 },
    incentives: ['Local incentives may apply']
  }
};

// Formulas reference
const FORMULAS = {
  roi: {
    name: 'ROI (Return on Investment)',
    formula: 'ROI = (Lucro Líquido / Investimento Total) × 100',
    description: 'Retorno percentual anual sobre o capital investido, após impostos'
  },
  payback: {
    name: 'Payback Period',
    formula: 'Payback = Investimento Total / Lucro Líquido Anual',
    description: 'Tempo para recuperar o investimento inicial em meses'
  },
  npv: {
    name: 'NPV (Valor Presente Líquido)',
    formula: 'NPV = Σ [FCt / (1 + r)^t] - I₀',
    description: 'Soma dos fluxos de caixa descontados menos investimento inicial'
  },
  irr: {
    name: 'IRR (Taxa Interna de Retorno)',
    formula: 'NPV = 0 quando r = IRR',
    description: 'Taxa de desconto que zera o NPV - deve ser > taxa de desconto'
  },
  ebitda: {
    name: 'EBITDA',
    formula: 'EBITDA = Receita Anual - OPEX Anual',
    description: 'Lucro antes de juros, impostos, depreciação e amortização'
  },
  netProfit: {
    name: 'Lucro Líquido',
    formula: 'Lucro = (EBITDA - Depreciação) × (1 - Taxa Imposto) + Depreciação',
    description: 'Lucro após impostos e depreciação'
  },
  electricity: {
    name: 'Custo Energia',
    formula: 'Energia = Potência(kW) × 65% × 18h × 26d × Tarifa',
    description: 'Consumo mensal baseado em potência instalada e utilização'
  },
  labor: {
    name: 'Custo Mão de Obra',
    formula: 'Labor = Σ(Funcionários × Salário × Encargos Sociais)',
    description: 'Folha mensal com encargos sociais por país'
  },
  partnershipImpact: {
    name: 'Impacto Parceria',
    formula: 'Impacto = (Bônus Ambiental × Tonelagem) - (Royalties × Receita)',
    description: 'Efeito líquido dos termos de parceria governamental'
  }
};

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export function CalculationReferencePanel({
  country,
  taxRate,
  discountRate,
  depreciationYears,
  dailyCapacity,
  operatingDays,
  utilizationRate,
  totalInvestment,
  annualRevenue,
  annualOpex,
  annualEbitda,
  roiPercentage,
  paybackMonths,
  irrPercentage,
  npv10Years,
  governmentRoyalties = 0,
  environmentalBonus = 0
}: CalculationReferencePanelProps) {
  const { t } = useTranslation();
  
  const benchmark = useMemo(() => {
    return REGIONAL_BENCHMARKS[country] || REGIONAL_BENCHMARKS['default'];
  }, [country]);

  const annualTonnage = dailyCapacity * operatingDays * (utilizationRate / 100);
  const opexPerTon = annualTonnage > 0 ? annualOpex / annualTonnage : 0;
  const capexPerTon = annualTonnage > 0 ? totalInvestment / annualTonnage : 0;

  // Calculate how values compare to benchmarks
  const getComparisonStatus = (value: number, min: number, max: number): 'good' | 'warning' | 'alert' => {
    if (value >= min && value <= max) return 'good';
    if (value < min * 0.8 || value > max * 1.2) return 'alert';
    return 'warning';
  };

  const roiStatus = getComparisonStatus(roiPercentage, benchmark.typicalRoi.min, benchmark.typicalRoi.max);
  const paybackStatus = getComparisonStatus(paybackMonths, benchmark.typicalPayback.min, benchmark.typicalPayback.max);
  const capexStatus = getComparisonStatus(totalInvestment, benchmark.capexRange.min, benchmark.capexRange.max);
  const opexStatus = getComparisonStatus(opexPerTon, benchmark.opexPerTon.min, benchmark.opexPerTon.max);

  const statusColors = {
    good: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    warning: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    alert: 'text-red-600 bg-red-100 dark:bg-red-900/30'
  };

  return (
    <Card className="border-blue-500/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Calculator className="h-4 w-4" />
          {t('admin.feasibility.calcReference.title', 'Base de Cálculos & Benchmarks')}
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
            📐 {t('admin.feasibility.calcReference.reference', 'Referência')}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          {t('admin.feasibility.calcReference.description', 'Fórmulas utilizadas e comparação com benchmarks regionais')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="formulas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="formulas" className="text-xs">
              <Calculator className="h-3 w-3 mr-1" />
              {t('admin.feasibility.calcReference.formulas', 'Fórmulas')}
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              {t('admin.feasibility.calcReference.benchmarks', 'Benchmarks')}
            </TabsTrigger>
          </TabsList>

          {/* Formulas Tab */}
          <TabsContent value="formulas" className="mt-3">
            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-3">
                {Object.entries(FORMULAS).map(([key, formula]) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                          {key === 'roi' && <TrendingUp className="h-3 w-3" />}
                          {key === 'payback' && <Clock className="h-3 w-3" />}
                          {key === 'npv' && <DollarSign className="h-3 w-3" />}
                          {key === 'irr' && <Percent className="h-3 w-3" />}
                          {key === 'ebitda' && <TrendingUp className="h-3 w-3" />}
                          {key === 'electricity' && <Zap className="h-3 w-3" />}
                          {key === 'labor' && <Users className="h-3 w-3" />}
                          {formula.name}
                        </h5>
                        <code className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-1 block font-mono text-gray-700 dark:text-gray-300">
                          {formula.formula}
                        </code>
                        <p className="text-[10px] text-muted-foreground mt-1">{formula.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="mt-3">
            <ScrollArea className="h-[320px] pr-2">
              <div className="space-y-3">
                {/* Country Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-3 text-white">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-semibold text-sm">{country || 'Default'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {benchmark.incentives.map((inc, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] bg-white/20 text-white border-none">
                        {inc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* ROI Comparison */}
                  <div className={`rounded-lg p-2 border ${statusColors[roiStatus]}`}>
                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      <TrendingUp className="h-3 w-3" />
                      ROI
                    </div>
                    <div className="text-sm font-bold">{roiPercentage.toFixed(1)}%</div>
                    <div className="text-[9px] opacity-70">
                      Benchmark: {benchmark.typicalRoi.min}-{benchmark.typicalRoi.max}%
                    </div>
                  </div>

                  {/* Payback Comparison */}
                  <div className={`rounded-lg p-2 border ${statusColors[paybackStatus]}`}>
                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      <Clock className="h-3 w-3" />
                      Payback
                    </div>
                    <div className="text-sm font-bold">{paybackMonths} meses</div>
                    <div className="text-[9px] opacity-70">
                      Benchmark: {benchmark.typicalPayback.min}-{benchmark.typicalPayback.max}m
                    </div>
                  </div>

                  {/* CAPEX Comparison */}
                  <div className={`rounded-lg p-2 border ${statusColors[capexStatus]}`}>
                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      <Building className="h-3 w-3" />
                      CAPEX Total
                    </div>
                    <div className="text-sm font-bold">{formatCurrency(totalInvestment)}</div>
                    <div className="text-[9px] opacity-70">
                      Benchmark: {formatCurrency(benchmark.capexRange.min)}-{formatCurrency(benchmark.capexRange.max)}
                    </div>
                  </div>

                  {/* OPEX per Ton */}
                  <div className={`rounded-lg p-2 border ${statusColors[opexStatus]}`}>
                    <div className="flex items-center gap-1 text-[10px] font-medium">
                      <Wrench className="h-3 w-3" />
                      OPEX/Ton
                    </div>
                    <div className="text-sm font-bold">${opexPerTon.toFixed(0)}/t</div>
                    <div className="text-[9px] opacity-70">
                      Benchmark: ${benchmark.opexPerTon.min}-${benchmark.opexPerTon.max}/t
                    </div>
                  </div>
                </div>

                {/* Regional Parameters */}
                <div className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <h5 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    {t('admin.feasibility.calcReference.regionalParams', 'Parâmetros Regionais')}
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa Base:</span>
                      <span className="font-medium">{benchmark.baseTax}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Encargos Sociais:</span>
                      <span className="font-medium">{benchmark.socialCharges}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Energia:</span>
                      <span className="font-medium">${benchmark.electricityRate}/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Logística:</span>
                      <span className="font-medium">${benchmark.logisticsCostPerTon}/t</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manutenção:</span>
                      <span className="font-medium">{benchmark.maintenancePercent}% equip/ano</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mult. Labor:</span>
                      <span className="font-medium">{benchmark.laborMultiplier}x</span>
                    </div>
                  </div>
                </div>

                {/* Your Study Summary */}
                <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg p-3 border border-emerald-300 dark:border-emerald-700">
                  <h5 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
                    📊 {t('admin.feasibility.calcReference.yourStudy', 'Seu Estudo')}
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa Aplicada:</span>
                      <span className="font-medium">{taxRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa Desconto:</span>
                      <span className="font-medium">{discountRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Depreciação:</span>
                      <span className="font-medium">{depreciationYears} anos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tonelagem/ano:</span>
                      <span className="font-medium">{annualTonnage.toFixed(0)} t</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">NPV 10 anos:</span>
                      <span className={`font-medium ${npv10Years >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(npv10Years)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TIR:</span>
                      <span className={`font-medium ${irrPercentage >= discountRate ? 'text-green-600' : 'text-orange-600'}`}>
                        {irrPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {(governmentRoyalties > 0 || environmentalBonus > 0) && (
                    <div className="mt-2 pt-2 border-t border-emerald-300 dark:border-emerald-700">
                      <div className="text-[10px] text-muted-foreground">Termos Parceria:</div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px]">Royalties: {governmentRoyalties}%</Badge>
                        <Badge variant="outline" className="text-[9px]">Bônus: ${environmentalBonus}/t</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Export benchmarks for PDF use
export { REGIONAL_BENCHMARKS, FORMULAS };
