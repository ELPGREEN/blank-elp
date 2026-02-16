import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Circle, Calculator, DollarSign, Scale, TrendingUp, RotateCcw } from 'lucide-react';

// ============================================
// OTR GIANT TIRE DATA - JANUARY 2026 (Validated from Michelin/Bridgestone/Goodyear databooks)
// Source: Nature/ScienceDirect pyrolysis studies, manufacturer specifications
// IMPORTANT: Each model has SPECIFIC composition - larger tires have MORE steel, LESS rubber
// ============================================
const otrTireModels = [
  // 27.00R49: Dump trucks ~100t - Michelin XDR2 ~1,800kg
  // Composition: Rubber 54-56%, Steel 24-26%, Textile 7-9%, rCB yield 10-15%
  { model: '27.00R49', applicationKey: 'dumpTrucks100t', weight: 1800, diameter: 2.7, composition: { rubber: 55, steel: 25, textile: 8, other: 12 }, recoverable: { granules: 990, steel: 450, textile: 144, rcb: 225 } },
  // 33.00R51: Dump trucks ~150t - Bridgestone V-Steel ~2,500kg
  // Composition: Rubber 53-55%, Steel 25-27%, Textile 6-8%, rCB yield 12-16%
  { model: '33.00R51', applicationKey: 'dumpTrucks150t', weight: 2500, diameter: 3.06, composition: { rubber: 54, steel: 26, textile: 7, other: 13 }, recoverable: { granules: 1350, steel: 650, textile: 175, rcb: 350 } },
  // 40.00R57: Dump trucks 200t+ - Michelin XDR3/Bridgestone ~3,700kg (CORRECTED from 4,000)
  // Composition: Rubber 52-54%, Steel 27-29%, Textile 5-7%, rCB yield 13-18%
  { model: '40.00R57', applicationKey: 'dumpTrucks200t', weight: 3700, diameter: 3.57, composition: { rubber: 53, steel: 28, textile: 6, other: 13 }, recoverable: { granules: 1961, steel: 1036, textile: 222, rcb: 555 } },
  // 46/90R57: Giant wheel loaders - Bridgestone VREV ~4,000kg
  // Composition: Rubber 51-53%, Steel 28-30%, Textile 5-7%, rCB yield 14-19%
  { model: '46/90R57', applicationKey: 'giantLoaders', weight: 4000, diameter: 3.56, composition: { rubber: 52, steel: 29, textile: 6, other: 13 }, recoverable: { granules: 2080, steel: 1160, textile: 240, rcb: 660 } },
  // 59/80R63: Ultra-class 400t+ - Michelin XDR4 ~5,350kg (CORRECTED from 6,500)
  // WORLD'S LARGEST TIRE - Composition: Rubber 50-52%, Steel 29-31%, Textile 4-6%, rCB yield 15-20%
  { model: '59/80R63', applicationKey: 'ultraClass400t', weight: 5350, diameter: 4.03, composition: { rubber: 51, steel: 30, textile: 5, other: 14 }, recoverable: { granules: 2728, steel: 1605, textile: 267, rcb: 936 } }
];

// Default real market prices - JANUARY 2026 (VALIDATED from multiple sources)
// Source: Recycler's World, American Recycler, commodity exchanges
// CRITICAL: These are RECOVERED material prices, not virgin material prices
const defaultMarketPrices = { 
  granules: { min: 200, max: 290, avg: 250 },  // Crumb rubber - 30% price volatility in 2025
  steel: { min: 150, max: 350, avg: 250 },     // CORRECTED: Tire-recovered wire is LOWER grade ($150-350, not $620+)
  textile: { min: 80, max: 200, avg: 120 },    // Low demand, high contamination
  rcb: { min: 900, max: 1200, avg: 1050 }      // Premium rCB from pyrolysis
};

