import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Building2,
  Mail,
  Calendar,
  Search,
  Filter,
  MessageSquare,
  Target,
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  StarOff,
  Edit,
  Package,
  Layers,
  Bell,
  Upload,
  FileText,
  Trash2,
  CalendarClock,
  AlertTriangle,
  Download,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LeadAIAnalysis } from './LeadAIAnalysis';
import { BatchLeadAnalysis } from './BatchLeadAnalysis';

// Unified Lead Interface
interface UnifiedLead {
  id: string;
  type: 'contact' | 'marketplace' | 'otr';
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  country: string | null;
  message: string | null;
  status: string;
  lead_level: string;
  priority: string;
  channel: string | null;
  created_at: string;
  next_action: string | null;
  next_action_date: string | null;
  company_type?: string;
  products_interest?: string[];
  estimated_volume?: string | null;
}

interface LeadNote {
  id: string;
  contact_id: string;
  note: string;
  note_type: string;
  created_at: string;
}

interface LeadDocument {
  id: string;
  lead_id: string;
  lead_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  document_type: string;
  notes: string | null;
  created_at: string;
}

// Pipeline stage configuration - will use translations
const getPipelineStages = (t: (key: string) => string) => ({
  initial: {
    label: t('admin.crm.stages.initial.label'),
    description: t('admin.crm.stages.initial.description'),
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    icon: Users,
  },
  qualified: {
    label: t('admin.crm.stages.qualified.label'),
    description: t('admin.crm.stages.qualified.description'),
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    icon: Briefcase,
  },
  project: {
    label: t('admin.crm.stages.project.label'),
    description: t('admin.crm.stages.project.description'),
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: Target,
  },
});

