import { useState, useMemo, useRef } from 'react';
import { SITE_URLS } from '@/lib/siteConfig';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  MailOpen,
  Send,
  Reply,
  Archive,
  Search,
  Filter,
  Star,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag,
  Paperclip,
  RefreshCw,
  Eye,
  FileText,
  X,
  Check,
  Upload,
  Share2,
  Link2,
  ClipboardList,
  Loader2,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CollaborativeDocumentDialog } from './CollaborativeDocumentDialog';

interface Email {
  id: string;
  direction: 'inbound' | 'outbound';
  from_email: string;
  from_name: string | null;
  to_email: string;
  to_name: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  status: 'unread' | 'read' | 'replied' | 'archived';
  tags: string[];
  created_at: string;
  read_at: string | null;
  replied_at: string | null;
  attachments?: unknown[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject_pt: string;
  subject_en: string;
  body_pt: string;
  body_en: string;
  category: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
}

const tagColors: Record<string, string> = {
  'Investidor': 'bg-emerald-500/10 text-emerald-600',
  'Parceiro China': 'bg-red-500/10 text-red-600',
  'Reciclagem Pneus': 'bg-blue-500/10 text-blue-600',
  'Pirólise': 'bg-purple-500/10 text-purple-600',
  'OTR': 'bg-amber-500/10 text-amber-600',
  'Urgente': 'bg-red-600/20 text-red-700',
};

const autoTags = [
  { keyword: 'investidor', tag: 'Investidor' },
  { keyword: 'investor', tag: 'Investidor' },
  { keyword: 'investment', tag: 'Investidor' },
  { keyword: 'china', tag: 'Parceiro China' },
  { keyword: '中国', tag: 'Parceiro China' },
  { keyword: 'pneu', tag: 'Reciclagem Pneus' },
  { keyword: 'tire', tag: 'Reciclagem Pneus' },
  { keyword: 'tyre', tag: 'Reciclagem Pneus' },
  { keyword: 'piról', tag: 'Pirólise' },
  { keyword: 'pyrolysis', tag: 'Pirólise' },
  { keyword: 'otr', tag: 'OTR' },
  { keyword: 'mining', tag: 'OTR' },
  { keyword: 'mineração', tag: 'OTR' },
  { keyword: 'urgent', tag: 'Urgente' },
  { keyword: 'urgente', tag: 'Urgente' },
];

export function EmailInbox() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [attachDocOpen, setAttachDocOpen] = useState(false);
  const [shareFormOpen, setShareFormOpen] = useState(false);
  const [attachTemplateOpen, setAttachTemplateOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [collaborativeDialogOpen, setCollaborativeDialogOpen] = useState(false);
  
  // Compose form state
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [attachments, setAttachments] = useState<{ name: string; url: string; type?: 'file' | 'document' | 'template' }[]>([]);

  // Fetch emails
  const { data: emails, isLoading } = useQuery({
    queryKey: ['admin-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Email[];
    },
  });

  // Fetch email templates
  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  // Fetch document templates for attachment
  const { data: docTemplates } = useQuery({
    queryKey: ['doc-templates-for-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('id, name, type')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as DocumentTemplate[];
    },
  });

  // Fetch generated documents for attachment
  const { data: generatedDocs } = useQuery({
    queryKey: ['generated-docs-for-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('id, document_name, document_type, file_url, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Update email status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'read') updates.read_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('admin_emails')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_emails')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
      setSelectedEmail(null);
      toast({ title: 'Email excluído com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir email', variant: 'destructive' });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ to, cc, bcc, subject, body, replyToId, emailAttachments }: { to: string; cc?: string; bcc?: string; subject: string; body: string; replyToId?: string; emailAttachments?: { name: string; url: string }[] }) => {
      // Parse CC and BCC emails
      const ccEmails = cc ? cc.split(',').map(e => e.trim()).filter(e => e.includes('@')) : [];
      const bccEmails = bcc ? bcc.split(',').map(e => e.trim()).filter(e => e.includes('@')) : [];
      
      // Save to database as outbound
      const { error: dbError } = await supabase
        .from('admin_emails')
        .insert({
          direction: 'outbound',
          from_email: 'info@elpgreen.com',
          from_name: 'ELP Green Technology',
          to_email: to,
          subject,
          body_text: body,
          status: 'read',
          parent_email_id: replyToId || null,
          metadata: { cc: ccEmails, bcc: bccEmails },
          attachments: emailAttachments || [],
        });
      if (dbError) throw dbError;

      // Send via edge function with attachments
      const { error: sendError } = await supabase.functions.invoke('send-reply-email', {
        body: { 
          to, 
          toName: to.split('@')[0],
          subject, 
          message: body,
          cc: ccEmails.length > 0 ? ccEmails : undefined,
          bcc: bccEmails.length > 0 ? bccEmails : undefined,
          replyType: 'custom',
          attachments: emailAttachments && emailAttachments.length > 0 ? emailAttachments : undefined,
        },
      });
      if (sendError) throw sendError;

      // If replying, update original email status
      if (replyToId) {
        await supabase
          .from('admin_emails')
          .update({ status: 'replied', replied_at: new Date().toISOString() })
          .eq('id', replyToId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-emails'] });
      setComposeOpen(false);
      setReplyMode(false);
      setComposeTo('');
      setComposeCc('');
      setComposeBcc('');
      setComposeSubject('');
      setComposeBody('');
      toast({ title: 'Email enviado com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao enviar email', variant: 'destructive' });
    },
  });

  // Filter emails
  const filteredEmails = useMemo(() => {
    if (!emails) return [];
    return emails.filter(email => {
      const matchesSearch = 
        email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.from_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.body_text?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [emails, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: emails?.length || 0,
    unread: emails?.filter(e => e.status === 'unread').length || 0,
    replied: emails?.filter(e => e.status === 'replied').length || 0,
    archived: emails?.filter(e => e.status === 'archived').length || 0,
  }), [emails]);

  const handleOpenEmail = (email: Email) => {
    setSelectedEmail(email);
    if (email.status === 'unread') {
      updateStatusMutation.mutate({ id: email.id, status: 'read' });
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setReplyMode(true);
      setComposeTo(selectedEmail.from_email);
      setComposeSubject(`Re: ${selectedEmail.subject || 'Sem assunto'}`);
      setComposeOpen(true);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setComposeSubject(template.subject_pt);
      setComposeBody(template.body_pt);
      setSelectedTemplate(templateId);
    }
  };

  const handleSendEmail = () => {
    if (!composeTo || !composeSubject) {
      toast({ title: 'Preencha destinatário e assunto', variant: 'destructive' });
      return;
    }
    sendEmailMutation.mutate({
      to: composeTo,
      cc: composeCc || undefined,
      bcc: composeBcc || undefined,
      subject: composeSubject,
      body: composeBody,
      replyToId: replyMode ? selectedEmail?.id : undefined,
      emailAttachments: attachments.length > 0 ? attachments : undefined,
    });
  };

  const handleAttachDocument = (docId: string, docName: string, docUrl?: string) => {
    if (docUrl) {
      setAttachments(prev => [...prev, { name: docName, url: docUrl }]);
      toast({ title: `Documento "${docName}" anexado` });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleShareForm = (formType: string) => {
    let formUrl = '';
    
    switch (formType) {
      case 'contact':
        formUrl = SITE_URLS.contact;
        break;
      case 'marketplace':
        formUrl = SITE_URLS.marketplace;
        break;
      case 'otr':
        formUrl = SITE_URLS.otrSources;
        break;
      case 'quote':
        formUrl = SITE_URLS.requestQuote;
        break;
      default:
        formUrl = SITE_URLS.contact;
    }

    const formText = `\n\n📋 Preencha nosso formulário: ${formUrl}`;
    setComposeBody(prev => prev + formText);
    setShareFormOpen(false);
    toast({ title: 'Link do formulário adicionado ao email' });
  };

  const handleAttachTemplate = (templateId: string, templateName: string, templateType: string) => {
    // Use production domain for external links
    const templateLink = SITE_URLS.documentTemplate(templateId);
    
    const templateText = `\n\n📋 **${templateName}** (${templateType.toUpperCase()})\nPreencha o formulário: ${templateLink}`;
    setComposeBody(prev => prev + templateText);
    setAttachTemplateOpen(false);
    toast({ title: `Template "${templateName}" adicionado ao email` });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande (máx 10MB)', variant: 'destructive' });
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .upload(`email-attachments/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('lead-documents')
        .getPublicUrl(data.path);

      setAttachments(prev => [...prev, { name: file.name, url: urlData.publicUrl }]);
      toast({ title: 'Arquivo enviado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao enviar arquivo', variant: 'destructive' });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.emailInbox.total')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-6 w-6 md:h-8 md:w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.emailInbox.unread')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.unread}</p>
              </div>
              <MailOpen className="h-6 w-6 md:h-8 md:w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.emailInbox.replied')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.replied}</p>
              </div>
              <Reply className="h-6 w-6 md:h-8 md:w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.emailInbox.archived')}</p>
                <p className="text-xl md:text-2xl font-bold">{stats.archived}</p>
              </div>
              <Archive className="h-6 w-6 md:h-8 md:w-8 text-slate-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-1 gap-2 md:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.emailInbox.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('admin.emailInbox.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.emailInbox.all')}</SelectItem>
              <SelectItem value="unread">{t('admin.emailInbox.unread')}</SelectItem>
              <SelectItem value="read">{t('admin.emailInbox.read')}</SelectItem>
              <SelectItem value="replied">{t('admin.emailInbox.replied')}</SelectItem>
              <SelectItem value="archived">{t('admin.emailInbox.archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setCollaborativeDialogOpen(true)}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            <Sparkles className="h-3 w-3" />
            IA Colaborativa
          </Button>
          <Button onClick={() => { setReplyMode(false); setComposeOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('admin.emailInbox.newEmail')}
          </Button>
        </div>
      </div>

      {/* Email List & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Email List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('admin.emailInbox.inbox')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] md:h-[500px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t('admin.emailInbox.loading')}</div>
              ) : filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{t('admin.emailInbox.noEmailFound')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmails.map((email) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-3 md:p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedEmail?.id === email.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      } ${email.status === 'unread' ? 'bg-blue-500/5' : ''}`}
                      onClick={() => handleOpenEmail(email)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          email.status === 'unread' ? 'bg-blue-500' :
                          email.status === 'replied' ? 'bg-emerald-500' : 'bg-transparent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-medium truncate text-sm ${email.status === 'unread' ? 'font-semibold' : ''}`}>
                              {email.direction === 'inbound' ? (email.from_name || email.from_email) : `${t('admin.emailInbox.to')}: ${email.to_email}`}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(email.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {email.subject || t('admin.emailInbox.noSubject')}
                          </p>
                          {email.tags && email.tags.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {email.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className={`text-xs ${tagColors[tag] || ''}`}>
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {email.direction === 'outbound' && (
                          <Send className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card>
          <CardContent className="p-0">
            {selectedEmail ? (
              <div className="h-[540px] flex flex-col">
                {/* Email Header */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {selectedEmail.subject || 'Sem assunto'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEmail.direction === 'inbound' 
                          ? `De: ${selectedEmail.from_name || selectedEmail.from_email}`
                          : `Para: ${selectedEmail.to_email}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(selectedEmail.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedEmail.direction === 'inbound' && (
                        <Button size="sm" onClick={handleReply}>
                          <Reply className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: selectedEmail.id, status: 'archived' })}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este email?')) {
                            deleteEmailMutation.mutate(selectedEmail.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {selectedEmail.tags && selectedEmail.tags.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {selectedEmail.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className={`${tagColors[tag] || ''}`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Email Body */}
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {selectedEmail.body_html ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{selectedEmail.body_text}</pre>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-[540px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione um email para visualizar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {replyMode ? <Reply className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              {replyMode ? 'Responder Email' : 'Novo Email'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Selector */}
            {templates && templates.length > 0 && !replyMode && (
              <div>
                <Label>Usar Template</Label>
                <Select value={selectedTemplate} onValueChange={handleUseTemplate}>
                  <SelectTrigger>
                    <FileText className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Para</Label>
              <Input
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={replyMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CC (Cópia)</Label>
                <Input
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Separe múltiplos emails com vírgula</p>
              </div>
              <div>
                <Label>CCO (Cópia Oculta)</Label>
                <Input
                  value={composeBcc}
                  onChange={(e) => setComposeBcc(e.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Destinatários não verão estes emails</p>
              </div>
            </div>

            <div>
              <Label>Assunto</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Assunto do email"
              />
            </div>

            <div>
              <Label>Mensagem</Label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="min-h-[150px]"
              />
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Anexos ({attachments.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      <Paperclip className="h-3 w-3" />
                      <span className="max-w-[150px] truncate">{att.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 hover:bg-destructive/20"
                        onClick={() => handleRemoveAttachment(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Arquivo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAttachDocOpen(true)}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Anexar Documento
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShareFormOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar Formulário
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAttachTemplateOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Anexar Template
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Document Dialog */}
      <Dialog open={attachDocOpen} onOpenChange={setAttachDocOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Anexar Documento
            </DialogTitle>
            <DialogDescription>
              Selecione um documento gerado para anexar ao email
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {generatedDocs && generatedDocs.length > 0 ? (
                generatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (doc.file_url) {
                        handleAttachDocument(doc.id, doc.document_name, doc.file_url);
                        setAttachDocOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {doc.document_type}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum documento gerado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Share Form Dialog */}
      <Dialog open={shareFormOpen} onOpenChange={setShareFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhar Formulário
            </DialogTitle>
            <DialogDescription>
              Adicione um link de formulário ao email
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleShareForm('contact')}
            >
              <Mail className="h-6 w-6" />
              <span>Contato Geral</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleShareForm('marketplace')}
            >
              <ClipboardList className="h-6 w-6" />
              <span>Marketplace</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleShareForm('otr')}
            >
              <Link2 className="h-6 w-6" />
              <span>OTR Sources</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => handleShareForm('quote')}
            >
              <FileText className="h-6 w-6" />
              <span>Orçamento</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attach Template Dialog */}
      <Dialog open={attachTemplateOpen} onOpenChange={setAttachTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anexar Template para Preenchimento
            </DialogTitle>
            <DialogDescription>
              Selecione um template que o cliente/parceiro deverá preencher
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[350px]">
            <div className="space-y-2">
              {docTemplates && docTemplates.length > 0 ? (
                docTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleAttachTemplate(template.id, template.name, template.type)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {template.type}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Enviar
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum template disponível</p>
                  <p className="text-sm mt-2">Crie templates na seção de Documentos</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Collaborative AI Document Dialog */}
      <CollaborativeDocumentDialog
        open={collaborativeDialogOpen}
        onOpenChange={setCollaborativeDialogOpen}
        onDocumentGenerated={(content, docType) => {
          // Add the generated document to the email body
          setComposeBody(prev => prev + '\n\n---\n\n' + content);
          setComposeOpen(true);
          toast({
            title: 'Documento gerado com IA colaborativa!',
            description: `${docType.toUpperCase()} adicionado ao corpo do email`,
          });
        }}
        defaultValues={{
          email: selectedEmail?.from_email || composeTo || '',
          companyName: selectedEmail?.from_name || '',
          contactName: selectedEmail?.from_name || '',
        }}
      />
    </div>
  );
}
