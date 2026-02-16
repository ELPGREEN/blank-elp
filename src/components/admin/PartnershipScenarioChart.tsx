// Partnership Scenario Comparison Chart Component
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Scale, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, ReferenceLine, Cell, LineChart, Line, ComposedChart, Area } from 'recharts';

interface PartnershipScenarioChartProps {
  baseRevenue: number;
  baseRoi: number;
  basePayback: number;
  annualTonnage: number;
  totalInvestment: number;
  currentRoyalty: number;
  currentEnvBonus: number;
  countryName?: string;
  // New props for accurate country-specific calculations
  baseEbitda?: number;      // Actual EBITDA from calculations
  taxRate?: number;         // Country-specific tax rate (%)
  depreciationYears?: number; // For tax calculation
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export function PartnershipScenarioChart({
  baseRevenue,
  baseRoi,
  basePayback,
  annualTonnage,
  totalInvestment,
  currentRoyalty,
  currentEnvBonus,
  countryName,
  baseEbitda,
  taxRate = 25,
  depreciationYears = 10
}: PartnershipScenarioChartProps) {
  const { t } = useTranslation();
  
  // Use actual EBITDA if provided, otherwise estimate from revenue with realistic margin
  // IMPORTANT: Real tire recycling EBITDA margins are typically 20-35% depending on scale
  const actualEbitda = baseEbitda || baseRevenue * 0.28; // 28% default margin if not provided
  const actualEbitdaMargin = baseRevenue > 0 ? actualEbitda / baseRevenue : 0.28;

  // Generate scenario data varying royalty and environmental bonus
  // CRITICAL: Uses country-specific tax rates and actual EBITDA margins
  const scenarioData = useMemo(() => {
    const scenarios: Array<{
      name: string;
      royalty: number;
      envBonus: number;
      netImpact: number;
      adjustedRoi: number;
      adjustedPayback: number;
      isCurrent: boolean;
    }> = [];

    // Define scenario combinations
    const royaltyLevels = [0, 3, 5, 8, 10, 15];
    const envBonusLevels = [0, 10, 20, 30, 40];

    // Annual depreciation for tax calculation
    const annualDepreciation = totalInvestment / depreciationYears;

    // Generate grid of scenarios for heatmap-style analysis
    royaltyLevels.forEach(royalty => {
      envBonusLevels.forEach(envBonus => {
        // Calculate net impact of partnership terms
        const annualRoyalties = baseRevenue * (royalty / 100);
        const annualEnvBonus = annualTonnage * envBonus;
        const netImpact = annualEnvBonus - annualRoyalties;
        
        // Adjusted EBITDA using actual margin, not fixed 25%
        const adjustedEbitda = actualEbitda + netImpact;
        
        // Calculate taxes with country-specific rate
        const taxableIncome = adjustedEbitda - annualDepreciation;
        const taxes = Math.max(0, taxableIncome * (taxRate / 100));
        
        // Net profit after taxes (for accurate ROI)
        const netProfit = adjustedEbitda - taxes;
        
        // ROI based on net profit, not EBITDA
        const adjustedRoi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
        const adjustedPayback = netProfit > 0 ? (totalInvestment / netProfit) * 12 : 999;
        
        scenarios.push({
          name: `R${royalty}%/B$${envBonus}`,
          royalty,
          envBonus,
          netImpact,
          adjustedRoi: Math.max(0, adjustedRoi),
          adjustedPayback: Math.min(120, adjustedPayback),
          isCurrent: royalty === currentRoyalty && envBonus === currentEnvBonus
        });
      });
    });

    return scenarios;
  }, [baseRevenue, annualTonnage, totalInvestment, currentRoyalty, currentEnvBonus, actualEbitda, taxRate, depreciationYears]);

  // Create simplified bar chart data for key scenarios
  // Uses country-specific tax rates and actual EBITDA
  const chartData = useMemo(() => {
    const keyScenarios = [
      { royalty: 0, envBonus: 0, label: t('admin.feasibility.scenarioChart.noPartnership', 'Sem Parceria') },
      { royalty: 0, envBonus: 20, label: t('admin.feasibility.scenarioChart.bonusOnly', 'Só Bônus') },
      { royalty: 5, envBonus: 20, label: t('admin.feasibility.scenarioChart.balanced', 'Equilibrado') },
      { royalty: 10, envBonus: 30, label: t('admin.feasibility.scenarioChart.highPartnership', 'Alta Parceria') },
      { royalty: currentRoyalty, envBonus: currentEnvBonus, label: t('admin.feasibility.scenarioChart.current', 'Atual') }
    ];

    const annualDepreciation = totalInvestment / depreciationYears;

    return keyScenarios.map(scenario => {
      const annualRoyalties = baseRevenue * (scenario.royalty / 100);
      const annualEnvBonus = annualTonnage * scenario.envBonus;
      const netImpact = annualEnvBonus - annualRoyalties;
      
      // Use actual EBITDA margin instead of fixed 25%
      const adjustedEbitda = actualEbitda + netImpact;
      
      // Apply country-specific taxes
      const taxableIncome = adjustedEbitda - annualDepreciation;
      const taxes = Math.max(0, taxableIncome * (taxRate / 100));
      const netProfit = adjustedEbitda - taxes;
      
      // ROI based on net profit (after taxes)
      const adjustedRoi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
      const adjustedPayback = netProfit > 0 ? (totalInvestment / netProfit) : 10;

      return {
        name: scenario.label,
        royalty: scenario.royalty,
        envBonus: scenario.envBonus,
        roi: Math.max(0, adjustedRoi),
        payback: Math.min(10, adjustedPayback),
        netImpact: netImpact / 1000, // in thousands
        isCurrent: scenario.royalty === currentRoyalty && scenario.envBonus === currentEnvBonus
      };
    });
  }, [baseRevenue, annualTonnage, totalInvestment, currentRoyalty, currentEnvBonus, t, actualEbitda, taxRate, depreciationYears]);

  // Sensitivity analysis data - uses country-specific taxes
  const sensitivityData = useMemo(() => {
    const data: Array<{
      envBonus: number;
      roi0: number;
      roi5: number;
      roi10: number;
      roi15: number;
    }> = [];

    const annualDepreciation = totalInvestment / depreciationYears;

    for (let envBonus = 0; envBonus <= 50; envBonus += 5) {
      const calcRoi = (royalty: number) => {
        const annualRoyalties = baseRevenue * (royalty / 100);
        const annualEnvBonusAmt = annualTonnage * envBonus;
        const netImpact = annualEnvBonusAmt - annualRoyalties;
        
        // Use actual EBITDA and apply country-specific taxes
        const adjustedEbitda = actualEbitda + netImpact;
        const taxableIncome = adjustedEbitda - annualDepreciation;
        const taxes = Math.max(0, taxableIncome * (taxRate / 100));
        const netProfit = adjustedEbitda - taxes;
        
        return totalInvestment > 0 ? Math.max(0, (netProfit / totalInvestment) * 100) : 0;
      };

      data.push({
        envBonus,
        roi0: calcRoi(0),
        roi5: calcRoi(5),
        roi10: calcRoi(10),
        roi15: calcRoi(15)
      });
    }

    return data;
  }, [baseRevenue, annualTonnage, totalInvestment, actualEbitda, taxRate, depreciationYears]);

  // Find best and worst scenarios
  const bestScenario = useMemo(() => {
    return chartData.reduce((best, current) => 
      current.roi > best.roi ? current : best, chartData[0]);
  }, [chartData]);

  const currentScenario = useMemo(() => {
    return chartData.find(s => s.isCurrent) || chartData[chartData.length - 1];
  }, [chartData]);

  return (
    <Card className="border-purple-500/50 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <Scale className="h-4 w-4" />
          {t('admin.feasibility.scenarioChart.title', 'Análise de Cenários de Parceria')}
          <Badge variant="outline" className="text-[10px] bg-purple-100 dark:bg-purple-900">
            📊 {t('admin.feasibility.scenarioChart.interactive', 'Interativo')}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {t('admin.feasibility.scenarioChart.description', 'Compare o impacto de diferentes níveis de royalties vs bônus ambiental no ROI')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-2 border border-purple-200 dark:border-purple-800"
          >
            <span className="text-[10px] text-muted-foreground block">
              {t('admin.feasibility.scenarioChart.currentConfig', 'Config. Atual')}
            </span>
            <span className="font-bold text-sm text-purple-600">
              {currentRoyalty}% / ${currentEnvBonus}
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-2 border border-green-200 dark:border-green-800"
          >
            <span className="text-[10px] text-muted-foreground block">
              {t('admin.feasibility.scenarioChart.currentRoi', 'ROI Atual')}
            </span>
            <span className="font-bold text-sm text-green-600">
              {currentScenario.roi.toFixed(1)}%
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-2 border border-blue-200 dark:border-blue-800"
          >
            <span className="text-[10px] text-muted-foreground block">
              {t('admin.feasibility.scenarioChart.bestScenario', 'Melhor Cenário')}
            </span>
            <span className="font-bold text-sm text-blue-600">
              {bestScenario.name}
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white/60 dark:bg-gray-900/40 rounded-lg p-2 border ${
              currentScenario.netImpact >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'
            }`}
          >
            <span className="text-[10px] text-muted-foreground block">
              {t('admin.feasibility.scenarioChart.netImpact', 'Impacto Líquido')}
            </span>
            <span className={`font-bold text-sm flex items-center gap-1 ${
              currentScenario.netImpact >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentScenario.netImpact >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {currentScenario.netImpact >= 0 ? '+' : ''}{formatCurrency(currentScenario.netImpact * 1000)}
            </span>
          </motion.div>
        </div>

        {/* Bar Chart - ROI Comparison */}
        <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-3 border">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
            {t('admin.feasibility.scenarioChart.roiComparison', 'Comparação de ROI por Cenário')}
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                {t('admin.feasibility.scenarioChart.roiTooltip', 'ROI ajustado considerando royalties e bônus ambiental')}
              </TooltipContent>
            </Tooltip>
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 9 }} 
                interval={0}
                angle={-15}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isCurrent ? '#8b5cf6' : entry.roi > 20 ? '#22c55e' : entry.roi > 10 ? '#3b82f6' : '#f59e0b'} 
                    stroke={entry.isCurrent ? '#6d28d9' : 'none'}
                    strokeWidth={entry.isCurrent ? 2 : 0}
                  />
                ))}
              </Bar>
              <ReferenceLine y={baseRoi} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Base', fontSize: 8, fill: '#ef4444' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Sensitivity Analysis */}
        <div className="bg-white/50 dark:bg-gray-900/30 rounded-lg p-3 border">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
            {t('admin.feasibility.scenarioChart.sensitivityAnalysis', 'Análise de Sensibilidade: Bônus Ambiental vs ROI')}
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {t('admin.feasibility.scenarioChart.sensitivityTooltip', 'Mostra como o ROI varia conforme o bônus ambiental aumenta, para diferentes níveis de royalties')}
              </TooltipContent>
            </Tooltip>
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={sensitivityData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="envBonus" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(v) => `$${v}`}
                label={{ value: t('admin.feasibility.scenarioChart.envBonusLabel', 'Bônus ($/t)'), position: 'bottom', fontSize: 9, offset: -5 }}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
              <Legend 
                wrapperStyle={{ fontSize: 9 }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    roi0: 'Royalty 0%',
                    roi5: 'Royalty 5%',
                    roi10: 'Royalty 10%',
                    roi15: 'Royalty 15%'
                  };
                  return labels[value] || value;
                }}
              />
              <Line type="monotone" dataKey="roi0" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="roi5" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="roi10" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="roi15" stroke="#ef4444" strokeWidth={2} dot={false} />
              <ReferenceLine x={currentEnvBonus} stroke="#8b5cf6" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg p-3 border border-purple-300 dark:border-purple-700"
        >
          <h5 className="text-xs font-medium text-purple-800 dark:text-purple-300 mb-1 flex items-center gap-1">
            💡 {t('admin.feasibility.scenarioChart.recommendation', 'Recomendação')}
          </h5>
          <p className="text-[11px] text-purple-700 dark:text-purple-400">
            {currentScenario.roi >= bestScenario.roi * 0.9 ? (
              t('admin.feasibility.scenarioChart.optimalConfig', 'Sua configuração atual está otimizada. O cenário escolhido maximiza o equilíbrio entre royalties e bônus ambiental.')
            ) : (
              t('admin.feasibility.scenarioChart.suboptimalConfig', `Considere ajustar para ${bestScenario.name} para aumentar o ROI em ${(bestScenario.roi - currentScenario.roi).toFixed(1)} pontos percentuais.`)
            )}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
