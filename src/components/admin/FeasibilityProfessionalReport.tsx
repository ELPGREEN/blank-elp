// Professional Feasibility Report Component
import { useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Factory,
  DollarSign,
  BarChart3,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FeasibilityStudy {
  study_name: string;
  location?: string | null;
  country?: string | null;
  daily_capacity_tons: number;
  operating_days_per_year: number;
  utilization_rate: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  rubber_granules_price: number;
  rubber_granules_yield: number;
  steel_wire_price: number;
  steel_wire_yield: number;
  textile_fiber_price: number;
  textile_fiber_yield: number;
  rcb_price?: number; // Recovered Carbon Black - Jan 2026 market: $800-1200/ton
  rcb_yield?: number; // rCB yield percentage - typically 10-15%
  tax_rate: number;
  discount_rate?: number;
  equipment_cost?: number;
  installation_cost?: number;
  infrastructure_cost?: number;
  working_capital?: number;
  labor_cost?: number;
  energy_cost?: number;
  maintenance_cost?: number;
  logistics_cost?: number;
  administrative_cost?: number;
  other_opex?: number;
  depreciation_years?: number;
}

interface ProfessionalReportProps {
  study: FeasibilityStudy;
  aiAnalysis?: string | null;
}

export function FeasibilityProfessionalReport({ study, aiAnalysis }: ProfessionalReportProps) {
  const { t } = useTranslation();

  // Calculate production metrics based on ELP study methodology
  const calculations = useMemo(() => {
    const hoursPerDay = 16; // Based on ELP study
    const kgPerHour = (study.daily_capacity_tons * 1000) / hoursPerDay;
    const daysPerMonth = 22; // Standard working days
    const hoursPerMonth = hoursPerDay * daysPerMonth;
    
    // Utilization scenarios
    const utilizationProbable = 0.70;
    const utilizationPessimistic = 0.50;
    const utilizationOptimistic = 1.00;
    
    // Raw material composition (based on ELP study + rCB)
    const rubberYield = study.rubber_granules_yield / 100;
    const steelYield = study.steel_wire_yield / 100;
    const textileYield = study.textile_fiber_yield / 100;
    const rcbYield = (study.rcb_yield || 12) / 100; // rCB yield - typically 10-15%
    
    // Production per hour by material
    const rubberKgPerHour = kgPerHour * rubberYield;
    const steelKgPerHour = kgPerHour * steelYield;
    const textileKgPerHour = kgPerHour * textileYield;
    const rcbKgPerHour = kgPerHour * rcbYield;
    
    // Monthly production (22 days, 16 hours/day at different utilization rates)
    const createScenario = (utilization: number, name: string) => {
      const effectiveHours = hoursPerMonth * utilization;
      const rubberMonthly = rubberKgPerHour * effectiveHours;
      const steelMonthly = steelKgPerHour * effectiveHours;
      const textileMonthly = textileKgPerHour * effectiveHours;
      const rcbMonthly = rcbKgPerHour * effectiveHours;
      
      // Revenue calculation (prices are per TON, so convert kg to tons)
      const rubberRevenue = (rubberMonthly / 1000) * study.rubber_granules_price;
      const steelRevenue = (steelMonthly / 1000) * study.steel_wire_price;
      const textileRevenue = (textileMonthly / 1000) * study.textile_fiber_price;
      const rcbRevenue = (rcbMonthly / 1000) * (study.rcb_price || 1050); // rCB: $900-1200/ton, avg $1050 (Jan 2026)
      const totalRevenue = rubberRevenue + steelRevenue + textileRevenue + rcbRevenue;
      
      // Monthly OPEX
      const monthlyOpex = (
        (study.labor_cost || 0) +
        (study.energy_cost || 0) +
        (study.maintenance_cost || 0) +
        (study.logistics_cost || 0) +
        (study.administrative_cost || 0) +
        (study.other_opex || 0)
      );
      
      // Fixed costs (including financing if any)
      // Note: 0.008 monthly = 0.8% per month = 9.6% annual financing cost
      const financing = study.total_investment * 0.008;
      const depreciation = study.total_investment / ((study.depreciation_years || 10) * 12);
      const totalFixedCosts = monthlyOpex + financing + depreciation;
      
      // Contribution margin
      const variableCosts = totalRevenue * 0.02; // ~2% variable costs
      const contributionMargin = totalRevenue - variableCosts;
      const contributionMarginPercent = (contributionMargin / totalRevenue) * 100;
      
      // Operating income
      const operatingIncome = contributionMargin - totalFixedCosts;
      const operatingIncomePercent = (operatingIncome / totalRevenue) * 100;
      
      // Annual projections
      const annualRevenue = totalRevenue * 12;
      const annualProfit = operatingIncome * 12;
      
      // Multi-year projections
      const years = [2, 3, 4, 5].map(year => ({
        year,
        totalBilling: annualProfit * year,
        recycledMaterial: (rubberMonthly + steelMonthly + textileMonthly) * 12 * year
      }));
      
      return {
        name,
        utilization: utilization * 100,
        rubberMonthly,
        steelMonthly,
        textileMonthly,
        totalMonthly: rubberMonthly + steelMonthly + textileMonthly,
        rubberRevenue,
        steelRevenue,
        textileRevenue,
        totalRevenue,
        contributionMargin,
        contributionMarginPercent,
        totalFixedCosts,
        operatingIncome,
        operatingIncomePercent,
        annualRevenue,
        annualProfit,
        years
      };
    };
    
    const scenarios = {
      probable: createScenario(utilizationProbable, t('admin.feasibility.report.probable')),
      pessimistic: createScenario(utilizationPessimistic, t('admin.feasibility.report.pessimistic')),
      optimistic: createScenario(utilizationOptimistic, t('admin.feasibility.report.optimistic'))
    };
    
    // Investment breakdown
    const investmentBreakdown = [
      { name: t('admin.feasibility.equipmentCost'), value: study.equipment_cost || 0 },
      { name: t('admin.feasibility.infrastructureCost'), value: study.infrastructure_cost || 0 },
      { name: t('admin.feasibility.installationCost'), value: study.installation_cost || 0 },
      { name: t('admin.feasibility.workingCapital'), value: study.working_capital || 0 },
    ].filter(item => item.value > 0);
    
    const totalInvestment = investmentBreakdown.reduce((sum, item) => sum + item.value, 0);
    
    // Calculate percentages
    const investmentWithPercentages = investmentBreakdown.map(item => ({
      ...item,
      percentage: totalInvestment > 0 ? (item.value / totalInvestment) * 100 : 0
    }));
    
    return {
      hoursPerDay,
      daysPerMonth,
      kgPerHour,
      rubberKgPerHour,
      steelKgPerHour,
      textileKgPerHour,
      rcbKgPerHour,
      scenarios,
      investmentBreakdown: investmentWithPercentages,
      totalInvestment
    };
  }, [study, t]);

  const formatCurrency = (value: number, decimals = 2) => {
    if (Math.abs(value) >= 1000000) {
      return `USD ${(value / 1000000).toFixed(decimals)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `USD ${(value / 1000).toFixed(decimals)}K`;
    }
    return `USD ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  };

  const getViabilityRating = () => {
    if (study.roi_percentage >= 30 && study.payback_months <= 36) return { rating: 'excellent', color: 'bg-green-500' };
    if (study.roi_percentage >= 20 && study.payback_months <= 48) return { rating: 'good', color: 'bg-primary' };
    if (study.roi_percentage >= 10 && study.payback_months <= 72) return { rating: 'moderate', color: 'bg-amber-500' };
    return { rating: 'risky', color: 'bg-red-500' };
  };

  const viability = getViabilityRating();

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{study.study_name}</h2>
              <p className="text-slate-300">
                {study.location && `${study.location}, ${study.country}`}
              </p>
            </div>
            <Badge className={`${viability.color} text-white text-lg px-4 py-2`}>
              {t(`admin.feasibility.ai.${viability.rating}`)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Raw Material Composition Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Factory className="h-5 w-5 text-primary" />
            {t('admin.feasibility.report.rawMaterialComposition')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">{t('admin.feasibility.report.material')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.percentage')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.kgPerHour')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.pricePerTon')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3 font-medium">{t('admin.feasibility.rubberGranules')}</td>
                  <td className="p-3 text-right font-bold text-green-600">{study.rubber_granules_yield.toFixed(1)}%</td>
                  <td className="p-3 text-right">{formatNumber(calculations.rubberKgPerHour)} kg</td>
                  <td className="p-3 text-right">${study.rubber_granules_price}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">{t('admin.feasibility.steelWire')}</td>
                  <td className="p-3 text-right font-bold text-blue-600">{study.steel_wire_yield.toFixed(1)}%</td>
                  <td className="p-3 text-right">{formatNumber(calculations.steelKgPerHour)} kg</td>
                  <td className="p-3 text-right">${study.steel_wire_price}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">{t('admin.feasibility.textileFiber')}</td>
                  <td className="p-3 text-right font-bold text-amber-600">{study.textile_fiber_yield.toFixed(1)}%</td>
                  <td className="p-3 text-right">{formatNumber(calculations.textileKgPerHour)} kg</td>
                  <td className="p-3 text-right">${study.textile_fiber_price}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">{t('admin.feasibility.rcb', 'rCB (Carbon Black)')}</td>
                  <td className="p-3 text-right font-bold text-purple-600">{(study.rcb_yield || 12).toFixed(1)}%</td>
                  <td className="p-3 text-right">{formatNumber(calculations.rcbKgPerHour)} kg</td>
                  <td className="p-3 text-right">${study.rcb_price || 1050}</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="p-3 font-bold">{t('admin.feasibility.report.totalRecoverable', 'Total Recoverable')}</td>
                  <td className="p-3 text-right font-bold">{(study.rubber_granules_yield + study.steel_wire_yield + study.textile_fiber_yield + (study.rcb_yield || 12)).toFixed(1)}%</td>
                  <td className="p-3 text-right font-bold">{formatNumber(calculations.kgPerHour * ((study.rubber_granules_yield + study.steel_wire_yield + study.textile_fiber_yield + (study.rcb_yield || 12)) / 100))} kg</td>
                  <td className="p-3 text-right text-muted-foreground text-xs">{t('admin.feasibility.report.processLoss', '(~12% process loss)')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Investment Breakdown Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('admin.feasibility.report.investmentBreakdown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">{t('admin.feasibility.report.description')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.value')}</th>
                  <th className="text-right p-3 font-semibold">%</th>
                  <th className="p-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {calculations.investmentBreakdown.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-right">{formatCurrency(item.value)}</td>
                    <td className="p-3 text-right">{item.percentage.toFixed(1)}%</td>
                    <td className="p-3">
                      <Progress value={item.percentage} className="h-2" />
                    </td>
                  </tr>
                ))}
                <tr className="bg-primary/10">
                  <td className="p-3 font-bold">{t('admin.feasibility.report.totalInvestment')}</td>
                  <td className="p-3 text-right font-bold text-primary">{formatCurrency(calculations.totalInvestment)}</td>
                  <td className="p-3 text-right font-bold">100%</td>
                  <td className="p-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Sales Estimates - 3 Scenarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('admin.feasibility.report.monthlySalesEstimates')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(calculations.scenarios).map(([key, scenario]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                key === 'optimistic' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
                key === 'pessimistic' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
                'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  {key === 'optimistic' ? <TrendingUp className="h-4 w-4 text-green-600" /> :
                   key === 'pessimistic' ? <TrendingDown className="h-4 w-4 text-red-600" /> :
                   <Target className="h-4 w-4 text-blue-600" />}
                  {scenario.name}
                </h4>
                <Badge variant="outline">{scenario.utilization.toFixed(0)}% {t('admin.feasibility.report.capacity')}</Badge>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t('admin.feasibility.report.product')}</th>
                      <th className="text-right p-2">{t('admin.feasibility.report.monthlyQty')}</th>
                      <th className="text-right p-2">{t('admin.feasibility.report.monthlyRevenue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">{t('admin.feasibility.rubberGranules')}</td>
                      <td className="p-2 text-right">{formatNumber(scenario.rubberMonthly)} kg</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(scenario.rubberRevenue)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{t('admin.feasibility.steelWire')}</td>
                      <td className="p-2 text-right">{formatNumber(scenario.steelMonthly)} kg</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(scenario.steelRevenue)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">{t('admin.feasibility.textileFiber')}</td>
                      <td className="p-2 text-right">{formatNumber(scenario.textileMonthly)} kg</td>
                      <td className="p-2 text-right font-medium">{formatCurrency(scenario.textileRevenue)}</td>
                    </tr>
                    <tr className="font-bold bg-muted/30">
                      <td className="p-2">{t('admin.feasibility.report.total')}</td>
                      <td className="p-2 text-right">{formatNumber(scenario.totalMonthly)} kg</td>
                      <td className="p-2 text-right text-primary">{formatCurrency(scenario.totalRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="p-2 bg-background rounded">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.report.contributionMargin')}</span>
                  <span className="font-bold text-green-600">{scenario.contributionMarginPercent.toFixed(1)}%</span>
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.report.fixedCosts')}</span>
                  <span className="font-bold">{formatCurrency(scenario.totalFixedCosts)}</span>
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-xs text-muted-foreground block">{t('admin.feasibility.report.operatingIncome')}</span>
                  <span className={`font-bold ${scenario.operatingIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scenario.operatingIncomePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Payback Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            {t('admin.feasibility.report.paybackAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(calculations.scenarios).map(([key, scenario]) => (
              <div 
                key={key}
                className={`p-4 rounded-lg border ${
                  key === 'optimistic' ? 'border-green-200' :
                  key === 'pessimistic' ? 'border-red-200' :
                  'border-blue-200'
                }`}
              >
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  {scenario.name}
                  <Badge variant="outline" className="text-xs">{scenario.utilization.toFixed(0)}%</Badge>
                </h5>
                <div className="space-y-2">
                  {scenario.years.map(year => (
                    <div key={year.year} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{year.year} {t('admin.feasibility.report.years')}</span>
                      <div className="text-right">
                        <span className="font-medium">{formatCurrency(year.totalBilling)}</span>
                        <span className="text-xs text-muted-foreground block">
                          {formatNumber(year.recycledMaterial / 1000)} t
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Payback Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-sm text-muted-foreground block">{t('admin.feasibility.payback')}</span>
                <span className="text-2xl font-bold text-primary">{study.payback_months}</span>
                <span className="text-sm text-muted-foreground"> {t('admin.feasibility.months')}</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">{t('admin.feasibility.roi')}</span>
                <span className={`text-2xl font-bold ${study.roi_percentage >= 20 ? 'text-green-600' : 'text-amber-600'}`}>
                  {study.roi_percentage.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">{t('admin.feasibility.irr')}</span>
                <span className={`text-2xl font-bold ${study.irr_percentage >= 15 ? 'text-green-600' : 'text-amber-600'}`}>
                  {study.irr_percentage.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">{t('admin.feasibility.npv10Years')}</span>
                <span className={`text-2xl font-bold ${study.npv_10_years >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(study.npv_10_years)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Viability Indicators Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-primary" />
            {t('admin.feasibility.report.viabilityIndicators')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">{t('admin.feasibility.report.description')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.probable')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.pessimistic')}</th>
                  <th className="text-right p-3 font-semibold">{t('admin.feasibility.report.optimistic')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">{t('admin.feasibility.report.totalSalesRevenue')}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(calculations.scenarios.probable.totalRevenue * 12)}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(calculations.scenarios.pessimistic.totalRevenue * 12)}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(calculations.scenarios.optimistic.totalRevenue * 12)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">{t('admin.feasibility.report.contributionMargin')}</td>
                  <td className="p-3 text-right">{calculations.scenarios.probable.contributionMarginPercent.toFixed(1)}%</td>
                  <td className="p-3 text-right">{calculations.scenarios.pessimistic.contributionMarginPercent.toFixed(1)}%</td>
                  <td className="p-3 text-right">{calculations.scenarios.optimistic.contributionMarginPercent.toFixed(1)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">{t('admin.feasibility.report.fixedCostsPercent')}</td>
                  <td className="p-3 text-right">{((calculations.scenarios.probable.totalFixedCosts / calculations.scenarios.probable.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="p-3 text-right">{((calculations.scenarios.pessimistic.totalFixedCosts / calculations.scenarios.pessimistic.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="p-3 text-right">{((calculations.scenarios.optimistic.totalFixedCosts / calculations.scenarios.optimistic.totalRevenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="bg-green-50 dark:bg-green-950/20">
                  <td className="p-3 font-bold">{t('admin.feasibility.report.operatingIncome')}</td>
                  <td className="p-3 text-right font-bold text-green-600">{calculations.scenarios.probable.operatingIncomePercent.toFixed(1)}%</td>
                  <td className="p-3 text-right font-bold text-green-600">{calculations.scenarios.pessimistic.operatingIncomePercent.toFixed(1)}%</td>
                  <td className="p-3 text-right font-bold text-green-600">{calculations.scenarios.optimistic.operatingIncomePercent.toFixed(1)}%</td>
                </tr>
                <tr className="bg-primary/10">
                  <td className="p-3 font-bold">{t('admin.feasibility.report.annualProfit')}</td>
                  <td className="p-3 text-right font-bold text-primary">{formatCurrency(calculations.scenarios.probable.annualProfit)}</td>
                  <td className="p-3 text-right font-bold text-primary">{formatCurrency(calculations.scenarios.pessimistic.annualProfit)}</td>
                  <td className="p-3 text-right font-bold text-primary">{formatCurrency(calculations.scenarios.optimistic.annualProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Risk Assessment */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h5 className="font-semibold flex items-center gap-2 mb-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                {t('admin.feasibility.report.strengths')}
              </h5>
              <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                {study.roi_percentage >= 20 && <li>• {t('admin.feasibility.report.highRoi')}</li>}
                {study.payback_months <= 48 && <li>• {t('admin.feasibility.report.quickPayback')}</li>}
                {study.npv_10_years > 0 && <li>• {t('admin.feasibility.report.positiveNpv')}</li>}
                {study.irr_percentage > (study.discount_rate || 12) && <li>• {t('admin.feasibility.report.irrAboveDiscount')}</li>}
              </ul>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h5 className="font-semibold flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {t('admin.feasibility.report.risks')}
              </h5>
              <ul className="text-sm space-y-1 text-amber-600 dark:text-amber-400">
                {study.roi_percentage < 15 && <li>• {t('admin.feasibility.report.lowRoi')}</li>}
                {study.payback_months > 60 && <li>• {t('admin.feasibility.report.longPayback')}</li>}
                {study.npv_10_years < 0 && <li>• {t('admin.feasibility.report.negativeNpv')}</li>}
                <li>• {t('admin.feasibility.report.marketVolatility')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              {t('admin.feasibility.ai.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {aiAnalysis.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <h4 key={i} className="font-semibold text-primary mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                  }
                  if (line.startsWith('- ') || line.startsWith('• ')) {
                    return <p key={i} className="ml-4 my-0.5">{line}</p>;
                  }
                  if (/^\d+\./.test(line)) {
                    return <p key={i} className="font-medium mt-2">{line}</p>;
                  }
                  return line.trim() ? <p key={i} className="my-1">{line}</p> : <br key={i} />;
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