export function OTRCompositionTable() {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState(otrTireModels[2].model);
  const [tireQuantity, setTireQuantity] = useState(100);
  
  // Initialize with real market prices
  const [customPrices, setCustomPrices] = useState({ 
    granules: defaultMarketPrices.granules.avg, 
    steel: defaultMarketPrices.steel.avg, 
    textile: defaultMarketPrices.textile.avg, 
    rcb: defaultMarketPrices.rcb.avg 
  });

  const resetToDefaultPrices = () => {
    setCustomPrices({
      granules: defaultMarketPrices.granules.avg,
      steel: defaultMarketPrices.steel.avg,
      textile: defaultMarketPrices.textile.avg,
      rcb: defaultMarketPrices.rcb.avg
    });
  };

  const formatNumber = (v: number) => new Intl.NumberFormat('en-US').format(Math.round(v));
  const formatCurrency = (v: number) => v >= 1000000 ? `$${(v/1000000).toFixed(2)}M` : v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${formatNumber(v)}`;

  const calculateTireValue = (tire: typeof otrTireModels[0], prices = customPrices) => {
    const granuleValue = (tire.recoverable.granules / 1000) * prices.granules;
    const steelValue = (tire.recoverable.steel / 1000) * prices.steel;
    const textileValue = (tire.recoverable.textile / 1000) * prices.textile;
    const rcbValue = (tire.recoverable.rcb / 1000) * prices.rcb;
    return { granuleValue, steelValue, textileValue, rcbValue, total: granuleValue + steelValue + textileValue + rcbValue };
  };

  const results = useMemo(() => {
    const tire = otrTireModels.find(t => t.model === selectedModel) || otrTireModels[2];
    const singleValue = calculateTireValue(tire);
    const totalWeight = (tire.weight * tireQuantity) / 1000;
    const totalGranules = (tire.recoverable.granules * tireQuantity) / 1000;
    const totalSteel = (tire.recoverable.steel * tireQuantity) / 1000;
    const totalTextile = (tire.recoverable.textile * tireQuantity) / 1000;
    const totalRcb = (tire.recoverable.rcb * tireQuantity) / 1000;
    const revGranules = totalGranules * customPrices.granules;
    const revSteel = totalSteel * customPrices.steel;
    const revTextile = totalTextile * customPrices.textile;
    const revRcb = totalRcb * customPrices.rcb;
    const totalRevenue = revGranules + revSteel + revTextile + revRcb;
    return { tire, singleValue, totalWeight, totalGranules, totalSteel, totalTextile, totalRcb, revGranules, revSteel, revTextile, revRcb, totalRevenue, revenuePerTon: totalRevenue / totalWeight };
  }, [selectedModel, tireQuantity, customPrices]);

  const materialLabels = {
    granules: t('admin.otr.materials.rubber', 'Rubber'),
    steel: t('admin.otr.materials.steel', 'Steel'),
    textile: t('admin.otr.materials.textile', 'Textile'),
    rcb: t('admin.otr.materials.rcb', 'rCB')
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Reference Header */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardHeader>
            <CardTitle className="text-xl">🛞 {t('admin.otr.compositionReference', 'OTR Giant Tire Composition Reference')}</CardTitle>
            <CardDescription className="text-slate-300">{t('admin.otr.realDataDate', 'Real data - January 2026')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {[
                { v: '50-55%', l: t('admin.otr.avgRubber', 'Avg Rubber'), c: 'text-emerald-400' }, 
                { v: '25-30%', l: materialLabels.steel, c: 'text-blue-400' }, 
                { v: '5-8%', l: materialLabels.textile, c: 'text-yellow-400' }, 
                { v: '10-18%', l: materialLabels.rcb, c: 'text-purple-400' }, 
                { v: '1.8-5.4t', l: t('admin.otr.weight', 'Weight'), c: 'text-orange-400' }
              ].map(i => (
                <div key={i.l} className="bg-white/10 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${i.c}`}>{i.v}</div>
                  <div className="text-xs text-slate-300">{i.l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Value Calculator */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              {t('admin.otr.valueCalculator', 'OTR Tire Value Calculator')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>{t('admin.otr.selectModel', 'Select Tire Model')}</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {otrTireModels.map(tire => (
                        <SelectItem key={tire.model} value={tire.model}>
                          <span className="font-mono">{tire.model}</span> 
                          <span className="text-muted-foreground ml-2">({t(`admin.otr.applications.${tire.applicationKey}`, tire.applicationKey)})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>{t('admin.otr.quantity', 'Quantity')}</Label>
                    <span className="font-bold text-primary">{tireQuantity}</span>
                  </div>
                  <Slider value={[tireQuantity]} onValueChange={v => setTireQuantity(v[0])} min={1} max={500} />
                </div>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('admin.otr.tireWeight', 'Tire Weight')}</span>
                    <span className="font-bold">{formatNumber(results.tire.weight)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.otr.totalWeight', 'Total Weight')}</span>
                    <span className="font-bold text-primary">{formatNumber(results.totalWeight)} {t('admin.otr.tons', 'tons')}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t('admin.otr.adjustPrices', 'Adjust Prices')} ($/ton)</Label>
                  <Button variant="ghost" size="sm" onClick={resetToDefaultPrices} className="text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {t('admin.otr.resetPrices', 'Reset')}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { k: 'granules', l: materialLabels.granules, c: 'emerald' }, 
                    { k: 'steel', l: materialLabels.steel, c: 'blue' }, 
                    { k: 'textile', l: materialLabels.textile, c: 'yellow' }, 
                    { k: 'rcb', l: materialLabels.rcb, c: 'purple' }
                  ].map(p => (
                    <div key={p.k}>
                      <Label className="text-xs flex items-center gap-1">
                        <Circle className={`h-2 w-2 fill-${p.c}-500 text-${p.c}-500`} />{p.l}
                      </Label>
                      <Input 
                        type="number" 
                        value={(customPrices as any)[p.k]} 
                        onChange={e => setCustomPrices(x => ({ ...x, [p.k]: Number(e.target.value) }))} 
                        className="mt-1" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {t('admin.otr.calculatedResults', 'Calculated Results')}
              </h4>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { l: materialLabels.granules, v: results.revGranules, tVal: results.totalGranules, p: customPrices.granules, c: 'emerald' }, 
                  { l: materialLabels.steel, v: results.revSteel, tVal: results.totalSteel, p: customPrices.steel, c: 'blue' }, 
                  { l: materialLabels.textile, v: results.revTextile, tVal: results.totalTextile, p: customPrices.textile, c: 'yellow' }, 
                  { l: materialLabels.rcb, v: results.revRcb, tVal: results.totalRcb, p: customPrices.rcb, c: 'purple' }
                ].map(r => (
                  <div key={r.l} className={`bg-${r.c}-50 dark:bg-${r.c}-950/30 rounded-lg p-3`}>
                    <div className={`text-xs text-${r.c}-600`}>{r.l}</div>
                    <div className={`text-lg font-bold text-${r.c}-700`}>{formatCurrency(r.v)}</div>
                    <div className="text-xs text-muted-foreground">{r.tVal.toFixed(1)}t @ ${r.p}</div>
                  </div>
                ))}
                <div className="bg-primary/10 rounded-lg p-3 border-2 border-primary/30">
                  <div className="text-xs text-primary">{t('admin.otr.total', 'Total')}</div>
                  <div className="text-xl font-bold text-primary">{formatCurrency(results.totalRevenue)}</div>
                  <div className="text-xs text-muted-foreground">${results.revenuePerTon.toFixed(0)}/{t('admin.otr.ton', 'ton')}</div>
                </div>
              </div>
              <div className="mt-4 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{t('admin.otr.valuePerTire', 'Value per Tire')} ({results.tire.model})</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(results.singleValue.total)}</div>
                </div>
                <Badge variant="outline">{t('admin.otr.marketDate', 'Jan 2026 Market')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Composition Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              {t('admin.otr.compositionByModel', 'Composition by OTR Model')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2">{t('admin.otr.model', 'Model')}</th>
                    <th className="text-left p-2">{t('admin.otr.application', 'Application')}</th>
                    <th className="text-center p-2">{t('admin.otr.weight', 'Weight')}</th>
                    <th className="text-center p-2">{materialLabels.granules}</th>
                    <th className="text-center p-2">{materialLabels.steel}</th>
                    <th className="text-center p-2">{materialLabels.textile}</th>
                    <th className="text-center p-2">{materialLabels.rcb}</th>
                    <th className="text-right p-2">{t('admin.otr.value', 'Value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {otrTireModels.map((tire, i) => {
                    const tv = calculateTireValue(tire);
                    return (
                      <tr 
                        key={tire.model} 
                        className={`${i % 2 === 0 ? 'bg-muted/20' : ''} ${tire.model === selectedModel ? 'ring-2 ring-primary ring-inset' : ''} cursor-pointer hover:bg-muted/40`} 
                        onClick={() => setSelectedModel(tire.model)}
                      >
                        <td className="p-2">
                          <Badge variant={tire.model === selectedModel ? "default" : "outline"} className="font-mono">{tire.model}</Badge>
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{t(`admin.otr.applications.${tire.applicationKey}`, tire.applicationKey)}</td>
                        <td className="p-2 text-center font-medium">{formatNumber(tire.weight)} kg</td>
                        <td className="p-2 text-center">
                          <div className="text-emerald-600 font-medium">{tire.composition.rubber}%</div>
                          <div className="text-xs text-muted-foreground">{formatNumber(tire.recoverable.granules)}kg</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="text-blue-600 font-medium">{tire.composition.steel}%</div>
                          <div className="text-xs text-muted-foreground">{formatNumber(tire.recoverable.steel)}kg</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="text-yellow-600 font-medium">{tire.composition.textile}%</div>
                          <div className="text-xs text-muted-foreground">{formatNumber(tire.recoverable.textile)}kg</div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="text-purple-600 font-medium">~{formatNumber(tire.recoverable.rcb)}kg</div>
                        </td>
                        <td className="p-2 text-right">
                          <Badge className="bg-primary">{formatCurrency(tv.total)}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Market Prices Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('admin.otr.marketPrices', 'Market Prices')} - {t('admin.otr.january2026', 'January 2026')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[
                { l: t('admin.otr.rubberGranules', 'Rubber Granules'), p: defaultMarketPrices.granules, c: 'emerald' }, 
                { l: t('admin.otr.recoveredSteel', 'Recovered Steel'), p: defaultMarketPrices.steel, c: 'blue' }, 
                { l: t('admin.otr.textileFiber', 'Textile Fiber'), p: defaultMarketPrices.textile, c: 'yellow' }, 
                { l: t('admin.otr.rcbCarbonBlack', 'rCB (Carbon Black)'), p: defaultMarketPrices.rcb, c: 'purple' }
              ].map(m => (
                <div key={m.l} className={`border rounded-lg p-4 ${m.c === 'purple' ? 'bg-purple-50 dark:bg-purple-950/20' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Circle className={`h-3 w-3 fill-${m.c}-500 text-${m.c}-500`} />
                    <span className="font-medium">{m.l}</span>
                  </div>
                  <div className={`text-2xl font-bold ${m.c === 'purple' ? 'text-purple-600' : ''}`}>${m.p.avg}/{t('admin.otr.ton', 'ton')}</div>
                  <div className="text-xs text-muted-foreground">{t('admin.otr.range', 'Range')}: ${m.p.min} - ${m.p.max}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