const getPriorityConfig = (t: (key: string) => string) => ({
  low: { label: t('admin.crm.priority.low'), color: 'bg-slate-500/10 text-slate-600 border-slate-500/30', icon: StarOff },
  medium: { label: t('admin.crm.priority.medium'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Star },
  high: { label: t('admin.crm.priority.high'), color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: Star },
  urgent: { label: t('admin.crm.priority.urgent'), color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertCircle },
});

const getTypeConfig = (t: (key: string) => string) => ({
  contact: { label: t('admin.crm.types.contact'), color: 'bg-blue-500', icon: MessageSquare },
  marketplace: { label: t('admin.crm.types.marketplace'), color: 'bg-purple-500', icon: Package },
  otr: { label: t('admin.crm.types.otr'), color: 'bg-emerald-500', icon: Target },
});

const getDocumentTypeConfig = (t: (key: string) => string) => ({
  nda: { label: 'NDA', color: 'bg-red-500/10 text-red-600' },
  contract: { label: t('admin.crm.docTypes.contract'), color: 'bg-green-500/10 text-green-600' },
  proposal: { label: t('admin.crm.docTypes.proposal'), color: 'bg-blue-500/10 text-blue-600' },
  business_plan: { label: t('admin.crm.docTypes.businessPlan'), color: 'bg-purple-500/10 text-purple-600' },
  loi: { label: 'LOI', color: 'bg-amber-500/10 text-amber-600' },
  other: { label: t('admin.crm.docTypes.other'), color: 'bg-slate-500/10 text-slate-600' },
});

// Helper to check reminder status
const getReminderStatus = (nextActionDate: string | null, t: (key: string) => string) => {
  if (!nextActionDate) return null;
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffDays = Math.ceil((actionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: 'overdue', label: t('admin.crm.reminders.overdue'), color: 'bg-red-500 text-white', icon: AlertTriangle };
  if (diffDays === 0) return { status: 'today', label: t('admin.crm.reminders.today'), color: 'bg-orange-500 text-white', icon: AlertCircle };
  if (diffDays <= 3) return { status: 'soon', label: `${diffDays}d`, color: 'bg-amber-500 text-white', icon: Clock };
  return { status: 'scheduled', label: `${diffDays}d`, color: 'bg-slate-500/50 text-slate-700', icon: CalendarClock };
};

export function CRMPipeline() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get translated configs
  const pipelineStages = getPipelineStages(t);
  const priorityConfig = getPriorityConfig(t);
  const typeConfig = getTypeConfig(t);
  const documentTypeConfig = getDocumentTypeConfig(t);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [reminderFilter, setReminderFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [activeTab, setActiveTab] = useState('info');
  
  // Follow-up editing
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  
  // Document upload
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('other');
  const [docNotes, setDocNotes] = useState('');

  // Fetch contacts
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch marketplace registrations
  const { data: marketplace, isLoading: marketplaceLoading } = useQuery({
    queryKey: ['crm-marketplace'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch lead notes for selected lead
  const { data: leadNotes } = useQuery({
    queryKey: ['lead-notes', selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead) return [];
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('contact_id', selectedLead.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LeadNote[];
    },
    enabled: !!selectedLead,
  });

  // Fetch lead documents for selected lead
  const { data: leadDocuments } = useQuery({
    queryKey: ['lead-documents', selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead) return [];
      const { data, error } = await supabase
        .from('lead_documents')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LeadDocument[];
    },
    enabled: !!selectedLead,
  });

  // Real-time subscriptions
  useEffect(() => {
    const contactsChannel = supabase
      .channel('crm-contacts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      })
      .subscribe();

    const marketplaceChannel = supabase
      .channel('crm-marketplace-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_registrations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm-marketplace'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(marketplaceChannel);
    };
  }, [queryClient]);

  // Reset follow-up form when lead changes
  useEffect(() => {
    if (selectedLead) {
      setNextAction(selectedLead.next_action || '');
      setNextActionDate(selectedLead.next_action_date ? selectedLead.next_action_date.split('T')[0] : '');
    }
  }, [selectedLead]);

  // Unify all leads
  const unifiedLeads = useMemo(() => {
    const leads: UnifiedLead[] = [];

    contacts?.filter(c => c.channel !== 'otr-source-indication').forEach(contact => {
      leads.push({
        id: contact.id,
        type: 'contact',
        name: contact.name,
        email: contact.email,
        company: contact.company,
        phone: null,
        country: contact.country,
        message: contact.message,
        status: contact.status || 'new',
        lead_level: contact.lead_level || 'initial',
        priority: contact.priority || 'medium',
        channel: contact.channel,
        created_at: contact.created_at,
        next_action: contact.next_action,
        next_action_date: contact.next_action_date,
      });
    });

    contacts?.filter(c => c.channel === 'otr-source-indication').forEach(contact => {
      leads.push({
        id: contact.id,
        type: 'otr',
        name: contact.name,
        email: contact.email,
        company: contact.company,
        phone: null,
        country: contact.country,
        message: contact.message,
        status: contact.status || 'pending',
        lead_level: contact.lead_level || 'initial',
        priority: contact.priority || 'medium',
        channel: contact.channel,
        created_at: contact.created_at,
        next_action: contact.next_action,
        next_action_date: contact.next_action_date,
      });
    });

    marketplace?.forEach(reg => {
      leads.push({
        id: reg.id,
        type: 'marketplace',
        name: reg.contact_name,
        email: reg.email,
        company: reg.company_name,
        phone: reg.phone,
        country: reg.country,
        message: reg.message,
        status: reg.status || 'pending',
        lead_level: reg.lead_level || 'initial',
        priority: reg.priority || 'medium',
        channel: 'marketplace',
        created_at: reg.created_at,
        next_action: reg.next_action,
        next_action_date: reg.next_action_date,
        company_type: reg.company_type,
        products_interest: reg.products_interest,
        estimated_volume: reg.estimated_volume,
      });
    });

    return leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [contacts, marketplace]);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return unifiedLeads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesType = typeFilter === 'all' || lead.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      
      // Reminder filter
      let matchesReminder = true;
      if (reminderFilter !== 'all') {
        const reminder = getReminderStatus(lead.next_action_date, t);
        if (reminderFilter === 'overdue') matchesReminder = reminder?.status === 'overdue';
        else if (reminderFilter === 'today') matchesReminder = reminder?.status === 'today';
        else if (reminderFilter === 'soon') matchesReminder = reminder?.status === 'soon' || reminder?.status === 'today';
        else if (reminderFilter === 'none') matchesReminder = !reminder;
      }
      
      return matchesSearch && matchesType && matchesPriority && matchesReminder;
    });
  }, [unifiedLeads, searchTerm, typeFilter, priorityFilter, reminderFilter]);

  // Group leads by pipeline stage
  const pipelineLeads = useMemo(() => {
    return {
      initial: filteredLeads.filter(l => l.lead_level === 'initial'),
      qualified: filteredLeads.filter(l => l.lead_level === 'qualified'),
      project: filteredLeads.filter(l => l.lead_level === 'project'),
    };
  }, [filteredLeads]);

  // Update lead level mutation
  const updateLeadLevelMutation = useMutation({
    mutationFn: async ({ lead, newLevel }: { lead: UnifiedLead; newLevel: string }) => {
      const table = lead.type === 'marketplace' ? 'marketplace_registrations' : 'contacts';
      const { error } = await supabase
        .from(table)
        .update({ lead_level: newLevel })
        .eq('id', lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-marketplace'] });
      toast({ title: 'Nível do lead atualizado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar lead', variant: 'destructive' });
    },
  });

  // Update lead priority mutation
  const updateLeadPriorityMutation = useMutation({
    mutationFn: async ({ lead, newPriority }: { lead: UnifiedLead; newPriority: string }) => {
      const table = lead.type === 'marketplace' ? 'marketplace_registrations' : 'contacts';
      const { error } = await supabase
        .from(table)
        .update({ priority: newPriority })
        .eq('id', lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-marketplace'] });
      toast({ title: 'Prioridade atualizada!' });
    },
  });

  // Update follow-up mutation
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({ lead, nextAction, nextActionDate }: { lead: UnifiedLead; nextAction: string; nextActionDate: string }) => {
      const table = lead.type === 'marketplace' ? 'marketplace_registrations' : 'contacts';
      const { error } = await supabase
        .from(table)
        .update({ 
          next_action: nextAction || null, 
          next_action_date: nextActionDate ? new Date(nextActionDate).toISOString() : null 
        })
        .eq('id', lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm-marketplace'] });
      setEditingFollowUp(false);
      toast({ title: 'Follow-up atualizado!' });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ contactId, note, noteType }: { contactId: string; note: string; noteType: string }) => {
      const { error } = await supabase
        .from('lead_notes')
        .insert({
          contact_id: contactId,
          note,
          note_type: noteType,
          user_id: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes', selectedLead?.id] });
      setNewNote('');
      toast({ title: 'Nota adicionada!' });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, lead, docType, notes }: { file: File; lead: UnifiedLead; docType: string; notes: string }) => {
      setUploadingDoc(true);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${lead.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lead-documents')
        .getPublicUrl(fileName);
      
      // Save document record
      const { error: insertError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: lead.id,
          lead_type: lead.type === 'marketplace' ? 'marketplace' : 'contact',
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          document_type: docType,
          notes: notes || null,
          uploaded_by: user?.id,
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-documents', selectedLead?.id] });
      setDocNotes('');
      setSelectedDocType('other');
      setUploadingDoc(false);
      toast({ title: 'Documento enviado!' });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      setUploadingDoc(false);
      toast({ title: 'Erro ao enviar documento', variant: 'destructive' });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (doc: LeadDocument) => {
      // Delete from storage
      const filePath = doc.file_url.split('/lead-documents/')[1];
      if (filePath) {
        await supabase.storage.from('lead-documents').remove([filePath]);
      }
      
      // Delete record
      const { error } = await supabase
        .from('lead_documents')
        .delete()
        .eq('id', doc.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-documents', selectedLead?.id] });
      toast({ title: 'Documento excluído!' });
    },
  });

  const handleAddNote = () => {
    if (!selectedLead || !newNote.trim()) return;
    addNoteMutation.mutate({
      contactId: selectedLead.id,
      note: newNote,
      noteType,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLead) return;
    
    uploadDocumentMutation.mutate({
      file,
      lead: selectedLead,
      docType: selectedDocType,
      notes: docNotes,
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveFollowUp = () => {
    if (!selectedLead) return;
    updateFollowUpMutation.mutate({
      lead: selectedLead,
      nextAction,
      nextActionDate,
    });
  };

  const openDetails = (lead: UnifiedLead) => {
    setSelectedLead(lead);
    setDetailsOpen(true);
    setActiveTab('info');
  };

  // Statistics
  const stats = useMemo(() => {
    const overdueCount = unifiedLeads.filter(l => {
      const reminder = getReminderStatus(l.next_action_date, t);
      return reminder?.status === 'overdue';
    }).length;
    
    const todayCount = unifiedLeads.filter(l => {
      const reminder = getReminderStatus(l.next_action_date, t);
      return reminder?.status === 'today';
    }).length;
    
    return {
      total: unifiedLeads.length,
      initial: pipelineLeads.initial.length,
      qualified: pipelineLeads.qualified.length,
      project: pipelineLeads.project.length,
      urgent: unifiedLeads.filter(l => l.priority === 'urgent').length,
      overdue: overdueCount,
      todayReminders: todayCount,
    };
  }, [unifiedLeads, pipelineLeads]);

  const isLoading = contactsLoading || marketplaceLoading;

  const LeadCard = ({ lead }: { lead: UnifiedLead }) => {
    const TypeIcon = typeConfig[lead.type].icon;
    const PriorityIcon = priorityConfig[lead.priority as keyof typeof priorityConfig]?.icon || Star;
    const reminder = getReminderStatus(lead.next_action_date, t);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow relative"
        onClick={() => openDetails(lead)}
      >
        {/* Reminder Badge */}
        {reminder && (
          <div className={`absolute -top-2 -right-2 ${reminder.color} text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm`}>
            <reminder.icon className="h-3 w-3" />
            {reminder.label}
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${typeConfig[lead.type].color}`} />
            <span className="font-medium text-sm truncate max-w-[150px]">{lead.name}</span>
          </div>
          <Badge variant="outline" className={priorityConfig[lead.priority as keyof typeof priorityConfig]?.color || ''}>
            <PriorityIcon className="h-3 w-3" />
          </Badge>
        </div>
        
        {lead.company && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <Building2 className="h-3 w-3" />
            {lead.company}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </p>
        
        {lead.next_action && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 bg-muted/50 p-1.5 rounded">
            <CalendarClock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.next_action}</span>
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {typeConfig[lead.type].label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </motion.div>
    );
  };

  const PipelineColumn = ({ stage, leads }: { stage: keyof typeof pipelineStages; leads: UnifiedLead[] }) => {
    const config = pipelineStages[stage];
    const StageIcon = config.icon;
    
    return (
      <div className="flex-1 min-w-[300px] bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${config.color}`}>
              <StageIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{config.label}</h3>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
        
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-3">
            <AnimatePresence>
              {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </AnimatePresence>
            {leads.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum lead neste estágio
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <div>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.total')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <div>
                <p className="text-xl md:text-2xl font-bold">{stats.initial}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.initial')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              <div>
                <p className="text-xl md:text-2xl font-bold">{stats.qualified}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.qualified')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
              <div>
                <p className="text-xl md:text-2xl font-bold">{stats.project}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.projects')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
              <div>
                <p className="text-xl md:text-2xl font-bold">{stats.urgent}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.urgentLeads')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={stats.overdue > 0 ? 'border-red-500/50 bg-red-500/5' : ''}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 md:h-5 md:w-5 ${stats.overdue > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
              <div>
                <p className={`text-xl md:text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.overdueLeads')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={stats.todayReminders > 0 ? 'border-orange-500/50 bg-orange-500/5' : ''}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2">
              <Bell className={`h-4 w-4 md:h-5 md:w-5 ${stats.todayReminders > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
              <div>
                <p className={`text-xl md:text-2xl font-bold ${stats.todayReminders > 0 ? 'text-orange-600' : ''}`}>{stats.todayReminders}</p>
                <p className="text-xs text-muted-foreground">{t('admin.crm.todayReminders')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.crm.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('admin.crm.allTypes')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.crm.allTypes')}</SelectItem>
                  <SelectItem value="contact">{t('admin.crm.types.contact')}</SelectItem>
                  <SelectItem value="marketplace">{t('admin.crm.types.marketplace')}</SelectItem>
                  <SelectItem value="otr">{t('admin.crm.types.otr')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('admin.crm.allPriorities')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.crm.allPriorities')}</SelectItem>
                  <SelectItem value="urgent">{t('admin.crm.priority.urgent')}</SelectItem>
                  <SelectItem value="high">{t('admin.crm.priority.high')}</SelectItem>
                  <SelectItem value="medium">{t('admin.crm.priority.medium')}</SelectItem>
                  <SelectItem value="low">{t('admin.crm.priority.low')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={reminderFilter} onValueChange={setReminderFilter}>
                <SelectTrigger className="w-full">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('admin.crm.allReminders')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.crm.allReminders')}</SelectItem>
                  <SelectItem value="overdue">{t('admin.crm.filterOverdue')}</SelectItem>
                  <SelectItem value="today">{t('admin.crm.filterToday')}</SelectItem>
                  <SelectItem value="soon">{t('admin.crm.filterNone')}</SelectItem>
                  <SelectItem value="none">{t('admin.crm.filterNone')}</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'pipeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('pipeline')}
                  className="flex-1"
                >
                  <Layers className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{t('admin.crm.pipeline')}</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{t('admin.crm.list')}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch AI Analysis Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>Análise de IA disponível para {unifiedLeads.filter(l => l.message).length} leads com mensagem</span>
        </div>
        <Dialog>
          <DialogContent className="max-w-lg">
            <BatchLeadAnalysis 
              leads={unifiedLeads.map(l => ({
                id: l.id,
                type: l.type === 'marketplace' ? 'marketplace' : 'contact',
                name: l.name,
                email: l.email,
                message: l.message,
                priority: l.priority,
                lead_level: l.lead_level
              }))}
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
                queryClient.invalidateQueries({ queryKey: ['crm-marketplace'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          <PipelineColumn stage="initial" leads={pipelineLeads.initial} />
          <PipelineColumn stage="qualified" leads={pipelineLeads.qualified} />
          <PipelineColumn stage="project" leads={pipelineLeads.project} />
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
              {filteredLeads.map(lead => {
                const TypeIcon = typeConfig[lead.type].icon;
                const reminder = getReminderStatus(lead.next_action_date, t);
                
                return (
                  <div
                    key={lead.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => openDetails(lead)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${typeConfig[lead.type].color}/10`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lead.name}</span>
                            {lead.company && (
                              <span className="text-muted-foreground">• {lead.company}</span>
                            )}
                            {reminder && (
                              <Badge className={reminder.color}>
                                <reminder.icon className="h-3 w-3 mr-1" />
                                {reminder.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                          {lead.next_action && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <CalendarClock className="h-3 w-3 inline mr-1" />
                              {lead.next_action}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={pipelineStages[lead.lead_level as keyof typeof pipelineStages]?.color}>
                          {pipelineStages[lead.lead_level as keyof typeof pipelineStages]?.label || 'Inicial'}
                        </Badge>
                        <Badge variant="secondary">
                          {typeConfig[lead.type].label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {filteredLeads.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  {t('admin.crm.noLeadsInStage')}
                </div>
              )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Lead Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeConfig[selectedLead.type].color}/10`}>
                    {(() => {
                      const TypeIcon = typeConfig[selectedLead.type].icon;
                      return <TypeIcon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="flex items-center gap-2">
                      {selectedLead.name}
                      {getReminderStatus(selectedLead.next_action_date, t) && (
                        <Badge className={getReminderStatus(selectedLead.next_action_date, t)!.color}>
                          {getReminderStatus(selectedLead.next_action_date, t)!.label}
                        </Badge>
                      )}
                    </DialogTitle>
                    <DialogDescription>{selectedLead.company || selectedLead.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="ai" className="gap-1">
                    <Brain className="h-3 w-3" />
                    IA
                  </TabsTrigger>
                  <TabsTrigger value="followup">Follow-up</TabsTrigger>
                  <TabsTrigger value="documents">
                    Docs
                    {leadDocuments && leadDocuments.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5">{leadDocuments.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="notes">
                    Notas
                    {leadNotes && leadNotes.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5">{leadNotes.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedLead.email}</p>
                    </div>
                    {selectedLead.phone && (
                      <div>
                        <Label className="text-muted-foreground">Telefone</Label>
                        <p className="font-medium">{selectedLead.phone}</p>
                      </div>
                    )}
                    {selectedLead.country && (
                      <div>
                        <Label className="text-muted-foreground">País</Label>
                        <p className="font-medium">{selectedLead.country}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-muted-foreground">Tipo</Label>
                      <Badge className={`${typeConfig[selectedLead.type].color} text-white`}>
                        {typeConfig[selectedLead.type].label}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-2 block">Estágio do Pipeline</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(pipelineStages).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={selectedLead.lead_level === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateLeadLevelMutation.mutate({ lead: selectedLead, newLevel: key })}
                          disabled={updateLeadLevelMutation.isPending}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Prioridade</Label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <Button
                          key={key}
                          variant={selectedLead.priority === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateLeadPriorityMutation.mutate({ lead: selectedLead, newPriority: key })}
                          className={selectedLead.priority === key ? config.color : ''}
                        >
                          {config.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {selectedLead.message && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground">Mensagem</Label>
                        <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                          {selectedLead.message}
                        </p>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* AI Analysis Tab */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                  <LeadAIAnalysis
                    leadId={selectedLead.id}
                    leadType={selectedLead.type === 'marketplace' ? 'marketplace' : 'contact'}
                    message={selectedLead.message}
                    currentPriority={selectedLead.priority}
                    currentLevel={selectedLead.lead_level}
                    onApplySuggestions={(priority, level) => {
                      updateLeadPriorityMutation.mutate({ lead: selectedLead, newPriority: priority });
                      updateLeadLevelMutation.mutate({ lead: selectedLead, newLevel: level });
                    }}
                  />
                </TabsContent>

                {/* Follow-up Tab */}
                <TabsContent value="followup" className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CalendarClock className="h-5 w-5" />
                        Próxima Ação
                      </CardTitle>
                      <CardDescription>
                        Configure lembretes para follow-up com este lead
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!editingFollowUp && selectedLead.next_action ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                          {getReminderStatus(selectedLead.next_action_date, t) && (
                              <Badge className={getReminderStatus(selectedLead.next_action_date, t)!.color}>
                                {getReminderStatus(selectedLead.next_action_date, t)!.label}
                              </Badge>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{selectedLead.next_action}</p>
                              {selectedLead.next_action_date && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {new Date(selectedLead.next_action_date).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" onClick={() => setEditingFollowUp(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label>Ação</Label>
                            <Textarea
                              placeholder="Ex: Enviar proposta comercial, Agendar reunião, Enviar NDA..."
                              value={nextAction}
                              onChange={(e) => setNextAction(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Data</Label>
                            <Input
                              type="date"
                              value={nextActionDate}
                              onChange={(e) => setNextActionDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveFollowUp} disabled={updateFollowUpMutation.isPending}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Salvar
                            </Button>
                            {editingFollowUp && (
                              <Button variant="outline" onClick={() => setEditingFollowUp(false)}>
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Upload de Documentos
                      </CardTitle>
                      <CardDescription>
                        Anexe NDA, contratos, propostas e outros documentos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tipo de Documento</Label>
                          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(documentTypeConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>{config.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Notas (opcional)</Label>
                          <Input
                            placeholder="Descrição do documento..."
                            value={docNotes}
                            onChange={(e) => setDocNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingDoc}
                        className="w-full"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingDoc ? 'Enviando...' : 'Selecionar Arquivo'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        PDF, DOC, DOCX, PNG, JPG (máx. 50MB)
                      </p>
                    </CardContent>
                  </Card>

                  {/* Document List */}
                  <div className="space-y-3">
                    {leadDocuments?.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${documentTypeConfig[doc.document_type as keyof typeof documentTypeConfig]?.color || 'bg-slate-100'}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline">
                                {documentTypeConfig[doc.document_type as keyof typeof documentTypeConfig]?.label || doc.document_type}
                              </Badge>
                              <span>{new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
                              {doc.file_size && (
                                <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span>
                              )}
                            </div>
                            {doc.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteDocumentMutation.mutate(doc)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    
                    {(!leadDocuments || leadDocuments.length === 0) && (
                      <p className="text-center text-muted-foreground text-sm py-8">
                        Nenhum documento anexado
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-6 mt-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Adicionar uma nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note">Nota</SelectItem>
                          <SelectItem value="call">Ligação</SelectItem>
                          <SelectItem value="email_sent">Email</SelectItem>
                          <SelectItem value="meeting">Reunião</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddNote} disabled={!newNote.trim() || addNoteMutation.isPending}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {leadNotes?.map(note => (
                        <div key={note.id} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">{note.note_type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(note.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm">{note.note}</p>
                        </div>
                      ))}
                      {(!leadNotes || leadNotes.length === 0) && (
                        <p className="text-center text-muted-foreground text-sm py-8">
                          Nenhuma nota ainda
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
