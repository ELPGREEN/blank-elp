import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  FileCheck,
  FileSignature,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  DollarSign,
  Link,
  RefreshCw,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  phone: string | null;
  type: 'contact' | 'marketplace';
  lead_level: string;
  created_at: string;
}

interface PartnerProfile {
  id: string;
  lead_id: string;
  lead_type: string;
  company_linkedin: string | null;
  company_website: string | null;
  company_registration_number: string | null;
  annual_revenue: string | null;
  employees_count: string | null;
  industry_sector: string | null;
  project_description: string | null;
  investment_capacity: string | null;
  kyc_status: 'pending' | 'in_review' | 'approved' | 'rejected';
  kyc_documents: unknown[];
  nda_signed: boolean;
  nda_signed_at: string | null;
  nda_document_url: string | null;
  due_diligence_status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  due_diligence_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const getLevelConfig = (t: (key: string) => string) => ({
  initial: {
    level: 1,
    label: t('admin.partnerLevels.level1.title'),
    description: t('admin.partnerLevels.level1.description'),
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: UserPlus,
  },
  qualified: {
    level: 2,
    label: t('admin.partnerLevels.level2.title'),
    description: t('admin.partnerLevels.level2.description'),
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    icon: UserCheck,
  },
  project: {
    level: 3,
    label: t('admin.partnerLevels.level3.title'),
    description: t('admin.partnerLevels.level3.description'),
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: Shield,
  },
});

const getKycStatusConfig = (t: (key: string) => string) => ({
  pending: { label: t('admin.partnerLevels.kyc.pending'), color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  in_review: { label: t('admin.partnerLevels.kyc.inReview'), color: 'bg-blue-500/10 text-blue-600', icon: Eye },
  approved: { label: t('admin.partnerLevels.kyc.approved'), color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  rejected: { label: t('admin.partnerLevels.kyc.rejected'), color: 'bg-red-500/10 text-red-600', icon: XCircle },
});

const getDueDiligenceConfig = (t: (key: string) => string) => ({
  not_started: { label: t('admin.partnerLevels.dueDiligence.notStarted'), color: 'bg-slate-500/10 text-slate-600' },
  in_progress: { label: t('admin.partnerLevels.dueDiligence.inProgress'), color: 'bg-blue-500/10 text-blue-600' },
  completed: { label: t('admin.partnerLevels.dueDiligence.completed'), color: 'bg-emerald-500/10 text-emerald-600' },
  failed: { label: t('admin.partnerLevels.dueDiligence.failed'), color: 'bg-red-500/10 text-red-600' },
});

export function PartnerLevels() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get translated configs
  const levelConfig = getLevelConfig(t);
  const kycStatusConfig = getKycStatusConfig(t);
  const dueDiligenceConfig = getDueDiligenceConfig(t);

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState<Partial<PartnerProfile>>({});

  // Fetch leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ['partner-leads'],
    queryFn: async () => {
      const allLeads: Lead[] = [];

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, company, country, lead_level, created_at')
        .neq('channel', 'otr-source-indication')
        .order('created_at', { ascending: false });

      contacts?.forEach(c => {
        allLeads.push({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          country: c.country,
          phone: null,
          type: 'contact',
          lead_level: c.lead_level || 'initial',
          created_at: c.created_at,
        });
      });

      const { data: marketplace } = await supabase
        .from('marketplace_registrations')
        .select('id, contact_name, email, company_name, country, phone, lead_level, created_at')
        .order('created_at', { ascending: false });

      marketplace?.forEach(m => {
        allLeads.push({
          id: m.id,
          name: m.contact_name,
          email: m.email,
          company: m.company_name,
          country: m.country,
          phone: m.phone,
          type: 'marketplace',
          lead_level: m.lead_level || 'initial',
          created_at: m.created_at,
        });
      });

      return allLeads;
    },
  });

