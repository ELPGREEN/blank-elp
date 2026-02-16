import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Mail,
  Building2,
  User,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  Send,
  History,
  Clock,
  FileSignature,
  FileCheck,
  Share2,
  MoreVertical,
  ArrowLeft,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Partner {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  type: 'contact' | 'marketplace';
  created_at: string;
  lead_level: string | null;
  documents_count: number;
  last_activity: string | null;
}

interface LeadDocument {
  id: string;
  lead_id: string;
  lead_type: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

interface GeneratedDoc {
  id: string;
  document_name: string;
  document_type: string;
  created_at: string;
  is_signed: boolean;
  sent_at: string | null;
  sent_to_email: string | null;
  signer_name?: string | null;
  signer_email?: string | null;
  file_url?: string | null;
}

interface FormSubmission {
  id: string;
  type: 'contact' | 'marketplace';
  created_at: string;
  message?: string;
  subject?: string;
  channel?: string;
}

const documentTypeLabels: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  nda: { label: 'NDA', icon: FileSignature, color: 'bg-red-500/10 text-red-600' },
  kyc: { label: 'KYC', icon: FileCheck, color: 'bg-orange-500/10 text-orange-600' },
  contract: { label: 'Contrato', icon: FileText, color: 'bg-green-500/10 text-green-600' },
  proposal: { label: 'Proposta', icon: FileText, color: 'bg-blue-500/10 text-blue-600' },
  id_document: { label: 'Documento ID', icon: User, color: 'bg-purple-500/10 text-purple-600' },
  company_doc: { label: 'Doc. Empresa', icon: Building2, color: 'bg-indigo-500/10 text-indigo-600' },
  financial: { label: 'Financeiro', icon: FileText, color: 'bg-emerald-500/10 text-emerald-600' },
  other: { label: 'Outros', icon: FileText, color: 'bg-slate-500/10 text-slate-600' },
};

