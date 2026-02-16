import { motion } from 'framer-motion';
import { MessageSquare, ShoppingCart, Mail, FileText, Newspaper, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface AdminStatsGridProps {
  totalContacts: number;
  newContacts: number;
  totalMarketplace: number;
  pendingMarketplace: number;
  totalSubscribers: number;
  totalArticles: number;
  totalPress: number;
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
  emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
  purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-600 dark:text-purple-400',
  rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20 text-rose-600 dark:text-rose-400',
};

const iconBgMap = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function AdminStatsGrid({
  totalContacts,
  newContacts,
  totalMarketplace,
  pendingMarketplace,
  totalSubscribers,
  totalArticles,
  totalPress,
}: AdminStatsGridProps) {
  const { t } = useTranslation();

  const stats = [
    { 
      title: t('admin.statsGrid.contacts', 'Contatos'), 
      value: totalContacts, 
      subtitle: `${newContacts} ${t('admin.statsGrid.new', 'novos')}`, 
      icon: MessageSquare, 
      color: 'blue' as const 
    },
    { 
      title: t('admin.statsGrid.marketplace', 'Marketplace'), 
      value: totalMarketplace, 
      subtitle: `${pendingMarketplace} ${t('admin.statsGrid.pending', 'pendentes')}`, 
      icon: ShoppingCart, 
      color: 'emerald' as const 
    },
    { 
      title: t('admin.statsGrid.newsletter', 'Newsletter'), 
      value: totalSubscribers, 
      subtitle: t('admin.statsGrid.subscribers', 'assinantes'), 
      icon: Mail, 
      color: 'amber' as const 
    },
    { 
      title: t('admin.statsGrid.articles', 'Artigos'), 
      value: totalArticles, 
      subtitle: t('admin.statsGrid.published', 'publicados'), 
      icon: FileText, 
      color: 'purple' as const 
    },
    { 
      title: t('admin.statsGrid.press', 'Press'), 
      value: totalPress, 
      subtitle: t('admin.statsGrid.releases', 'releases'), 
      icon: Newspaper, 
      color: 'rose' as const 
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "relative p-4 rounded-xl border bg-gradient-to-br overflow-hidden",
              colorMap[stat.color]
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-lg", iconBgMap[stat.color])}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="font-medium">{stat.title}</span>
              <span className="mx-1">·</span>
              <span>{stat.subtitle}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