  // Fetch partner profile for selected lead
  const { data: partnerProfile } = useQuery({
    queryKey: ['partner-profile', selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead) return null;
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        kyc_status: data.kyc_status as PartnerProfile['kyc_status'],
        due_diligence_status: data.due_diligence_status as PartnerProfile['due_diligence_status'],
        kyc_documents: Array.isArray(data.kyc_documents) ? data.kyc_documents : [],
      } as PartnerProfile;
    },
    enabled: !!selectedLead,
  });

  // Filter leads
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesLevel = levelFilter === 'all' || lead.lead_level === levelFilter;
      
      return matchesSearch && matchesLevel;
    });
  }, [leads, searchTerm, levelFilter]);

  // Group by level
  const leadsByLevel = useMemo(() => ({
    initial: filteredLeads.filter(l => l.lead_level === 'initial'),
    qualified: filteredLeads.filter(l => l.lead_level === 'qualified'),
    project: filteredLeads.filter(l => l.lead_level === 'project'),
  }), [filteredLeads]);

  // Stats
  const stats = useMemo(() => {
    const all = leads || [];
    return {
      total: all.length,
      level1: all.filter(l => l.lead_level === 'initial').length,
      level2: all.filter(l => l.lead_level === 'qualified').length,
      level3: all.filter(l => l.lead_level === 'project').length,
    };
  }, [leads]);

  const handleOpenProfile = (lead: Lead) => {
    setSelectedLead(lead);
    setProfileOpen(true);
    setEditMode(false);
  };

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!selectedLead) return;

      // Build a clean profile data object without kyc_documents
      const { kyc_documents, ...formWithoutDocs } = profileForm as Record<string, unknown>;
      
      const profileData = {
        lead_id: selectedLead.id,
        lead_type: selectedLead.type,
        company_linkedin: (formWithoutDocs.company_linkedin as string) || null,
        company_website: (formWithoutDocs.company_website as string) || null,
        company_registration_number: (formWithoutDocs.company_registration_number as string) || null,
        annual_revenue: (formWithoutDocs.annual_revenue as string) || null,
        employees_count: (formWithoutDocs.employees_count as string) || null,
        industry_sector: (formWithoutDocs.industry_sector as string) || null,
        project_description: (formWithoutDocs.project_description as string) || null,
        investment_capacity: (formWithoutDocs.investment_capacity as string) || null,
      };

      if (partnerProfile) {
        const { error } = await supabase
          .from('partner_profiles')
          .update({
            company_linkedin: profileData.company_linkedin,
            company_website: profileData.company_website,
            company_registration_number: profileData.company_registration_number,
            annual_revenue: profileData.annual_revenue,
            employees_count: profileData.employees_count,
            industry_sector: profileData.industry_sector,
            project_description: profileData.project_description,
            investment_capacity: profileData.investment_capacity,
          })
          .eq('id', partnerProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('partner_profiles')
          .insert({
            lead_id: profileData.lead_id,
            lead_type: profileData.lead_type,
            company_linkedin: profileData.company_linkedin,
            company_website: profileData.company_website,
            company_registration_number: profileData.company_registration_number,
            annual_revenue: profileData.annual_revenue,
            employees_count: profileData.employees_count,
            industry_sector: profileData.industry_sector,
            project_description: profileData.project_description,
            investment_capacity: profileData.investment_capacity,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', selectedLead?.id] });
      setEditMode(false);
      toast({ title: 'Perfil salvo com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar perfil', variant: 'destructive' });
    },
  });

  // Update lead level mutation
  const updateLevelMutation = useMutation({
    mutationFn: async ({ lead, newLevel }: { lead: Lead; newLevel: string }) => {
      const table = lead.type === 'marketplace' ? 'marketplace_registrations' : 'contacts';
      const { error } = await supabase
        .from(table)
        .update({ lead_level: newLevel })
        .eq('id', lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-leads'] });
      toast({ title: 'Nível atualizado!' });
    },
  });

  // Update KYC status mutation
  const updateKYCMutation = useMutation({
    mutationFn: async ({ profileId, status, rejectionReason }: { profileId: string; status: string; rejectionReason?: string }) => {
      const updates: Record<string, unknown> = { kyc_status: status };
      if (status === 'approved') {
        updates.verified_by = user?.id;
        updates.verified_at = new Date().toISOString();
      }
      if (status === 'rejected' && rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('partner_profiles')
        .update(updates)
        .eq('id', profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-profile', selectedLead?.id] });
      toast({ title: 'Status KYC atualizado!' });
    },
  });

  // Calculate completion percentage
  const getCompletionPercentage = (profile: PartnerProfile | null): number => {
    if (!profile) return 0;
    
    let completed = 0;
    const fields = [
      profile.company_linkedin,
      profile.company_website,
      profile.company_registration_number,
      profile.annual_revenue,
      profile.employees_count,
      profile.industry_sector,
      profile.project_description,
      profile.investment_capacity,
    ];
    
    fields.forEach(f => { if (f) completed++; });
    
    // Add KYC and NDA
    if (profile.kyc_status === 'approved') completed += 2;
    if (profile.nda_signed) completed += 2;
    if (profile.due_diligence_status === 'completed') completed += 2;
    
    return Math.round((completed / 14) * 100);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.partnerLevels.totalPartners')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-slate-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.partnerLevels.level1.title')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.level1}</p>
              </div>
              <UserPlus className="h-6 w-6 md:h-8 md:w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.partnerLevels.level2.title')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.level2}</p>
              </div>
              <UserCheck className="h-6 w-6 md:h-8 md:w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.partnerLevels.level3.title')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.level3}</p>
              </div>
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.partnerLevels.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-60"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.partnerLevels.allLevels')}</SelectItem>
              <SelectItem value="initial">{t('admin.partnerLevels.level1.title')}</SelectItem>
              <SelectItem value="qualified">{t('admin.partnerLevels.level2.title')}</SelectItem>
              <SelectItem value="project">{t('admin.partnerLevels.level3.title')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Level Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {Object.entries(levelConfig).map(([key, config]) => {
          const levelLeads = leadsByLevel[key as keyof typeof leadsByLevel];
          const Icon = config.icon;
          
          return (
            <Card key={key} className="border-t-4" style={{ borderTopColor: key === 'initial' ? '#3b82f6' : key === 'qualified' ? '#a855f7' : '#10b981' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-base">{config.label}</CardTitle>
                  </div>
                  <Badge variant="secondary">{levelLeads.length}</Badge>
                </div>
                <CardDescription className="text-xs">{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px]">
                  <div className="space-y-2">
                    {levelLeads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleOpenProfile(lead)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{lead.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{lead.company || lead.email}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                    {levelLeads.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {t('admin.partnerLevels.noPartnerInLevel')}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Partner Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Perfil de Parceiro
              </span>
              {selectedLead && (
                <Badge className={levelConfig[selectedLead.lead_level as keyof typeof levelConfig]?.color || ''}>
                  {levelConfig[selectedLead.lead_level as keyof typeof levelConfig]?.label || 'Nível 1'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="company">Empresa (Nível 2)</TabsTrigger>
              <TabsTrigger value="kyc">KYC (Nível 3)</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nome</Label>
                      <p className="font-medium">{selectedLead?.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Email</Label>
                      <p className="font-medium">{selectedLead?.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Empresa</Label>
                      <p className="font-medium">{selectedLead?.company || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">País</Label>
                      <p className="font-medium">{selectedLead?.country || '-'}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Label className="text-muted-foreground text-xs mb-2 block">Alterar Nível</Label>
                    <Select
                      value={selectedLead?.lead_level || 'initial'}
                      onValueChange={(value) => selectedLead && updateLevelMutation.mutate({ lead: selectedLead, newLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Nível 1 - Básico</SelectItem>
                        <SelectItem value="qualified">Nível 2 - Avançado</SelectItem>
                        <SelectItem value="project">Nível 3 - Qualificado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Company Info Tab (Level 2) */}
            <TabsContent value="company" className="space-y-4">
              {partnerProfile ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Informações da Empresa</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {getCompletionPercentage(partnerProfile)}% completo
                        </span>
                        <Progress value={getCompletionPercentage(partnerProfile)} className="w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1"><Link className="h-3 w-3" /> LinkedIn</Label>
                        <Input
                          value={editMode ? profileForm.company_linkedin || '' : partnerProfile.company_linkedin || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, company_linkedin: e.target.value })}
                          disabled={!editMode}
                          placeholder="linkedin.com/company/..."
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
                        <Input
                          value={editMode ? profileForm.company_website || '' : partnerProfile.company_website || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, company_website: e.target.value })}
                          disabled={!editMode}
                          placeholder="www.empresa.com"
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Building2 className="h-3 w-3" /> CNPJ/Registro</Label>
                        <Input
                          value={editMode ? profileForm.company_registration_number || '' : partnerProfile.company_registration_number || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, company_registration_number: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Setor</Label>
                        <Input
                          value={editMode ? profileForm.industry_sector || '' : partnerProfile.industry_sector || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, industry_sector: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Faturamento Anual</Label>
                        <Input
                          value={editMode ? profileForm.annual_revenue || '' : partnerProfile.annual_revenue || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, annual_revenue: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Funcionários</Label>
                        <Input
                          value={editMode ? profileForm.employees_count || '' : partnerProfile.employees_count || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, employees_count: e.target.value })}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Descrição do Projeto / Interesse</Label>
                      <Textarea
                        value={editMode ? profileForm.project_description || '' : partnerProfile.project_description || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, project_description: e.target.value })}
                        disabled={!editMode}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label>Capacidade de Investimento</Label>
                      <Input
                        value={editMode ? profileForm.investment_capacity || '' : partnerProfile.investment_capacity || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, investment_capacity: e.target.value })}
                        disabled={!editMode}
                        placeholder="Ex: USD 500k - 1M"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Perfil de empresa ainda não preenchido</p>
                    <Button className="mt-4" onClick={() => { setEditMode(true); setProfileForm({}); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Perfil
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* KYC Tab (Level 3) */}
            <TabsContent value="kyc" className="space-y-4">
              {partnerProfile ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Status KYC
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const config = kycStatusConfig[partnerProfile.kyc_status];
                            const Icon = config.icon;
                            return (
                              <>
                                <Icon className="h-6 w-6" />
                                <div>
                                  <p className="font-medium">Status: {config.label}</p>
                                  {partnerProfile.verified_at && (
                                    <p className="text-sm text-muted-foreground">
                                      Verificado em {format(new Date(partnerProfile.verified_at), 'dd/MM/yyyy', { locale: ptBR })}
                                    </p>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <Badge className={kycStatusConfig[partnerProfile.kyc_status].color}>
                          {kycStatusConfig[partnerProfile.kyc_status].label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileSignature className="h-6 w-6" />
                          <div>
                            <p className="font-medium">NDA Assinado</p>
                            {partnerProfile.nda_signed_at && (
                              <p className="text-sm text-muted-foreground">
                                Em {format(new Date(partnerProfile.nda_signed_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={partnerProfile.nda_signed}
                          onCheckedChange={(checked) => {
                            // Update NDA status
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-6 w-6" />
                          <div>
                            <p className="font-medium">Due Diligence</p>
                            <p className="text-sm text-muted-foreground">
                              {dueDiligenceConfig[partnerProfile.due_diligence_status].label}
                            </p>
                          </div>
                        </div>
                        <Badge className={dueDiligenceConfig[partnerProfile.due_diligence_status].color}>
                          {dueDiligenceConfig[partnerProfile.due_diligence_status].label}
                        </Badge>
                      </div>

                      {partnerProfile.kyc_status !== 'approved' && (
                        <div className="flex gap-2 pt-4">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => updateKYCMutation.mutate({ profileId: partnerProfile.id, status: 'in_review' })}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Em Análise
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => updateKYCMutation.mutate({ profileId: partnerProfile.id, status: 'approved' })}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Aprovar KYC
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Complete o perfil da empresa (Nível 2) primeiro</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending}>
                  {saveProfileMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => { setEditMode(true); setProfileForm(partnerProfile || {}); }}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