const leadLevelColors: Record<string, string> = {
  initial: 'bg-slate-100 text-slate-700',
  qualified: 'bg-blue-100 text-blue-700',
  negotiation: 'bg-amber-100 text-amber-700',
  partner: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export function PartnerDocumentFolders() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('other');
  const [uploadNotes, setUploadNotes] = useState('');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Fetch all partners (contacts + marketplace)
  const { data: partners, isLoading: partnersLoading } = useQuery({
    queryKey: ['partners-with-docs'],
    queryFn: async () => {
      const [contactsRes, marketplaceRes, docsRes] = await Promise.all([
        supabase.from('contacts').select('id, name, email, company, country, created_at, lead_level').order('created_at', { ascending: false }),
        supabase.from('marketplace_registrations').select('id, contact_name, email, company_name, country, created_at, lead_level').order('created_at', { ascending: false }),
        supabase.from('lead_documents').select('lead_id, created_at'),
      ]);

      const docCounts: Record<string, { count: number; last: string | null }> = {};
      docsRes.data?.forEach(doc => {
        if (!docCounts[doc.lead_id]) {
          docCounts[doc.lead_id] = { count: 0, last: null };
        }
        docCounts[doc.lead_id].count++;
        if (!docCounts[doc.lead_id].last || doc.created_at > docCounts[doc.lead_id].last!) {
          docCounts[doc.lead_id].last = doc.created_at;
        }
      });

      const allPartners: Partner[] = [];
      
      contactsRes.data?.forEach(c => allPartners.push({
        id: c.id,
        name: c.name,
        email: c.email,
        company: c.company,
        country: c.country,
        type: 'contact',
        created_at: c.created_at,
        lead_level: c.lead_level,
        documents_count: docCounts[c.id]?.count || 0,
        last_activity: docCounts[c.id]?.last || c.created_at,
      }));

      marketplaceRes.data?.forEach(m => allPartners.push({
        id: m.id,
        name: m.contact_name,
        email: m.email,
        company: m.company_name,
        country: m.country,
        type: 'marketplace',
        created_at: m.created_at,
        lead_level: m.lead_level,
        documents_count: docCounts[m.id]?.count || 0,
        last_activity: docCounts[m.id]?.last || m.created_at,
      }));

      return allPartners.sort((a, b) => new Date(b.last_activity || b.created_at).getTime() - new Date(a.last_activity || a.created_at).getTime());
    },
  });

  // Fetch documents for selected partner
  // Now includes documents signed by the partner (matching by signer_email)
  const { data: partnerDocs, isLoading: docsLoading } = useQuery({
    queryKey: ['partner-documents', selectedPartner?.id, selectedPartner?.email],
    queryFn: async () => {
      if (!selectedPartner) return { uploads: [], generated: [], submissions: [] };

      // Fetch documents linked by lead_id OR signed by the partner's email
      const [uploadsRes, generatedByIdRes, generatedByEmailRes] = await Promise.all([
        supabase.from('lead_documents').select('*').eq('lead_id', selectedPartner.id).order('created_at', { ascending: false }),
        supabase.from('generated_documents').select('id, document_name, document_type, created_at, is_signed, sent_at, sent_to_email, signer_name, signer_email, file_url').eq('lead_id', selectedPartner.id).order('created_at', { ascending: false }),
        // Also fetch documents signed by this partner (matching email)
        supabase.from('generated_documents').select('id, document_name, document_type, created_at, is_signed, sent_at, sent_to_email, signer_name, signer_email, file_url').eq('signer_email', selectedPartner.email).order('created_at', { ascending: false }),
      ]);

      // Combine and deduplicate generated documents
      const allGenerated = [...(generatedByIdRes.data || []), ...(generatedByEmailRes.data || [])];
      const uniqueGenerated = allGenerated.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );

      // Build form submissions history
      const submissions: FormSubmission[] = [{
        id: selectedPartner.id,
        type: selectedPartner.type,
        created_at: selectedPartner.created_at,
        message: 'Primeiro contato / cadastro inicial',
      }];

      return {
        uploads: (uploadsRes.data || []) as LeadDocument[],
        generated: uniqueGenerated as (GeneratedDoc & { signer_name?: string; signer_email?: string; file_url?: string })[],
        submissions,
      };
    },
    enabled: !!selectedPartner,
  });

  // Filtered partners
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.company?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [partners, searchTerm, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const all = partners || [];
    return {
      total: all.length,
      withDocs: all.filter(p => p.documents_count > 0).length,
      contacts: all.filter(p => p.type === 'contact').length,
      marketplace: all.filter(p => p.type === 'marketplace').length,
    };
  }, [partners]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !selectedPartner) throw new Error('Arquivo ou parceiro não selecionado');

      // Upload to Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${selectedPartner.id}/${Date.now()}_${uploadFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from('lead-documents').getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from('lead_documents').insert({
        lead_id: selectedPartner.id,
        lead_type: selectedPartner.type,
        document_type: uploadType,
        file_name: uploadFile.name,
        file_url: urlData.publicUrl,
        file_size: uploadFile.size,
        notes: uploadNotes || null,
        uploaded_by: user?.id,
      });

      if (dbError) throw dbError;

      // Send confirmation email to partner
      await supabase.functions.invoke('send-reply-email', {
        body: {
          to: selectedPartner.email,
          toName: selectedPartner.name,
          subject: 'Novo documento recebido - ELP Green',
          replyType: 'document_received',
          documentName: uploadFile.name,
          documentType: documentTypeLabels[uploadType]?.label || 'Documento',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-documents', selectedPartner?.id] });
      queryClient.invalidateQueries({ queryKey: ['partners-with-docs'] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadType('other');
      setUploadNotes('');
      toast({ title: 'Documento enviado!', description: 'O parceiro foi notificado por email.' });
    },
    onError: (error) => toast({ title: 'Erro ao enviar', description: String(error), variant: 'destructive' }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from('lead_documents').delete().eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-documents', selectedPartner?.id] });
      queryClient.invalidateQueries({ queryKey: ['partners-with-docs'] });
      setDeleteDocId(null);
      toast({ title: 'Documento excluído!' });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPartner) throw new Error('Parceiro não selecionado');

      // Save to admin_emails
      await supabase.from('admin_emails').insert({
        direction: 'outbound',
        from_email: 'noreply@elpgreen.com',
        from_name: 'ELP Green Technology',
        to_email: selectedPartner.email,
        to_name: selectedPartner.name,
        subject: emailSubject,
        body_text: emailMessage,
        body_html: `<div style="font-family: Arial, sans-serif;">${emailMessage.replace(/\n/g, '<br>')}</div>`,
        status: 'sent',
      });

      // Send via edge function
      await supabase.functions.invoke('send-reply-email', {
        body: {
          to: selectedPartner.email,
          toName: selectedPartner.name,
          subject: emailSubject,
          message: emailMessage,
          replyType: 'custom',
        },
      });
    },
    onSuccess: () => {
      setSendEmailDialogOpen(false);
      setEmailSubject('');
      setEmailMessage('');
      toast({ title: 'Email enviado!', description: `Enviado para ${selectedPartner?.email}` });
    },
    onError: (error) => toast({ title: 'Erro ao enviar email', description: String(error), variant: 'destructive' }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: 'Máximo 10MB', variant: 'destructive' });
        return;
      }
      setUploadFile(file);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render partner list
  const renderPartnerList = () => (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/20">
                <Folder className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-xs text-muted-foreground">{t('admin.partnerFolders.totalPartners')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-green-500/20">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.withDocs}</p>
                <p className="text-xs text-muted-foreground">{t('admin.partnerFolders.withDocuments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-purple-500/20">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.contacts}</p>
                <p className="text-xs text-muted-foreground">{t('admin.partnerFolders.contacts')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-amber-500/20">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.marketplace}</p>
                <p className="text-xs text-muted-foreground">{t('admin.partnerFolders.marketplace')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.partnerFolders.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.partnerFolders.allTypes')}</SelectItem>
            <SelectItem value="contact">{t('admin.partnerFolders.contacts')}</SelectItem>
            <SelectItem value="marketplace">{t('admin.partnerFolders.marketplace')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partner list */}
      <ScrollArea className="h-[500px] md:h-[600px]">
        <div className="space-y-2">
          {partnersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('admin.partnerFolders.noPartnerFound')}</p>
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
                  onClick={() => setSelectedPartner(partner)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        {partner.documents_count > 0 ? (
                          <FolderOpen className="h-6 w-6 text-primary" />
                        ) : (
                          <Folder className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{partner.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {partner.type === 'contact' ? 'Contato' : 'Marketplace'}
                          </Badge>
                          {partner.lead_level && (
                            <Badge className={leadLevelColors[partner.lead_level] || 'bg-slate-100'}>
                              {partner.lead_level}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{partner.email}</p>
                        {partner.company && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {partner.company}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <FileText className="h-4 w-4" />
                          {partner.documents_count}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(partner.last_activity || partner.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render partner folder
  const renderPartnerFolder = () => {
    if (!selectedPartner) return null;

    const allDocs = [
      ...(partnerDocs?.uploads || []).map(d => ({ ...d, source: 'upload' as const })),
      ...(partnerDocs?.generated || []).map(d => ({ 
        id: d.id, 
        file_name: d.document_name, 
        document_type: d.document_type,
        created_at: d.created_at,
        file_url: d.file_url || '', // Use the actual file_url from signed documents
        source: 'generated' as const,
        is_signed: d.is_signed,
        sent_at: d.sent_at,
        signer_name: d.signer_name,
        signer_email: d.signer_email,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPartner(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              {selectedPartner.name}
            </h2>
            <p className="text-sm text-muted-foreground">{selectedPartner.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSendEmailDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
            <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Partner info card */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Empresa</p>
                <p className="font-medium">{selectedPartner.company || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">País</p>
                <p className="font-medium">{selectedPartner.country || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant="outline">{selectedPartner.type === 'contact' ? 'Contato' : 'Marketplace'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Primeiro Contato</p>
                <p className="font-medium">{format(new Date(selectedPartner.created_at), 'dd/MM/yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos ({allDocs.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Formulários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-4">
            <ScrollArea className="h-[450px]">
              {docsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : allDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum documento nesta pasta</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar primeiro documento
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {allDocs.map((doc) => {
                    const typeInfo = documentTypeLabels[doc.document_type] || documentTypeLabels.other;
                    const Icon = typeInfo.icon;
                    return (
                      <Card key={doc.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{doc.file_name}</p>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {doc.source === 'upload' ? 'Upload' : 'Gerado'}
                                </Badge>
                                {'is_signed' in doc && doc.is_signed && (
                                  <Badge className="bg-green-100 text-green-700 text-xs">Assinado</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                {'signer_name' in doc && doc.signer_name && (
                                  <span className="ml-2 text-green-600">• Assinado por {doc.signer_name}</span>
                                )}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                                {doc.file_url && (
                                  <>
                                    <DropdownMenuItem asChild>
                                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visualizar
                                      </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <a href={doc.file_url} download>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </a>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Compartilhar
                                </DropdownMenuItem>
                                {doc.source === 'upload' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setDeleteDocId(doc.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[450px]">
              <div className="space-y-4">
                {allDocs.map((doc, i) => (
                  <div key={doc.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {i < allDocs.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">
                        {doc.source === 'upload' ? 'Documento enviado' : 'Documento gerado'}
                      </p>
                      <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Primeiro contato</p>
                    <p className="text-sm text-muted-foreground">Cadastro via {selectedPartner.type === 'contact' ? 'formulário' : 'marketplace'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(selectedPartner.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="submissions" className="mt-4">
            <ScrollArea className="h-[450px]">
              <div className="space-y-3">
                {partnerDocs?.submissions?.map((sub) => (
                  <Card key={sub.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {sub.type === 'contact' ? 'Formulário de Contato' : 'Registro Marketplace'}
                          </p>
                          <p className="text-sm text-muted-foreground">{sub.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(sub.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Recebido
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {selectedPartner ? (
          <motion.div
            key="folder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderPartnerFolder()}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {renderPartnerList()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Enviar Documento
            </DialogTitle>
            <DialogDescription>
              O parceiro receberá uma notificação por email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Documento</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {Object.entries(documentTypeLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo (máx. 10MB)</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                className="mt-1.5"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Notas internas sobre este documento..."
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => uploadMutation.mutate()} disabled={!uploadFile || uploadMutation.isPending}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Enviar Email para {selectedPartner?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Para</Label>
              <Input value={selectedPartner?.email || ''} disabled className="mt-1.5 bg-muted" />
            </div>
            <div>
              <Label>Assunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto do email..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="mt-1.5"
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => sendEmailMutation.mutate()} disabled={!emailSubject || !emailMessage || sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocId && deleteMutation.mutate(deleteDocId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
