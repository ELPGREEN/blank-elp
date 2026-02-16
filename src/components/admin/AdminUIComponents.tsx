import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
};

export function AdminStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend = 'neutral',
  trendValue,
  color = 'primary' 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full ${colorClasses[color]} opacity-20`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {trendValue && (
              <span className={`text-xs font-medium ${
                trend === 'up' ? 'text-emerald-600' : 
                trend === 'down' ? 'text-destructive' : 
                'text-muted-foreground'
              }`}>
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trendValue}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminSectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

const getStatusConfig = (t: (key: string) => string): Record<string, { label: string; className: string }> => ({
  new: { label: t('admin.status.new'), className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
  pending: { label: t('admin.status.pending'), className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  contacted: { label: t('admin.status.contacted'), className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' },
  qualified: { label: t('admin.status.qualified'), className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  converted: { label: t('admin.status.converted'), className: 'bg-primary/10 text-primary border-primary/20' },
  approved: { label: t('admin.status.approved'), className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  rejected: { label: t('admin.status.rejected'), className: 'bg-destructive/10 text-destructive border-destructive/20' },
  replied: { label: t('admin.status.replied'), className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
});

export function AdminStatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
