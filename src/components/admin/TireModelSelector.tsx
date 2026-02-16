// Specific Tire Model Selector Component - Supports Multiple Categories
import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Check, ChevronDown, ChevronUp, DollarSign, Scale, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TIRE_CATEGORIES, getTireCategory, OTR_MARKET_PRICES } from './FiscalIncentivesTable';

interface TireModelSelectorProps {
  selectedCategories: string[];
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  onCalculatedValues?: (values: {
    avgWeight: number;
    totalRecoverable: { granules: number; steel: number; textile: number; rcb: number };
    estimatedValuePerTire: number;
    recommendedYields: { rubber: number; steel: number; textile: number; rcb: number };
  }) => void;
}

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

export function TireModelSelector({
  selectedCategories,
  selectedModels,
  onModelsChange,
  onCalculatedValues
}: TireModelSelectorProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const hasNotifiedRef = useRef(false);
  const prevSelectedModelsRef = useRef<string[]>([]);

  // Get all categories and combine their models
  const categoriesData = useMemo(() => {
    return selectedCategories.map(id => getTireCategory(id)).filter(Boolean);
  }, [selectedCategories]);

  // Combine all models from selected categories
  const allModels = useMemo(() => {
    return categoriesData.flatMap(cat => cat?.models || []);
  }, [categoriesData]);

  // Calculate values based on selected models across all categories
  const calculatedValues = useMemo(() => {
    if (allModels.length === 0) return null;

    const models = selectedModels.length > 0 
      ? allModels.filter(m => selectedModels.includes(m.model))
      : allModels;

    if (models.length === 0) return null;

    const avgWeight = models.reduce((sum, m) => sum + m.weight, 0) / models.length;
    
    const totalRecoverable = models.reduce((acc, m) => ({
      granules: acc.granules + m.recoverable.granules,
      steel: acc.steel + m.recoverable.steel,
      textile: acc.textile + m.recoverable.textile,
      rcb: acc.rcb + m.recoverable.rcb
    }), { granules: 0, steel: 0, textile: 0, rcb: 0 });

    // Average per tire
    const avgRecoverable = {
      granules: totalRecoverable.granules / models.length,
      steel: totalRecoverable.steel / models.length,
      textile: totalRecoverable.textile / models.length,
      rcb: totalRecoverable.rcb / models.length
    };

    // Calculate value per tire based on Jan 2026 market prices (using avg values)
    const valuePerTire = 
      (avgRecoverable.granules / 1000) * OTR_MARKET_PRICES.granules.avg +
      (avgRecoverable.steel / 1000) * OTR_MARKET_PRICES.steel.avg +
      (avgRecoverable.textile / 1000) * OTR_MARKET_PRICES.textile.avg +
      (avgRecoverable.rcb / 1000) * OTR_MARKET_PRICES.rcb.avg;

    // Calculate recommended yields based on composition
    const recommendedYields = {
      rubber: Math.round((avgRecoverable.granules / avgWeight) * 100),
      steel: Math.round((avgRecoverable.steel / avgWeight) * 100),
      textile: Math.round((avgRecoverable.textile / avgWeight) * 100),
      rcb: Math.round((avgRecoverable.rcb / avgWeight) * 100)
    };

    return {
      avgWeight,
      totalRecoverable: avgRecoverable,
      estimatedValuePerTire: valuePerTire,
      recommendedYields,
      modelsCount: models.length
    };
  }, [allModels, selectedModels]);

  // Only notify parent when models are explicitly changed by user (not on mount/re-render)
  useEffect(() => {
    const modelsChanged = JSON.stringify(prevSelectedModelsRef.current) !== JSON.stringify(selectedModels);
    
    if (modelsChanged && hasNotifiedRef.current && calculatedValues && onCalculatedValues) {
      onCalculatedValues({
        avgWeight: calculatedValues.avgWeight,
        totalRecoverable: calculatedValues.totalRecoverable,
        estimatedValuePerTire: calculatedValues.estimatedValuePerTire,
        recommendedYields: calculatedValues.recommendedYields
      });
    }
    
    prevSelectedModelsRef.current = selectedModels;
    hasNotifiedRef.current = true;
  }, [selectedModels]);

  const handleModelToggle = (model: string) => {
    if (selectedModels.includes(model)) {
      onModelsChange(selectedModels.filter(m => m !== model));
    } else {
      onModelsChange([...selectedModels, model]);
    }
  };

  const handleSelectAll = () => {
    if (selectedModels.length === allModels.length) {
      onModelsChange([]);
    } else {
      onModelsChange(allModels.map(m => m.model));
    }
  };

  if (categoriesData.length === 0) return null;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-indigo-500/50 bg-gradient-to-br from-indigo-50/50 to-violet-50/30 dark:from-indigo-950/20 dark:to-violet-950/10">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-2 cursor-pointer hover:bg-indigo-100/30 dark:hover:bg-indigo-900/20 transition-colors">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Circle className="h-4 w-4" />
                {t('admin.feasibility.tireModels.title', 'Modelos Específicos de Pneus')}
                <Badge variant="outline" className="text-[9px] bg-indigo-100 dark:bg-indigo-900">
                  {selectedModels.length || allModels.length} {t('admin.feasibility.tireModels.selected', 'selecionados')}
                </Badge>
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedCategories.length > 1 
                ? t('admin.feasibility.tireModels.multiCategoryDescription', 'Modelos de {{count}} categorias selecionadas', { count: selectedCategories.length })
                : t('admin.feasibility.tireModels.description', 'Selecione modelos individuais para cálculos mais precisos')
              }
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Select All Button + Category Badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7"
              >
                {selectedModels.length === allModels.length ? (
                  <>{t('admin.feasibility.tireModels.deselectAll', 'Desmarcar Todos')}</>
                ) : (
                  <>{t('admin.feasibility.tireModels.selectAll', 'Selecionar Todos')}</>
                )}
              </Button>
              <div className="flex flex-wrap gap-1">
                {categoriesData.map(cat => cat && (
                  <Badge key={cat.id} variant="secondary" className="text-[10px]">
                    {cat.icon} {t(`admin.feasibility.tireCategory.types.${cat.nameKey}`, cat.nameKey)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Model Grid - Grouped by Category */}
            {categoriesData.map(category => {
              if (!category) return null;
              
              return (
                <div key={category.id} className="space-y-2">
                  {/* Category Header (only show if multiple categories) */}
                  {selectedCategories.length > 1 && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                      <span className="text-lg">{category.icon}</span>
                      {t(`admin.feasibility.tireCategory.types.${category.nameKey}`, category.nameKey)}
                      <Badge variant="outline" className="text-[9px]">
                        {category.models.length} {t('admin.feasibility.tireModels.modelsAvailable', 'modelos')}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                    <AnimatePresence>
                      {category.models.map((model, idx) => {
                        const isSelected = selectedModels.length === 0 || selectedModels.includes(model.model);
                        const valuePerTire = 
                          (model.recoverable.granules / 1000) * OTR_MARKET_PRICES.granules.avg +
                          (model.recoverable.steel / 1000) * OTR_MARKET_PRICES.steel.avg +
                          (model.recoverable.textile / 1000) * OTR_MARKET_PRICES.textile.avg +
                          (model.recoverable.rcb / 1000) * OTR_MARKET_PRICES.rcb.avg;

                        return (
                          <motion.div
                            key={model.model}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => handleModelToggle(model.model)}
                            className={`relative p-2 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-100/70 dark:bg-indigo-900/40 shadow-sm'
                                : 'border-muted bg-white/50 dark:bg-gray-900/30 hover:border-indigo-300'
                            }`}
                          >
                            {/* Selection indicator */}
                            <div className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                              isSelected ? 'bg-indigo-500' : 'bg-muted'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>

                            {/* Model info */}
                            <div className="pr-5">
                              <p className="font-mono font-bold text-sm text-indigo-700 dark:text-indigo-300">
                                {model.model}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {t(`admin.feasibility.tireModels.applications.${model.applicationKey}`, model.applicationKey)}
                              </p>
                            </div>

                            {/* Specs */}
                            <div className="grid grid-cols-2 gap-1 mt-2 text-[9px]">
                              <div className="bg-white/50 dark:bg-gray-800/50 rounded px-1 py-0.5">
                                <span className="text-muted-foreground">⚖️</span> {model.weight.toLocaleString()} kg
                              </div>
                              <div className="bg-white/50 dark:bg-gray-800/50 rounded px-1 py-0.5">
                                <span className="text-muted-foreground">⌀</span> {model.diameter}m
                              </div>
                            </div>

                            {/* Value */}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                                <DollarSign className="h-3 w-3" />
                                <span className="font-bold">{formatCurrency(valuePerTire)}</span>
                                <span className="text-muted-foreground">/pneu</span>
                              </div>
                            </div>

                            {/* Recoverable breakdown on hover */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="mt-1 flex gap-1">
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 dark:bg-blue-900/30">
                                    🔵 {model.recoverable.granules}kg
                                  </Badge>
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 bg-gray-50 dark:bg-gray-900/30">
                                    ⚫ {model.recoverable.steel}kg
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                <div className="space-y-1">
                                  <p><span className="text-blue-500">{t('admin.feasibility.rubber', 'Borracha')}:</span> {model.recoverable.granules} kg</p>
                                  <p><span className="text-gray-500">{t('admin.feasibility.steel', 'Aço')}:</span> {model.recoverable.steel} kg</p>
                                  <p><span className="text-amber-500">{t('admin.feasibility.textile', 'Têxtil')}:</span> {model.recoverable.textile} kg</p>
                                  <p><span className="text-purple-500">rCB:</span> {model.recoverable.rcb} kg</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}

            {/* Calculated Summary */}
            {calculatedValues && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-lg p-3 border border-indigo-300 dark:border-indigo-700"
              >
                <h5 className="text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {t('admin.feasibility.tireModels.summary', 'Resumo dos Modelos Selecionados')}
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('admin.feasibility.tireModels.summaryTooltip', 'Médias calculadas com base nos modelos selecionados e preços de mercado Jan 2026')}
                    </TooltipContent>
                  </Tooltip>
                </h5>
                
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:gap-3">
                  <div className="bg-white/50 dark:bg-gray-900/30 rounded p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      {t('admin.feasibility.tireModels.avgWeight', 'Peso Médio')}
                    </span>
                    <span className="font-bold text-indigo-600">
                      {calculatedValues.avgWeight.toLocaleString()} kg
                    </span>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-900/30 rounded p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      {t('admin.feasibility.tireModels.valuePerTire', 'Valor/Pneu')}
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(calculatedValues.estimatedValuePerTire)}
                    </span>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-900/30 rounded p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      {t('admin.feasibility.tireModels.rubberYield', 'Yield Borracha')}
                    </span>
                    <span className="font-bold text-blue-600">
                      {calculatedValues.recommendedYields.rubber}%
                    </span>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-900/30 rounded p-2">
                    <span className="text-[10px] text-muted-foreground block">
                      {t('admin.feasibility.tireModels.modelsCount', 'Modelos')}
                    </span>
                    <span className="font-bold text-purple-600">
                      {calculatedValues.modelsCount}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
