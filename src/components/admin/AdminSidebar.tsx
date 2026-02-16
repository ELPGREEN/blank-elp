import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Mail, 
  FileText, 
  Globe, 
  Shield, 
  BarChart3, 
  Newspaper, 
  MessageSquare, 
  ShoppingCart, 
  PieChart, 
  Users, 
  Mountain,
  Menu,
  X,
  ChevronRight,
  FolderOpen,
  FileSignature,
  Settings,
  Calendar,
  Brain,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItem {
  id: string;
  labelKey: string;
  icon: typeof Layers;
  badge?: number;
  categoryKey?: string;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin: boolean;
  otrPendingCount?: number;
}

const navItems: NavItem[] = [
  { id: 'crm-pipeline', labelKey: 'admin.nav.crmPipeline', icon: Layers, categoryKey: 'admin.nav.principal' },
  { id: 'email-inbox', labelKey: 'admin.nav.emailInbox', icon: Mail, categoryKey: 'admin.nav.principal' },
  { id: 'partner-folders', labelKey: 'admin.nav.partnerFolders', icon: FolderOpen, categoryKey: 'admin.nav.principal' },
  { id: 'documents', labelKey: 'admin.nav.documents', icon: FileText, categoryKey: 'admin.nav.principal' },
  { id: 'meetings', labelKey: 'admin.nav.meetings', icon: Calendar, categoryKey: 'admin.nav.principal' },
  { id: 'report-generator', labelKey: 'admin.nav.reportGenerator', icon: FileText, categoryKey: 'admin.nav.principal' },
  { id: 'signed-documents', labelKey: 'admin.nav.signedDocuments', icon: FileSignature, categoryKey: 'admin.nav.principal' },
  { id: 'global-map', labelKey: 'admin.nav.globalMap', icon: Globe, categoryKey: 'admin.nav.principal' },
  { id: 'partner-levels', labelKey: 'admin.nav.partnerLevels', icon: Shield, categoryKey: 'admin.nav.principal' },
  { id: 'ai-hub', labelKey: 'admin.nav.aiHub', icon: Brain, categoryKey: 'admin.nav.tools' },
  { id: 'duo-intelligence', labelKey: 'admin.nav.duoIntelligence', icon: Sparkles, categoryKey: 'admin.nav.tools' },
  { id: 'intelligence-db', labelKey: 'admin.nav.intelligenceDb', icon: Globe, categoryKey: 'admin.nav.tools' },
  { id: 'aml-screening', labelKey: 'admin.nav.amlScreening', icon: Shield, categoryKey: 'admin.nav.tools' },
  { id: 'feasibility', labelKey: 'admin.nav.feasibility', icon: BarChart3, categoryKey: 'admin.nav.tools' },
  { id: 'otr-leads', labelKey: 'admin.nav.otrLeads', icon: Mountain, categoryKey: 'admin.nav.leads' },
  { id: 'marketplace', labelKey: 'admin.nav.marketplace', icon: ShoppingCart, categoryKey: 'admin.nav.leads' },
  { id: 'contacts', labelKey: 'admin.nav.contacts', icon: MessageSquare, categoryKey: 'admin.nav.leads' },
  { id: 'newsletter', labelKey: 'admin.nav.newsletter', icon: Mail, categoryKey: 'admin.nav.leads' },
  { id: 'articles', labelKey: 'admin.nav.articles', icon: FileText, categoryKey: 'admin.nav.content' },
  { id: 'press', labelKey: 'admin.nav.press', icon: Newspaper, categoryKey: 'admin.nav.content' },
  { id: 'counters', labelKey: 'admin.nav.counters', icon: BarChart3, categoryKey: 'admin.nav.settings' },
  { id: 'analytics', labelKey: 'admin.nav.analytics', icon: PieChart, categoryKey: 'admin.nav.settings' },
  { id: 'email-settings', labelKey: 'admin.nav.emailSettings', icon: Settings, categoryKey: 'admin.nav.settings' },
  { id: 'password-settings', labelKey: 'admin.nav.passwordSettings', icon: Lock, categoryKey: 'admin.nav.settings' },
];

export function AdminSidebar({ activeTab, onTabChange, isAdmin, otrPendingCount }: AdminSidebarProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const groupedItems = navItems.reduce((acc, item) => {
    const cat = item.categoryKey || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    if (isMobile) setMobileOpen(false);
  };

  const SidebarContent = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {Object.entries(groupedItems).map(([categoryKey, items]) => (
          <div key={categoryKey}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              {t(categoryKey, categoryKey.split('.').pop())}
            </h3>
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                const badgeCount = item.id === 'otr-leads' ? otrPendingCount : undefined;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-primary text-primary-foreground shadow-md"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{t(item.labelKey, item.labelKey.split('.').pop())}</span>
                    {badgeCount ? (
                      <span className="flex-shrink-0 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {badgeCount}
                      </span>
                    ) : isActive ? (
                      <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-60" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        
        {isAdmin && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              {t('admin.nav.settings', 'Administração')}
            </h3>
            <button
              onClick={() => handleTabChange('users')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                activeTab === 'users' && "bg-primary text-primary-foreground shadow-md"
              )}
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left">{t('admin.nav.users', 'Usuários')}</span>
              {activeTab === 'users' && <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-60" />}
            </button>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 h-12 w-12 rounded-full shadow-lg lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-72 bg-card border-r z-50 lg:hidden shadow-xl"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-bold text-lg">Menu</h2>
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 bg-card border-r h-[calc(100vh-4rem)] sticky top-16">
      <SidebarContent />
    </aside>
  );
}
