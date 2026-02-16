import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, TrendingUp, Clock, BarChart3, Percent, Info } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ROICalculatorProps {
  plantType: 'tire-recycling' | 'pyrolysis' | 'otr';
  baseInvestment: number; // USD
  operatingCostPerTon: number; // USD
  revenuePerTon: number; // USD
  defaultCapacity: number; // ton/day
  maxCapacity: number; // ton/day
}

export function ROICalculator({
  plantType,
  baseInvestment,
  operatingCostPerTon,
  revenuePerTon,
  defaultCapacity,
  maxCapacity
}: ROICalculatorProps) {
  const { t } = useTranslation();
  
  const [dailyCapacity, setDailyCapacity] = useState(defaultCapacity);
  const [operatingDays, setOperatingDays] = useState(300);
  const [utilizationRate, setUtilizationRate] = useState(85);

  // Calculate investment based on capacity (economy of scale)
  const investment = useMemo(() => {
    const scaleFactor = Math.pow(dailyCapacity / defaultCapacity, 0.7);
    return baseInvestment * scaleFactor;
  }, [dailyCapacity, baseInvestment, defaultCapacity]);

  // Annual calculations
  const annualTonnage = useMemo(() => {
    return dailyCapacity * operatingDays * (utilizationRate / 100);
  }, [dailyCapacity, operatingDays, utilizationRate]);

  const annualRevenue = useMemo(() => {
    return annualTonnage * revenuePerTon;
  }, [annualTonnage, revenuePerTon]);

  const annualOperatingCost = useMemo(() => {
    return annualTonnage * operatingCostPerTon;
  }, [annualTonnage, operatingCostPerTon]);

  const annualProfit = useMemo(() => {
    return annualRevenue - annualOperatingCost;
  }, [annualRevenue, annualOperatingCost]);

  const paybackMonths = useMemo(() => {
    if (annualProfit <= 0) return Infinity;
    return Math.ceil((investment / annualProfit) * 12);
  }, [investment, annualProfit]);

  const roi = useMemo(() => {
    if (investment <= 0) return 0;
    return ((annualProfit / investment) * 100);
  }, [annualProfit, investment]);

  const ebitdaMargin = useMemo(() => {
    if (annualRevenue <= 0) return 0;
    return ((annualProfit / annualRevenue) * 100);
  }, [annualProfit, annualRevenue]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `USD ${(value / 1000000).toFixed(2)}M`;
    }
    return `USD ${(value / 1000).toFixed(0)}K`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <GlassCard className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('plants.roi.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('plants.roi.subtitle')}</p>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6 mb-8">
            {/* Daily Capacity */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  {t('plants.roi.dailyCapacity')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('plants.roi.dailyCapacityTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <span className="font-bold text-primary">{dailyCapacity} {t('plants.roi.tonsDay')}</span>
              </div>
              <Slider
                value={[dailyCapacity]}
                onValueChange={(value) => setDailyCapacity(value[0])}
                min={Math.ceil(defaultCapacity * 0.5)}
                max={maxCapacity}
                step={5}
                className="w-full"
              />
            </div>

            {/* Operating Days */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  {t('plants.roi.operatingDays')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('plants.roi.operatingDaysTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <span className="font-bold text-primary">{operatingDays} {t('plants.roi.daysYear')}</span>
              </div>
              <Slider
                value={[operatingDays]}
                onValueChange={(value) => setOperatingDays(value[0])}
                min={200}
                max={350}
                step={5}
                className="w-full"
              />
            </div>

            {/* Utilization Rate */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  {t('plants.roi.utilizationRate')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('plants.roi.utilizationRateTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </label>
                <span className="font-bold text-primary">{utilizationRate}%</span>
              </div>
              <Slider
                value={[utilizationRate]}
                onValueChange={(value) => setUtilizationRate(value[0])}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <DollarSign className="h-5 w-5 text-primary mx-auto mb-2" />
              <span className="text-xs text-muted-foreground block">{t('plants.roi.investment')}</span>
              <span className="font-bold text-lg">{formatCurrency(investment)}</span>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <BarChart3 className="h-5 w-5 text-green-500 mx-auto mb-2" />
              <span className="text-xs text-muted-foreground block">{t('plants.roi.annualRevenue')}</span>
              <span className="font-bold text-lg text-green-600">{formatCurrency(annualRevenue)}</span>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
              <span className="text-xs text-muted-foreground block">{t('plants.roi.annualProfit')}</span>
              <span className="font-bold text-lg text-emerald-600">{formatCurrency(annualProfit)}</span>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Clock className="h-5 w-5 text-orange-500 mx-auto mb-2" />
              <span className="text-xs text-muted-foreground block">{t('plants.roi.payback')}</span>
              <span className="font-bold text-lg text-orange-600">
                {paybackMonths === Infinity ? '∞' : `${paybackMonths} ${t('plants.roi.months')}`}
              </span>
            </div>
          </div>

          {/* ROI and EBITDA */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-xl p-4 text-center border border-primary/20">
              <Percent className="h-5 w-5 text-primary mx-auto mb-2" />
              <span className="text-xs text-muted-foreground block">{t('plants.roi.roiLabel')}</span>
              <span className="font-bold text-2xl text-primary">{roi.toFixed(1)}%</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-xl p-4 text-center border border-emerald-500/20">
              <BarChart3 className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <span className="text-xs text-muted-foreground block">{t('plants.roi.ebitdaMargin')}</span>
              <span className="font-bold text-2xl text-emerald-600">{ebitdaMargin.toFixed(1)}%</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong className="text-foreground">{t('plants.roi.summary')}:</strong>{' '}
              {t('plants.roi.summaryText', {
                tonnage: formatNumber(annualTonnage),
                revenue: formatCurrency(annualRevenue),
                profit: formatCurrency(annualProfit)
              })}
            </p>
            <p className="text-xs italic">{t('plants.roi.disclaimer')}</p>
          </div>

          {/* CTA */}
          <div className="mt-6 text-center">
            <Button asChild className="bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90">
              <a href="#quote-form">{t('plants.roi.getQuote')}</a>
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </TooltipProvider>
  );
}
