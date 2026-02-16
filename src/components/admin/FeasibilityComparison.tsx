import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  X,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface FeasibilityStudy {
  id: string;
  study_name: string;
  location: string | null;
  country: string | null;
  daily_capacity_tons: number;
  total_investment: number;
  annual_revenue: number;
  annual_opex: number;
  annual_ebitda: number;
  payback_months: number;
  roi_percentage: number;
  npv_10_years: number;
  irr_percentage: number;
  status: string;
}

interface FeasibilityComparisonProps {
  studies: FeasibilityStudy[];
}

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function FeasibilityComparison({ studies }: FeasibilityComparisonProps) {
  const { t } = useTranslation();
  const [selectedStudies, setSelectedStudies] = useState<string[]>([]);

  const selectedData = useMemo(() => {
    return studies.filter(s => selectedStudies.includes(s.id));
  }, [studies, selectedStudies]);

  const toggleStudy = (id: string) => {
    setSelectedStudies(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      if (prev.length >= 5) {
        return prev; // Max 5 studies
      }
      return [...prev, id];
    });
  };

  const comparisonBarData = useMemo(() => {
    if (selectedData.length === 0) return [];
    
    return [
      {
        metric: t('admin.feasibility.comparison.investment'),
        ...Object.fromEntries(selectedData.map((s, i) => [s.study_name, s.total_investment]))
      },
      {
        metric: t('admin.feasibility.comparison.revenue'),
        ...Object.fromEntries(selectedData.map((s, i) => [s.study_name, s.annual_revenue]))
      },
      {
        metric: t('admin.feasibility.comparison.ebitda'),
        ...Object.fromEntries(selectedData.map((s, i) => [s.study_name, s.annual_ebitda]))
      }
    ];
  }, [selectedData, t]);

  const radarData = useMemo(() => {
    if (selectedData.length === 0) return [];
    
    // Normalize metrics to 0-100 scale
    const maxValues = {
      roi: Math.max(...selectedData.map(s => s.roi_percentage), 1),
      irr: Math.max(...selectedData.map(s => s.irr_percentage), 1),
      capacity: Math.max(...selectedData.map(s => s.daily_capacity_tons), 1),
      npv: Math.max(...selectedData.map(s => Math.max(0, s.npv_10_years)), 1),
      payback: Math.max(...selectedData.map(s => 120 - Math.min(s.payback_months, 120)), 1)
    };

    const metrics = [
      { metric: 'ROI', fullMark: 100 },
      { metric: 'IRR', fullMark: 100 },
      { metric: t('admin.feasibility.dailyCapacity'), fullMark: 100 },
      { metric: 'NPV', fullMark: 100 },
      { metric: t('admin.feasibility.payback'), fullMark: 100 }
    ];

    return metrics.map(m => ({
      ...m,
      ...Object.fromEntries(selectedData.map(s => {
        let value = 0;
        switch (m.metric) {
          case 'ROI': value = (s.roi_percentage / maxValues.roi) * 100; break;
          case 'IRR': value = (s.irr_percentage / maxValues.irr) * 100; break;
          case t('admin.feasibility.dailyCapacity'): value = (s.daily_capacity_tons / maxValues.capacity) * 100; break;
          case 'NPV': value = (Math.max(0, s.npv_10_years) / maxValues.npv) * 100; break;
          case t('admin.feasibility.payback'): value = ((120 - Math.min(s.payback_months, 120)) / maxValues.payback) * 100; break;
        }
        return [s.study_name, value];
      }))
    }));
  }, [selectedData, t]);

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getComparisonIndicator = (values: number[], index: number, higherIsBetter: boolean = true) => {
    if (values.length < 2) return null;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const current = values[index];

    if (higherIsBetter) {
      if (current === max) return <TrendingUp className="h-4 w-4 text-green-500" />;
      if (current === min) return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      if (current === min) return <TrendingUp className="h-4 w-4 text-green-500" />;
      if (current === max) return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (studies.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('admin.feasibility.comparison.minStudies')}</h3>
          <p className="text-muted-foreground">{t('admin.feasibility.comparison.minStudiesDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Study Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4" />
            {t('admin.feasibility.comparison.selectStudies')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {studies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={selectedStudies.includes(study.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStudy(study.id)}
                  className="gap-2"
                  disabled={!selectedStudies.includes(study.id) && selectedStudies.length >= 5}
                >
                  {selectedStudies.includes(study.id) ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <div 
                      className="w-3 h-3 rounded-full border-2" 
                      style={{ borderColor: COLORS[selectedStudies.length % COLORS.length] }}
                    />
                  )}
                  {study.study_name}
                </Button>
              </motion.div>
            ))}
          </div>
          {selectedStudies.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('admin.feasibility.comparison.selectedCount', { count: selectedStudies.length })}
            </p>
          )}
        </CardContent>
      </Card>

      {selectedData.length >= 2 && (
        <>
          {/* Comparison Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('admin.feasibility.comparison.metricsTable')}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">{t('admin.feasibility.comparison.metric')}</th>
                    {selectedData.map((study, i) => (
                      <th key={study.id} className="text-center py-3 px-2 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          />
                          <span className="truncate max-w-24">{study.study_name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t('admin.feasibility.country')}</td>
                    {selectedData.map(s => (
                      <td key={s.id} className="text-center py-3 px-2">{s.country || '-'}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t('admin.feasibility.dailyCapacity')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {s.daily_capacity_tons} t/d
                          {getComparisonIndicator(selectedData.map(x => x.daily_capacity_tons), i)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="py-3 px-2 font-medium">{t('admin.feasibility.investment')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2 font-medium">
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(s.total_investment)}
                          {getComparisonIndicator(selectedData.map(x => x.total_investment), i, false)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t('admin.feasibility.revenue')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(s.annual_revenue)}
                          {getComparisonIndicator(selectedData.map(x => x.annual_revenue), i)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t('admin.feasibility.annualEbitda')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(s.annual_ebitda)}
                          {getComparisonIndicator(selectedData.map(x => x.annual_ebitda), i)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-primary/5">
                    <td className="py-3 px-2 font-medium">{t('admin.feasibility.roi')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2 font-bold text-primary">
                        <div className="flex items-center justify-center gap-1">
                          {s.roi_percentage.toFixed(1)}%
                          {getComparisonIndicator(selectedData.map(x => x.roi_percentage), i)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-green-500/5">
                    <td className="py-3 px-2 font-medium">{t('admin.feasibility.irr')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2 font-bold text-green-600">
                        <div className="flex items-center justify-center gap-1">
                          {s.irr_percentage.toFixed(1)}%
                          {getComparisonIndicator(selectedData.map(x => x.irr_percentage), i)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2">{t('admin.feasibility.payback')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {s.payback_months > 120 ? '> 10y' : `${s.payback_months}m`}
                          {getComparisonIndicator(selectedData.map(x => x.payback_months), i, false)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-muted/30">
                    <td className="py-3 px-2 font-medium">{t('admin.feasibility.npv10Years')}</td>
                    {selectedData.map((s, i) => (
                      <td key={s.id} className={`text-center py-3 px-2 font-bold ${s.npv_10_years >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(s.npv_10_years)}
                          {getComparisonIndicator(selectedData.map(x => x.npv_10_years), i)}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('admin.feasibility.comparison.financialComparison')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonBarData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                      <YAxis type="category" dataKey="metric" width={80} className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      {selectedData.map((study, i) => (
                        <Bar 
                          key={study.id} 
                          dataKey={study.study_name} 
                          fill={COLORS[i % COLORS.length]} 
                          radius={[0, 4, 4, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('admin.feasibility.comparison.performanceRadar')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-muted" />
                      <PolarAngleAxis dataKey="metric" className="text-xs" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                      {selectedData.map((study, i) => (
                        <Radar
                          key={study.id}
                          name={study.study_name}
                          dataKey={study.study_name}
                          stroke={COLORS[i % COLORS.length]}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.2}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendation */}
          <Card className="bg-gradient-to-br from-primary/5 to-emerald-500/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">{t('admin.feasibility.comparison.recommendation')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const best = [...selectedData].sort((a, b) => b.roi_percentage - a.roi_percentage)[0];
                      return t('admin.feasibility.comparison.recommendationText', { 
                        name: best?.study_name,
                        roi: best?.roi_percentage.toFixed(1),
                        payback: best?.payback_months
                      });
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
