import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  LineChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  AreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';

interface FeasibilityStudy {
  id: string;
  study_name: string;
  location: string | null;
  country: string | null;
  daily_capacity_tons: number;
  operating_days_per_year: number;
  utilization_rate: number;
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
  rcb_price: number; // Recovered Carbon Black - Jan 2026 market: $800-1200/ton
  rcb_yield: number; // rCB yield percentage - typically 10-15%
  tax_rate: number;
  depreciation_years: number;
  discount_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
}

interface FeasibilityChartsProps {
  study: Partial<FeasibilityStudy>;
  studies?: Partial<FeasibilityStudy>[];
  onSensitivityChange?: (field: string, variation: number) => void;
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function FeasibilityCharts({ study: initialStudy, studies = [], onSensitivityChange }: FeasibilityChartsProps) {
  const { t } = useTranslation();
  const [selectedStudyId, setSelectedStudyId] = useState<string>(initialStudy.id || '');
  
  // Get the currently selected study from the list or fall back to initial
  const study = useMemo(() => {
    if (selectedStudyId && studies.length > 0) {
      const found = studies.find(s => s.id === selectedStudyId);
      if (found) return found;
    }
    return initialStudy;
  }, [selectedStudyId, studies, initialStudy]);

  // Calculate base financials
  const baseCalculations = useMemo(() => {
    const dailyCapacity = study.daily_capacity_tons || 85;
    const operatingDays = study.operating_days_per_year || 300;
    const utilization = (study.utilization_rate || 85) / 100;
    const annualTonnage = dailyCapacity * operatingDays * utilization;

    const totalInvestment = 
      (study.equipment_cost || 0) +
      (study.installation_cost || 0) +
      (study.infrastructure_cost || 0) +
      (study.working_capital || 0) +
      (study.other_capex || 0);

      // Revenue calculation - JANUARY 2026 MARKET PRICES (VALIDATED from multiple sources)
      // Sources: Recycler's World Jan 2026, American Recycler, commodity exchanges
      // CRITICAL: Steel price for RECOVERED tire wire is $150-350/ton, NOT virgin steel $620+
      // Prices: Granules $250/t, Steel $250/t (recovered), Textile $120/t, rCB $1,050/t
      const revenueGranules = annualTonnage * ((study.rubber_granules_yield || 43) / 100) * (study.rubber_granules_price || 250);
      const revenueSteel = annualTonnage * ((study.steel_wire_yield || 25) / 100) * (study.steel_wire_price || 250);
      const revenueFiber = annualTonnage * ((study.textile_fiber_yield || 8) / 100) * (study.textile_fiber_price || 120);
      const revenueRCB = annualTonnage * ((study.rcb_yield || 12) / 100) * (study.rcb_price || 1050);
      const annualRevenue = revenueGranules + revenueSteel + revenueFiber + revenueRCB;

    const monthlyOpex = 
      (study.raw_material_cost || 0) +
      (study.labor_cost || 0) +
      (study.energy_cost || 0) +
      (study.maintenance_cost || 0) +
      (study.logistics_cost || 0) +
      (study.administrative_cost || 0) +
      (study.other_opex || 0);
    const annualOpex = monthlyOpex * 12;

    const annualEbitda = annualRevenue - annualOpex;
    const annualDepreciation = totalInvestment / (study.depreciation_years || 10);
    const taxableIncome = annualEbitda - annualDepreciation;
    const taxes = Math.max(0, taxableIncome * ((study.tax_rate || 25) / 100));
    const netProfit = annualEbitda - taxes;

    return {
      annualTonnage,
      totalInvestment,
      annualRevenue,
      annualOpex,
      annualEbitda,
      netProfit,
      revenueGranules,
      revenueSteel,
      revenueFiber,
      revenueRCB
    };
  }, [study]);

  // 10-year cash flow projection with inflation adjustment
  const cashFlowData = useMemo(() => {
    const { totalInvestment, netProfit, annualRevenue, annualOpex, annualEbitda } = baseCalculations;
    const inflationRate = (study.depreciation_years ? 0.03 : 0.03); // 3% default inflation
    const revenueGrowth = 0.02; // 2% annual revenue growth (market expansion)
    const taxRate = (study.tax_rate || 25) / 100;
    const depreciationYears = study.depreciation_years || 10;
    const annualDepreciation = totalInvestment / depreciationYears;
    
    const data = [];
    let cumulativeCashFlow = -totalInvestment;

    for (let year = 0; year <= 10; year++) {
      if (year === 0) {
        data.push({
          year: `Y${year}`,
          yearLabel: t('admin.feasibility.charts.year') + ' ' + year,
          cashFlow: -totalInvestment,
          cumulativeCashFlow: cumulativeCashFlow,
          netProfit: 0
        });
      } else {
        // Revenue grows with market, OPEX grows with inflation
        const yearRevenue = annualRevenue * Math.pow(1 + revenueGrowth, year);
        const yearOpex = annualOpex * Math.pow(1 + inflationRate, year);
        const yearEbitda = yearRevenue - yearOpex;
        
        // Depreciation only applies during depreciation period
        const yearDepreciation = year <= depreciationYears ? annualDepreciation : 0;
        const taxableIncome = yearEbitda - yearDepreciation;
        const yearTaxes = Math.max(0, taxableIncome * taxRate);
        const yearNetProfit = yearEbitda - yearTaxes;
        
        cumulativeCashFlow += yearNetProfit;
        data.push({
          year: `Y${year}`,
          yearLabel: t('admin.feasibility.charts.year') + ' ' + year,
          cashFlow: yearNetProfit,
          cumulativeCashFlow: cumulativeCashFlow,
          netProfit: yearNetProfit
        });
      }
    }
    return data;
  }, [baseCalculations, study.tax_rate, study.depreciation_years, t]);

  // Revenue breakdown - including rCB
  const revenueBreakdownData = useMemo(() => {
    const { revenueGranules, revenueSteel, revenueFiber, revenueRCB } = baseCalculations;
    const total = revenueGranules + revenueSteel + revenueFiber + revenueRCB;
    return [
      { name: t('admin.feasibility.rubberGranules'), value: revenueGranules, percent: ((revenueGranules / total) * 100).toFixed(1) },
      { name: t('admin.feasibility.steelWire'), value: revenueSteel, percent: ((revenueSteel / total) * 100).toFixed(1) },
      { name: t('admin.feasibility.textileFiber'), value: revenueFiber, percent: ((revenueFiber / total) * 100).toFixed(1) },
      { name: t('admin.feasibility.rcb', 'rCB (Carbon Black)'), value: revenueRCB, percent: ((revenueRCB / total) * 100).toFixed(1) }
    ];
  }, [baseCalculations, t]);

  // OPEX breakdown
  const opexBreakdownData = useMemo(() => {
    return [
      { name: t('admin.feasibility.rawMaterialCost'), value: (study.raw_material_cost || 0) * 12 },
      { name: t('admin.feasibility.laborCost'), value: (study.labor_cost || 0) * 12 },
      { name: t('admin.feasibility.energyCost'), value: (study.energy_cost || 0) * 12 },
      { name: t('admin.feasibility.maintenanceCost'), value: (study.maintenance_cost || 0) * 12 },
      { name: t('admin.feasibility.logisticsCost'), value: (study.logistics_cost || 0) * 12 },
      { name: t('admin.feasibility.administrativeCost'), value: (study.administrative_cost || 0) * 12 },
      { name: t('admin.feasibility.otherOpex'), value: (study.other_opex || 0) * 12 }
    ].filter(item => item.value > 0);
  }, [study, t]);

  // ENGINEERING FIX: Real sensitivity analysis with actual recalculation
  // Instead of linear approximation, we recalculate ROI for each scenario
  const sensitivityData = useMemo(() => {
    const variations = [-20, -10, 0, 10, 20];
    const { totalInvestment, annualTonnage, annualOpex } = baseCalculations;
    const taxRate = (study.tax_rate || 25) / 100;
    const depreciationYears = study.depreciation_years || 10;
    const annualDepreciation = totalInvestment / depreciationYears;
    
    // Base yields and prices
    const rubberYield = (study.rubber_granules_yield || 43) / 100;
    const rubberPrice = study.rubber_granules_price || 250;
    const steelYield = (study.steel_wire_yield || 25) / 100;
    const steelPrice = study.steel_wire_price || 250;
    const fiberYield = (study.textile_fiber_yield || 8) / 100;
    const fiberPrice = study.textile_fiber_price || 120;
    const rcbYield = (study.rcb_yield || 12) / 100;
    const rcbPrice = study.rcb_price || 1050;
    
    // Calculate ROI for a given scenario
    const calculateScenarioROI = (priceMultiplier: number, capacityMultiplier: number, opexMultiplier: number) => {
      const adjustedTonnage = annualTonnage * capacityMultiplier;
      const adjustedPriceMultiplier = priceMultiplier;
      
      // Recalculate revenue with adjusted prices
      const revenue = adjustedTonnage * (
        rubberYield * rubberPrice * adjustedPriceMultiplier +
        steelYield * steelPrice * adjustedPriceMultiplier +
        fiberYield * fiberPrice * adjustedPriceMultiplier +
        rcbYield * rcbPrice * adjustedPriceMultiplier
      );
      
      // Recalculate OPEX (scales partially with capacity)
      const fixedOpexRatio = 0.4; // 40% of OPEX is fixed
      const variableOpex = annualOpex * (1 - fixedOpexRatio) * capacityMultiplier * opexMultiplier;
      const fixedOpex = annualOpex * fixedOpexRatio * opexMultiplier;
      const adjustedOpex = variableOpex + fixedOpex;
      
      const ebitda = revenue - adjustedOpex;
      const taxableIncome = ebitda - annualDepreciation;
      const taxes = Math.max(0, taxableIncome * taxRate);
      const netProfit = ebitda - taxes;
      
      return totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    };
    
    return variations.map(variation => {
      const multiplier = 1 + variation / 100;
      
      return {
        variation: `${variation > 0 ? '+' : ''}${variation}%`,
        variationNum: variation,
        // Price change: only prices vary
        priceChange: calculateScenarioROI(multiplier, 1, 1),
        // Capacity change: tonnage varies, variable OPEX scales proportionally
        capacityChange: calculateScenarioROI(1, multiplier, 1),
        // OPEX change: costs vary inversely (lower OPEX = higher ROI)
        opexChange: calculateScenarioROI(1, 1, 2 - multiplier) // Invert: +20% variation means 0.8x OPEX
      };
    });
  }, [baseCalculations, study]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Study Selector */}
      {studies.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('admin.feasibility.charts.selectStudy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudyId} onValueChange={setSelectedStudyId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder={t('admin.feasibility.charts.selectStudyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {studies.map((s) => (
                  <SelectItem key={s.id} value={s.id || ''}>
                    {s.study_name} {s.country ? `(${s.country})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="cashflow" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="cashflow" className="text-xs">
            <LineChart className="h-3 w-3 mr-1" />
            {t('admin.feasibility.charts.cashFlow')}
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs">
            <PieChart className="h-3 w-3 mr-1" />
            {t('admin.feasibility.charts.breakdown')}
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            {t('admin.feasibility.charts.sensitivity')}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs">
            <BarChart3 className="h-3 w-3 mr-1" />
            {t('admin.feasibility.charts.metrics')}
          </TabsTrigger>
        </TabsList>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                {t('admin.feasibility.charts.cashFlowTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeCashFlow" 
                      name={t('admin.feasibility.charts.cumulativeCashFlow')}
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorCumulative)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="netProfit" 
                      name={t('admin.feasibility.charts.annualProfit')}
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorProfit)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.charts.breakeven')}</span>
                  <span className="font-bold text-lg">
                    {cashFlowData.findIndex(d => d.cumulativeCashFlow >= 0) > 0 
                      ? `${t('admin.feasibility.charts.year')} ${cashFlowData.findIndex(d => d.cumulativeCashFlow >= 0)}`
                      : '> 10 ' + t('admin.feasibility.charts.years')
                    }
                  </span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.charts.totalReturn')}</span>
                  <span className={`font-bold text-lg ${cashFlowData[10]?.cumulativeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlowData[10]?.cumulativeCashFlow || 0)}
                  </span>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.charts.avgAnnualReturn')}</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(baseCalculations.netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('admin.feasibility.charts.revenueBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={revenueBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${percent}%`}
                        labelLine={false}
                      >
                        {revenueBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {revenueBreakdownData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* OPEX Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('admin.feasibility.charts.opexBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={opexBreakdownData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                      <YAxis type="category" dataKey="name" width={80} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg mt-4">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.charts.totalAnnualOpex')}</span>
                  <span className="font-bold text-lg">{formatCurrency(baseCalculations.annualOpex)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sensitivity Tab */}
        <TabsContent value="sensitivity" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('admin.feasibility.charts.sensitivityTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={sensitivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="variation" className="text-xs" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} className="text-xs" />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="priceChange" 
                      name={t('admin.feasibility.charts.priceVariation')}
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="capacityChange" 
                      name={t('admin.feasibility.charts.capacityVariation')}
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="opexChange" 
                      name={t('admin.feasibility.charts.opexVariation')}
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{t('admin.feasibility.charts.priceImpact')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.feasibility.charts.priceImpactDesc')}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{t('admin.feasibility.charts.capacityImpact')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.feasibility.charts.capacityImpactDesc')}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">{t('admin.feasibility.charts.opexImpact')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.feasibility.charts.opexImpactDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t('admin.feasibility.roi')}</span>
                {(study.roi_percentage || 0) > 20 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <span className="text-2xl font-bold text-primary">{(study.roi_percentage || 0).toFixed(1)}%</span>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.feasibility.charts.roiDesc')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t('admin.feasibility.irr')}</span>
                {(study.irr_percentage || 0) > (study.discount_rate || 12) ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <span className="text-2xl font-bold text-green-600">{(study.irr_percentage || 0).toFixed(1)}%</span>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.feasibility.charts.irrDesc')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t('admin.feasibility.payback')}</span>
              </div>
              <span className="text-2xl font-bold text-amber-600">
                {(study.payback_months || 0) > 120 ? '> 10y' : `${study.payback_months}m`}
              </span>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.feasibility.charts.paybackDesc')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${(study.npv_10_years || 0) >= 0 ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20' : 'from-red-500/10 to-red-500/5 border-red-500/20'} border`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{t('admin.feasibility.npv10Years')}</span>
                {(study.npv_10_years || 0) >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
              <span className={`text-2xl font-bold ${(study.npv_10_years || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(study.npv_10_years || 0)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">{t('admin.feasibility.charts.npvDesc')}</p>
            </motion.div>
          </div>

          {/* EBITDA Margin */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">{t('admin.feasibility.charts.ebitdaMargin')}</h4>
                  <p className="text-sm text-muted-foreground">{t('admin.feasibility.charts.ebitdaMarginDesc')}</p>
                </div>
                <span className="text-3xl font-bold text-primary">
                  {baseCalculations.annualRevenue > 0 
                    ? ((baseCalculations.annualEbitda / baseCalculations.annualRevenue) * 100).toFixed(1)
                    : 0
                  }%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-primary to-emerald-500 h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, Math.max(0, baseCalculations.annualRevenue > 0 
                      ? (baseCalculations.annualEbitda / baseCalculations.annualRevenue) * 100 
                      : 0
                    ))}%` 
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
