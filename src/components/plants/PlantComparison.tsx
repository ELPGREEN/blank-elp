import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Recycle, Flame, Factory, Truck, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

const plantData = [
  {
    id: 'tire-recycling',
    icon: Recycle,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-500',
    capacity: '2-10 ton/h',
    investment: 'USD 5.8M+',
    payback: '55 meses',
    roi: '85%',
    area: '20,000+ m²',
    products: ['Grânulos de Borracha', 'Fibras Têxteis', 'Aço Recuperado'],
    applications: ['Asfalto ecológico', 'Gramados sintéticos', 'Pisos industriais'],
    highlights: ['100% automatizada', 'Vida útil 20+ anos', 'CE / ISO 12100'],
    path: '/plants/tire-recycling'
  },
  {
    id: 'pyrolysis',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-500',
    capacity: '10-50 ton/dia',
    investment: 'USD 7.8M+',
    payback: '36 meses',
    roi: '95%',
    area: '15,000+ m²',
    products: ['Óleo Pirolítico', 'Negro de Fumo (rCB)', 'Gás de Síntese'],
    applications: ['Combustível industrial', 'Indústria de borracha', 'Autoconsumo'],
    highlights: ['Zero emissões', 'Autossuficiente', 'Operação 24/7'],
    path: '/plants/pyrolysis'
  },
  {
    id: 'otr',
    icon: Truck,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-500',
    capacity: '10-20 ton/h',
    investment: 'USD 8M+',
    payback: '34 meses',
    roi: '35%',
    area: '10,000+ m²',
    products: ['Blocos de Borracha', 'Aço de Alta Qualidade', 'Fibras Têxteis'],
    applications: ['TDF', 'Pirólise', 'Granulação'],
    highlights: ['Pneus até 4,5 ton', 'Diâmetro 4500mm', 'PLC + SCADA'],
    path: '/plants/otr'
  }
];

const comparisonMetrics = [
  { key: 'capacity', label: 'Capacidade' },
  { key: 'investment', label: 'Investimento' },
  { key: 'payback', label: 'Payback' },
  { key: 'roi', label: 'ROI Anual' },
  { key: 'area', label: 'Área Necessária' },
];

export function PlantComparison() {
  const { t } = useTranslation();
  const [expandedPlant, setExpandedPlant] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return (
    <section className="py-20">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('plants.comparison.title', 'Compare Nossas Soluções')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('plants.comparison.subtitle', 'Encontre a planta ideal para suas necessidades de reciclagem e valorização de resíduos')}
          </p>
        </motion.div>

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            {t('plants.comparison.cardsView', 'Cards')}
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            {t('plants.comparison.tableView', 'Tabela')}
          </Button>
        </div>

        {/* Cards View */}
        {viewMode === 'cards' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plantData.map((plant, index) => (
              <motion.div
                key={plant.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard 
                  className={cn(
                    "h-full p-6 cursor-pointer transition-all duration-300",
                    expandedPlant === plant.id ? "ring-2 ring-primary" : "hover:border-primary/50"
                  )}
                  onClick={() => setExpandedPlant(expandedPlant === plant.id ? null : plant.id)}
                >
                  {/* Header */}
                  <div className={cn("p-3 rounded-xl w-fit mb-4", plant.bgColor)}>
                    <plant.icon className={cn("h-8 w-8", plant.textColor)} />
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2">
                    {t(`plants.${plant.id}.title`, plant.id === 'tire-recycling' ? 'Reciclagem de Pneus' : 
                       plant.id === 'pyrolysis' ? 'Pirólise Contínua' : 
                       plant.id === 'msw' ? 'Tratamento de RSU' : 'Reciclagem OTR')}
                  </h3>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-muted-foreground">ROI</div>
                      <div className={cn("font-bold", plant.textColor)}>{plant.roi}</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <div className="text-xs text-muted-foreground">Payback</div>
                      <div className="font-bold">{plant.payback}</div>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">{t('plants.comparison.capacity', 'Capacidade')}</span>
                    <span className="font-medium">{plant.capacity}</span>
                  </div>

                  {/* Expand Button */}
                  <div className="flex items-center justify-center text-muted-foreground text-sm">
                    {expandedPlant === plant.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="ml-1">
                      {expandedPlant === plant.id 
                        ? t('plants.comparison.showLess', 'Menos detalhes')
                        : t('plants.comparison.showMore', 'Mais detalhes')}
                    </span>
                  </div>

                  {/* Expanded Content */}
                  {expandedPlant === plant.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      {/* Investment */}
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{t('plants.comparison.investment', 'Investimento')}</span>
                        <span className="font-medium">{plant.investment}</span>
                      </div>

                      {/* Area */}
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">{t('plants.comparison.area', 'Área')}</span>
                        <span className="font-medium">{plant.area}</span>
                      </div>

                      {/* Products */}
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">{t('plants.comparison.products', 'Produtos')}</div>
                        <div className="space-y-1">
                          {plant.products.map((product) => (
                            <div key={product} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className={cn("h-3 w-3", plant.textColor)} />
                              {product}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">{t('plants.comparison.highlights', 'Destaques')}</div>
                        <div className="flex flex-wrap gap-1">
                          {plant.highlights.map((highlight) => (
                            <span 
                              key={highlight}
                              className={cn("text-xs px-2 py-1 rounded-full", plant.bgColor, plant.textColor)}
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <Link to={plant.path}>
                        <Button 
                          className={cn("w-full bg-gradient-to-r", plant.color)}
                        >
                          {t('plants.comparison.viewDetails', 'Ver Detalhes')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto"
          >
            <GlassCard className="p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-semibold">{t('plants.comparison.metric', 'Métrica')}</th>
                    {plantData.map((plant) => (
                      <th key={plant.id} className="text-center p-4">
                        <div className="flex flex-col items-center gap-2">
                          <div className={cn("p-2 rounded-lg", plant.bgColor)}>
                            <plant.icon className={cn("h-5 w-5", plant.textColor)} />
                          </div>
                          <span className="font-semibold text-sm">
                            {t(`plants.${plant.id}.title`, plant.id)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetrics.map((metric, index) => (
                    <tr 
                      key={metric.key}
                      className={cn(
                        "border-t border-border",
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      )}
                    >
                      <td className="p-4 font-medium text-muted-foreground">{metric.label}</td>
                      {plantData.map((plant) => (
                        <td key={plant.id} className="text-center p-4">
                          <span className={cn(
                            "font-semibold",
                            metric.key === 'roi' && plant.textColor
                          )}>
                            {plant[metric.key as keyof typeof plant] as string}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/30">
                    <td className="p-4 font-medium">{t('plants.comparison.actions', 'Ações')}</td>
                    {plantData.map((plant) => (
                      <td key={plant.id} className="text-center p-4">
                        <Link to={plant.path}>
                          <Button 
                            size="sm"
                            className={cn("bg-gradient-to-r", plant.color)}
                          >
                            {t('plants.comparison.details', 'Detalhes')}
                          </Button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </section>
  );
}
