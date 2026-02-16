// =============================================================================
// EXPORT PRICE CALCULATOR COMPONENT
// Calculates selling prices with Incoterms and destination country taxes
// =============================================================================

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Ship,
  Calculator,
  TrendingUp,
  DollarSign,
  FileText,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  INCOTERMS_2020,
  COUNTRY_TAX_DATABASE,
  PRODUCT_HS_CODES,
  calculateExportPrice,
  getDestinationCountries,
  getCountryTaxSummary,
  compareDestinations,
  type PriceCalculation
} from '@/lib/incotermsAndTaxes';

interface ExportPriceCalculatorProps {
  // Product prices (per ton, EXW basis)
  rubberGranulesPrice: number;
  steelWirePrice: number;
  textileFiberPrice: number;
  rcbPrice: number;
  // Annual production (tons)
  annualTonnage: number;
  // Yields (percentages)
  rubberGranulesYield: number;
  steelWireYield: number;
  textileFiberYield: number;
  rcbYield: number;
  // Callbacks
  onPriceUpdate?: (adjustedPrices: {
    rubber_granules_price: number;
    steel_wire_price: number;
    textile_fiber_price: number;
    rcb_price: number;
  }) => void;
  // NEW: Callback to export calculation data for PDF
  onExportDataChange?: (data: {
    incoterm: string;
    destination: string;
    destinationName: string;
    products: Array<{
      name: string;
      exwPrice: number;
      landedPrice: number;
      quantity: number;
      totalRevenue: number;
      duties: number;
      taxes: number;
    }>;
    totalExportRevenue: number;
    totalDuties: number;
    totalTaxes: number;
  }) => void;
}

