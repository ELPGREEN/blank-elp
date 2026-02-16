import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Users,
  Mail,
  FileText,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
}

interface LeadWorkflowProps {
  leadType: 'contact' | 'marketplace';
  currentStatus: string;
  leadLevel?: string;
}

export function LeadWorkflow({ leadType, currentStatus, leadLevel }: LeadWorkflowProps) {
  const { t } = useTranslation();
  
  const getWorkflowSteps = (): WorkflowStep[] => {
    if (leadType === 'marketplace') {
      return [
        {
          id: 'pending',
          label: t('admin.workflow.marketplace.pending'),
          description: t('admin.workflow.marketplace.pendingDesc'),
          status: getStepStatus('pending', currentStatus, ['pending', 'contacted', 'qualified', 'converted']),
          icon: <Users className="h-4 w-4" />,
        },
        {
          id: 'contacted',
          label: t('admin.workflow.marketplace.contacted'),
          description: t('admin.workflow.marketplace.contactedDesc'),
          status: getStepStatus('contacted', currentStatus, ['contacted', 'qualified', 'converted']),
          icon: <Mail className="h-4 w-4" />,
        },
        {
          id: 'qualified',
          label: t('admin.workflow.marketplace.qualified'),
          description: t('admin.workflow.marketplace.qualifiedDesc'),
          status: getStepStatus('qualified', currentStatus, ['qualified', 'converted']),
          icon: <Star className="h-4 w-4" />,
        },
        {
          id: 'converted',
          label: t('admin.workflow.marketplace.converted'),
          description: t('admin.workflow.marketplace.convertedDesc'),
          status: getStepStatus('converted', currentStatus, ['converted']),
          icon: <TrendingUp className="h-4 w-4" />,
        },
      ];
    } else {
      return [
        {
          id: 'new',
          label: t('admin.workflow.contact.new'),
          description: t('admin.workflow.contact.newDesc'),
          status: getStepStatus('new', currentStatus, ['new', 'in_progress', 'responded', 'closed']),
          icon: <Users className="h-4 w-4" />,
        },
        {
          id: 'in_progress',
          label: t('admin.workflow.contact.inProgress'),
          description: t('admin.workflow.contact.inProgressDesc'),
          status: getStepStatus('in_progress', currentStatus, ['in_progress', 'responded', 'closed']),
          icon: <Clock className="h-4 w-4" />,
        },
        {
          id: 'responded',
          label: t('admin.workflow.contact.responded'),
          description: t('admin.workflow.contact.respondedDesc'),
          status: getStepStatus('responded', currentStatus, ['responded', 'closed']),
          icon: <Mail className="h-4 w-4" />,
        },
        {
          id: 'closed',
          label: t('admin.workflow.contact.closed'),
          description: t('admin.workflow.contact.closedDesc'),
          status: getStepStatus('closed', currentStatus, ['closed']),
          icon: <CheckCircle2 className="h-4 w-4" />,
        },
      ];
    }
  };

  const steps = getWorkflowSteps();
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('admin.workflow.progress')}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Lead Level Badge */}
      {leadLevel && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('admin.workflow.leadLevel')}:</span>
          <Badge variant={
            leadLevel === 'hot' ? 'destructive' :
            leadLevel === 'warm' ? 'default' : 'secondary'
          }>
            {leadLevel === 'hot' ? `🔥 ${t('admin.workflow.hot')}` :
             leadLevel === 'warm' ? `🌡️ ${t('admin.workflow.warm')}` : `❄️ ${t('admin.workflow.cold')}`}
          </Badge>
        </div>
      )}

      {/* Workflow Steps */}
      <TooltipProvider>
        <div className="flex items-center justify-between gap-1">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all cursor-pointer
                      ${step.status === 'completed' 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : step.status === 'current'
                        ? 'bg-primary border-primary text-primary-foreground animate-pulse'
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                      }
                    `}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </TooltipContent>
              </Tooltip>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                  step.status === 'completed' ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                }`} />
              )}
            </div>
          ))}
        </div>
      </TooltipProvider>

      {/* Current Step Label */}
      <div className="text-center">
        <Badge variant="outline" className="text-xs">
          {t('admin.workflow.currentStep')}: {steps.find(s => s.status === 'current')?.label || steps[steps.length - 1]?.label}
        </Badge>
      </div>
    </div>
  );
}

function getStepStatus(
  stepId: string, 
  currentStatus: string, 
  progressionOrder: string[]
): 'completed' | 'current' | 'pending' {
  const currentIndex = progressionOrder.indexOf(currentStatus);
  const stepIndex = progressionOrder.indexOf(stepId);

  if (currentIndex === -1) return 'pending';
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

interface PartnerLevelWorkflowProps {
  kycStatus?: string;
  ndaSigned?: boolean;
  verified?: boolean;
}

export function PartnerLevelWorkflow({ kycStatus, ndaSigned, verified }: PartnerLevelWorkflowProps) {
  const { t } = useTranslation();
  
  const steps = [
    {
      id: 'basic',
      label: t('admin.partnerLevels.level1.title'),
      description: t('admin.workflow.partner.basicDesc'),
      completed: true,
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'advanced',
      label: t('admin.partnerLevels.level2.title'),
      description: t('admin.workflow.partner.advancedDesc'),
      completed: kycStatus === 'submitted' || kycStatus === 'approved' || ndaSigned,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'verified',
      label: t('admin.partnerLevels.level3.title'),
      description: t('admin.workflow.partner.verifiedDesc'),
      completed: verified && ndaSigned && kycStatus === 'approved',
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          {t('admin.workflow.partner.verificationStatus')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('admin.workflow.partner.completion')}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                step.completed ? 'bg-emerald-500/10' : 'bg-muted/50'
              }`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${step.completed 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-muted-foreground/20 text-muted-foreground'
                }
              `}>
                {step.completed ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {step.completed && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  ✓
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStatsProps {
  stats: {
    label: string;
    value: number;
    change?: number;
    icon: React.ReactNode;
    color: string;
  }[];
}

export function QuickStats({ stats }: QuickStatsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`${stat.color} border-0 overflow-hidden`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  {stat.change !== undefined && (
                    <p className={`text-xs mt-1 ${stat.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.change >= 0 ? '+' : ''}{stat.change}% {t('admin.workflow.vsPreviousMonth')}
                    </p>
                  )}
                </div>
                <div className="opacity-50">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