export function ExportPriceCalculator({
  rubberGranulesPrice,
  steelWirePrice,
  textileFiberPrice,
  rcbPrice,
  annualTonnage,
  rubberGranulesYield,
  steelWireYield,
  textileFiberYield,
  rcbYield,
  onPriceUpdate,
  onExportDataChange
}: ExportPriceCalculatorProps) {
  const { t } = useTranslation();
  const [selectedIncoterm, setSelectedIncoterm] = useState<string>('FOB');
  const [selectedDestination, setSelectedDestination] = useState<string>('US');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  const destinationCountries = useMemo(() => getDestinationCountries(), []);
  const countryTaxSummary = useMemo(() => getCountryTaxSummary(selectedDestination), [selectedDestination]);
  const incoterm = INCOTERMS_2020[selectedIncoterm];

  // Calculate prices for all products
  const priceCalculations = useMemo(() => {
    const products = [
      { key: 'rubber_granules', price: rubberGranulesPrice, yield: rubberGranulesYield, label: 'Borracha Granulada' },
      { key: 'steel_wire', price: steelWirePrice, yield: steelWireYield, label: 'Arame de Aço' },
      { key: 'textile_fiber', price: textileFiberPrice, yield: textileFiberYield, label: 'Fibra Têxtil' },
      { key: 'rcb', price: rcbPrice, yield: rcbYield, label: 'Negro de Fumo (rCB)' }
    ];

    return products.map(product => {
      const quantity = annualTonnage * (product.yield / 100);
      try {
        const calc = calculateExportPrice(
          product.price,
          quantity,
          product.key as keyof typeof PRODUCT_HS_CODES,
          selectedIncoterm,
          selectedDestination
        );
        return {
          ...product,
          quantity,
          calculation: calc
        };
      } catch {
        return {
          ...product,
          quantity,
          calculation: null
        };
      }
    });
  }, [
    rubberGranulesPrice, steelWirePrice, textileFiberPrice, rcbPrice,
    rubberGranulesYield, steelWireYield, textileFiberYield, rcbYield,
    annualTonnage, selectedIncoterm, selectedDestination
  ]);

  // Total revenue calculations
  const totals = useMemo(() => {
    const validCalcs = priceCalculations.filter(p => p.calculation);
    return {
      totalEXW: validCalcs.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      totalCIF: validCalcs.reduce((sum, p) => sum + (p.calculation?.cifPrice || 0), 0),
      totalDuties: validCalcs.reduce((sum, p) => sum + (p.calculation?.importDuties.totalDuties || 0), 0),
      totalLanded: validCalcs.reduce((sum, p) => sum + (p.calculation?.finalPrice || 0), 0)
    };
  }, [priceCalculations]);

  // Compare top destinations
  const destinationComparison = useMemo(() => {
    if (!showComparison) return [];
    const topDestinations = ['US', 'DE', 'CN', 'AU', 'CL', 'ZA'];
    const quantity = annualTonnage * (rubberGranulesYield / 100);
    return compareDestinations(
      rubberGranulesPrice,
      quantity,
      'rubber_granules',
      selectedIncoterm,
      topDestinations
    );
  }, [showComparison, rubberGranulesPrice, annualTonnage, rubberGranulesYield, selectedIncoterm]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `USD ${(value / 1000000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `USD ${(value / 1000).toFixed(1)}K`;
    }
    return `USD ${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card className="border-blue-200 dark:border-blue-800">
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  {t('admin.feasibility.exportCalculator.title', 'Calculadora de Exportação')}
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {selectedIncoterm} → {countryTaxSummary?.flag} {countryTaxSummary?.countryName}
                  </Badge>
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('admin.feasibility.exportCalculator.description', 'Calcule preços com Incoterms e impostos do país de destino')}
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Incoterm & Destination Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Incoterm Selection */}
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <Ship className="h-3 w-3" />
                    {t('admin.feasibility.exportCalculator.incoterm', 'Incoterm')}
                  </Label>
                  <Select value={selectedIncoterm} onValueChange={setSelectedIncoterm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(INCOTERMS_2020).map(term => (
                        <SelectItem key={term.id} value={term.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{term.id}</span>
                            <span className="text-xs text-muted-foreground">- {term.fullName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Incoterm Details */}
                  {incoterm && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-[10px]">
                      <p className="font-medium">{incoterm.fullName}</p>
                      <p className="text-muted-foreground mt-1">{incoterm.description}</p>
                      <div className="flex gap-2 mt-2">
                        {incoterm.customsClearanceExport && (
                          <Badge variant="secondary" className="text-[9px]">Export Cleared</Badge>
                        )}
                        {incoterm.customsClearanceImport && (
                          <Badge variant="secondary" className="text-[9px]">Import Cleared</Badge>
                        )}
                        {incoterm.freightCostPercent > 0 && (
                          <Badge variant="outline" className="text-[9px]">+{incoterm.freightCostPercent}% freight</Badge>
                        )}
                        {incoterm.insuranceCostPercent > 0 && (
                          <Badge variant="outline" className="text-[9px]">+{incoterm.insuranceCostPercent}% insurance</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Destination Country */}
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <Globe className="h-3 w-3" />
                    {t('admin.feasibility.exportCalculator.destination', 'País de Destino')}
                  </Label>
                  <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationCountries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-[10px] text-muted-foreground">({country.region})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Country Tax Summary */}
                  {countryTaxSummary && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded text-[10px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{countryTaxSummary.flag} {countryTaxSummary.countryName}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {countryTaxSummary.currency}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <span className="text-muted-foreground">VAT/IVA:</span>
                          <div className="font-bold">{countryTaxSummary.vatRate}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Média Import:</span>
                          <div className="font-bold">{countryTaxSummary.averageImportDuty?.toFixed(1)}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Tax:</span>
                          <div className="font-bold text-orange-600">{countryTaxSummary.totalTaxBurden?.toFixed(1)}%</div>
                        </div>
                      </div>
                      {countryTaxSummary.freeTradeAgreements.length > 0 && (
                        <div className="mt-2">
                          <span className="text-muted-foreground">FTAs: </span>
                          <span>{countryTaxSummary.freeTradeAgreements.slice(0, 3).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Price Breakdown by Product */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {t('admin.feasibility.exportCalculator.priceBreakdown', 'Detalhamento de Preços por Produto')}
                </h4>

                <div className="grid gap-2">
                  {/* Header */}
                  <div className="grid grid-cols-7 gap-2 text-[10px] font-medium text-muted-foreground px-2">
                    <div>Produto</div>
                    <div className="text-right">Qtd (t/ano)</div>
                    <div className="text-right">EXW ($/t)</div>
                    <div className="text-right">Frete+Seg</div>
                    <div className="text-right">CIF</div>
                    <div className="text-right">Impostos</div>
                    <div className="text-right">Landed</div>
                  </div>

                  {/* Product Rows */}
                  {priceCalculations.map(product => (
                    <div 
                      key={product.key}
                      className="grid grid-cols-7 gap-2 text-xs bg-muted/30 rounded p-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-medium truncate">{product.label}</div>
                      <div className="text-right">{Math.round(product.quantity).toLocaleString()}</div>
                      <div className="text-right">${product.price}</div>
                      {product.calculation ? (
                        <>
                          <div className="text-right text-blue-600">
                            +{formatPercent(incoterm.freightCostPercent + incoterm.insuranceCostPercent)}
                          </div>
                          <div className="text-right">
                            {formatCurrency(product.calculation.cifPrice)}
                          </div>
                          <div className="text-right text-orange-600">
                            {formatCurrency(product.calculation.importDuties.totalDuties)}
                          </div>
                          <div className="text-right font-bold text-green-600">
                            {formatCurrency(product.calculation.finalPrice)}
                          </div>
                        </>
                      ) : (
                        <div className="col-span-4 text-center text-muted-foreground">-</div>
                      )}
                    </div>
                  ))}

                  {/* Totals Row */}
                  <div className="grid grid-cols-7 gap-2 text-xs font-bold bg-primary/10 rounded p-2 mt-2">
                    <div>TOTAL ANUAL</div>
                    <div className="text-right">{Math.round(annualTonnage).toLocaleString()} t</div>
                    <div className="text-right">{formatCurrency(totals.totalEXW)}</div>
                    <div className="text-right text-blue-600">-</div>
                    <div className="text-right">{formatCurrency(totals.totalCIF)}</div>
                    <div className="text-right text-orange-600">{formatCurrency(totals.totalDuties)}</div>
                    <div className="text-right text-green-600">{formatCurrency(totals.totalLanded)}</div>
                  </div>
                </div>
              </div>

              {/* Tax Breakdown Details */}
              {priceCalculations[0]?.calculation && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {t('admin.feasibility.exportCalculator.taxDetails', 'Detalhamento de Impostos')} - {countryTaxSummary?.countryName}
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                    <div>
                      <span className="text-muted-foreground">Import Duty:</span>
                      <div className="font-bold">{formatCurrency(priceCalculations[0].calculation.importDuties.customsDuty)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">VAT/IVA:</span>
                      <div className="font-bold">{formatCurrency(priceCalculations[0].calculation.importDuties.vatAmount)}</div>
                    </div>
                    {priceCalculations[0].calculation.importDuties.additionalTaxes.map((tax, i) => (
                      <div key={i}>
                        <span className="text-muted-foreground">{tax.name}:</span>
                        <div className="font-bold">{formatCurrency(tax.amount)}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Margin Analysis */}
                  <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center">
                          <span className="text-muted-foreground block text-[9px]">Taxa Efetiva</span>
                          <span className="font-bold text-orange-600">
                            {formatPercent(priceCalculations[0].calculation.marginAnalysis.effectiveTaxRate)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Total de impostos / Valor CIF</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-center">
                          <span className="text-muted-foreground block text-[9px]">Receita Líquida</span>
                          <span className="font-bold text-green-600">
                            {formatPercent(priceCalculations[0].calculation.marginAnalysis.netRevenuePercent)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">% do preço landed que é receita EXW</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="text-center">
                      <span className="text-muted-foreground block text-[9px]">Risco Transfer</span>
                      <span className="font-bold text-blue-600 text-[10px]">
                        {incoterm.riskTransferPoint.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Destination Comparison */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${showComparison ? 'animate-spin' : ''}`} />
                  {showComparison ? 'Ocultar Comparação' : 'Comparar Destinos'}
                </Button>

                {countryTaxSummary?.recyclingIncentives.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Info className="h-3 w-3 text-green-600" />
                    <span className="text-[10px] text-green-600">
                      Incentivos: {countryTaxSummary.recyclingIncentives[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Comparison Table */}
              {showComparison && destinationComparison.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <h5 className="text-xs font-medium mb-2">
                    Comparação: Borracha Granulada (${rubberGranulesPrice}/t EXW) - {selectedIncoterm}
                  </h5>
                  <div className="grid grid-cols-6 gap-2 text-[10px]">
                    {destinationComparison.map(dest => (
                      <div 
                        key={dest.countryCode}
                        className={`p-2 rounded text-center ${
                          dest.countryCode === selectedDestination 
                            ? 'bg-primary/20 ring-1 ring-primary' 
                            : 'bg-white dark:bg-gray-900'
                        }`}
                      >
                        <div className="text-lg">{dest.flag}</div>
                        <div className="font-medium">{dest.countryCode}</div>
                        <div className="text-orange-600 mt-1">
                          {formatPercent(dest.marginAnalysis.effectiveTaxRate)}
                        </div>
                        <div className="text-[9px] text-muted-foreground">tax rate</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {countryTaxSummary?.notes && (
                <p className="text-[10px] text-muted-foreground italic">
                  ℹ️ {countryTaxSummary.notes}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  );
}
