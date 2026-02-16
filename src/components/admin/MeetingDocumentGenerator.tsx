import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Send,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Building2,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Loader2,
  ClipboardList,
  Mail,
  FileCheck,
  FileDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { generateProfessionalDocument, type DocumentData } from '@/lib/generateProfessionalDocument';

interface Participant {
  name: string;
  email: string;
  role?: string;
  company?: string;
}

interface Meeting {
  id: string;
  title: string;
  meeting_type: string;
  plant_type: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  location: string | null;
  meeting_link: string | null;
  lead_id: string | null;
  lead_type: string | null;
  participants: Participant[];
  agenda_content: string | null;
  summary_content: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}


const meetingTypes = [
  { value: 'commercial', label: 'Comercial', icon: Building2 },
  { value: 'technical', label: 'Técnica', icon: ClipboardList },
  { value: 'follow_up', label: 'Follow-up', icon: CheckCircle },
  { value: 'negotiation', label: 'Negociação', icon: FileCheck },
];

const plantTypes = [
  { value: 'otr_recycling', label: 'Planta OTR' },
  { value: 'pyrolysis', label: 'Pirólise' },
  { value: 'tire_recycling', label: 'Reciclagem de Pneus' },
  { value: 'msw', label: 'RSU/MSW' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  scheduled: { label: 'Agendada', color: 'bg-blue-500/10 text-blue-500', icon: Calendar },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  completed: { label: 'Concluída', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-500', icon: XCircle },
};

export function MeetingDocumentGenerator() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [activeDocType, setActiveDocType] = useState<'agenda' | 'convocation' | 'summary' | 'organize_notes'>('agenda');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterPlant, setFilterPlant] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [rawTextToOrganize, setRawTextToOrganize] = useState<string>('');
  const [isOrganizeDialogOpen, setIsOrganizeDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    meeting_type: 'commercial',
    plant_type: '',
    scheduled_at: '',
    duration_minutes: 60,
    location: '',
    meeting_link: '',
    lead_id: '',
    lead_type: '',
    agenda_topics: '', // Campo específico para pauta/perguntas
    notes: '', // Notas gerais/contexto
  });
  const [participants, setParticipants] = useState<Participant[]>([{ name: '', email: '', role: '', company: '' }]);

  // Fetch meetings
  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings', filterPlant, filterStatus],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('meetings') as any)
        .select('id, title, meeting_type, plant_type, scheduled_at, duration_minutes, location, meeting_link, lead_id, lead_type, participants, agenda_content, summary_content, status, notes, created_at')
        .order('scheduled_at', { ascending: false });
      
      if (filterPlant !== 'all') {
        query = query.eq('plant_type', filterPlant);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((m: Record<string, unknown>) => ({
        ...m,
        participants: Array.isArray(m.participants) 
          ? (m.participants as Participant[]) 
          : []
      })) as Meeting[];
    }
  });

  // Fetch leads for selection
  const { data: leads = [] } = useQuery({
    queryKey: ['all-leads'],
    queryFn: async () => {
      const [contacts, marketplace] = await Promise.all([
        supabase.from('contacts').select('id, name, company, email').order('created_at', { ascending: false }).limit(50),
        supabase.from('marketplace_registrations').select('id, contact_name, company_name, email').order('created_at', { ascending: false }).limit(50)
      ]);
      
      const contactLeads = (contacts.data || []).map(c => ({ 
        id: c.id, 
        name: c.name, 
        company: c.company, 
        email: c.email, 
        type: 'contact' 
      }));
      const marketplaceLeads = (marketplace.data || []).map(m => ({ 
        id: m.id, 
        name: m.contact_name, 
        company: m.company_name, 
        email: m.email, 
        type: 'marketplace' 
      }));
      
      return [...contactLeads, ...marketplaceLeads];
    }
  });

  // Create meeting mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { participants: Participant[] }) => {
      const filteredParticipants = data.participants.filter(p => p.name && p.email);
      // Combina agenda_topics com notes para enviar ao backend
      const combinedNotes = [
        data.agenda_topics ? `PAUTA/PERGUNTAS:\n${data.agenda_topics}` : '',
        data.notes ? `CONTEXTO ADICIONAL:\n${data.notes}` : ''
      ].filter(Boolean).join('\n\n');
      
      const insertData = {
        title: data.title,
        meeting_type: data.meeting_type,
        plant_type: data.plant_type || null,
        scheduled_at: data.scheduled_at || null,
        duration_minutes: data.duration_minutes,
        location: data.location || null,
        meeting_link: data.meeting_link || null,
        lead_id: data.lead_id || null,
        lead_type: data.lead_type || null,
        notes: combinedNotes || null,
        participants: filteredParticipants,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase.from('meetings') as any).insert(insertData).select().single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião criada com sucesso!');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar reunião: ' + error.message);
    }
  });

  // Update meeting status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('meetings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Status atualizado!');
    }
  });

  // Delete meeting
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('meetings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião excluída!');
    }
  });

  // State for sending convocation email
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Generate document with AI
  const generateDocument = async (meeting: Meeting, docType: 'agenda' | 'convocation' | 'summary') => {
    setIsGenerating(true);
    setActiveDocType(docType);
    setGeneratedContent('');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-meeting-document', {
        body: {
          meeting_id: meeting.id,
          document_type: docType,
          meeting_data: {
            title: meeting.title,
            meeting_type: meeting.meeting_type,
            plant_type: meeting.plant_type,
            scheduled_at: meeting.scheduled_at,
            duration_minutes: meeting.duration_minutes,
            location: meeting.location,
            participants: meeting.participants,
            lead_id: meeting.lead_id,
            lead_type: meeting.lead_type,
            notes: meeting.notes,
          },
          language: i18n.language
        }
      });
      
      if (error) throw error;
      
      setGeneratedContent(data.content);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success(`${docType === 'agenda' ? 'Pauta' : docType === 'convocation' ? 'Convocatória' : 'Resumo'} gerado com sucesso!`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Error generating document:', error);
      toast.error('Erro ao gerar documento: ' + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Send convocation email to participants
  const sendConvocationEmail = async (meeting: Meeting, convocationContent: string) => {
    if (!meeting.participants || meeting.participants.length === 0) {
      toast.error('Adicione participantes antes de enviar a convocatória');
      return;
    }

    if (!meeting.scheduled_at) {
      toast.error('Defina uma data para a reunião antes de enviar');
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-meeting-convocation', {
        body: {
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          scheduledAt: meeting.scheduled_at,
          durationMinutes: meeting.duration_minutes,
          location: meeting.location,
          meetingLink: meeting.meeting_link,
          participants: meeting.participants,
          convocationContent,
          language: i18n.language,
        }
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      
      if (data.sent > 0) {
        toast.success(`Convocatória enviada para ${data.sent} participante(s)!`);
      }
      if (data.failed > 0) {
        toast.warning(`${data.failed} e-mail(s) falharam ao enviar`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Error sending convocation:', error);
      toast.error('Erro ao enviar convocatória: ' + errorMessage);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      meeting_type: 'commercial',
      plant_type: '',
      scheduled_at: '',
      duration_minutes: 60,
      location: '',
      meeting_link: '',
      lead_id: '',
      lead_type: '',
      agenda_topics: '',
      notes: '',
    });
    setParticipants([{ name: '', email: '', role: '', company: '' }]);
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '', role: '', company: '' }]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setFormData(prev => ({ ...prev, lead_id: leadId, lead_type: lead.type }));
      // Add lead as participant
      if (!participants.some(p => p.email === lead.email)) {
        setParticipants([
          { name: lead.name, email: lead.email, company: lead.company || '', role: 'Cliente' },
          ...participants.filter(p => p.name || p.email)
        ]);
      }
    }
  };

  // Download document as Markdown
  const downloadMarkdown = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${activeDocType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate professional PDF - same style as collaborative documents
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  
  const downloadPDF = async (content: string, meeting: Meeting | null, docType: string) => {
    setIsDownloadingPDF(true);
    try {
      // Professional legal department branding (same as collaborative documents)
      const legalDepartmentSubtitles: Record<string, string> = {
        pt: 'Departamento Jurídico Internacional',
        en: 'International Legal Department',
        es: 'Departamento Legal Internacional',
        it: 'Dipartimento Legale Internazionale',
        zh: '国际法律部门'
      };

      const docTypeLabels: Record<string, Record<string, string>> = {
        agenda: {
          pt: 'Pauta de Reunião',
          en: 'Meeting Agenda',
          es: 'Agenda de Reunión',
          it: 'Ordine del Giorno',
          zh: '会议议程'
        },
        convocation: {
          pt: 'Convocatória de Reunião',
          en: 'Meeting Convocation',
          es: 'Convocatoria de Reunión',
          it: 'Convocazione della Riunione',
          zh: '会议通知'
        },
        summary: {
          pt: 'Resumo Executivo',
          en: 'Executive Summary',
          es: 'Resumen Ejecutivo',
          it: 'Sintesi Esecutiva',
          zh: '执行摘要'
        },
        organize_notes: {
          pt: 'Ata de Reunião',
          en: 'Meeting Minutes',
          es: 'Acta de Reunión',
          it: 'Verbale della Riunione',
          zh: '会议纪要'
        }
      };

      const lang = (i18n.language as 'pt' | 'en' | 'es' | 'zh' | 'it') || 'pt';
      const participantNames = meeting?.participants?.map(p => p.name).filter(Boolean).join(', ') || '';
      const leadInfo = meeting ? leads.find(l => l.id === meeting.lead_id) : null;
      const docTypeLabel = docTypeLabels[docType]?.[lang] || docTypeLabels[docType]?.pt || 'Documento';

      const documentData: DocumentData = {
        title: meeting?.title || docTypeLabel,
        subtitle: legalDepartmentSubtitles[lang] || legalDepartmentSubtitles.pt,
        content: content,
        language: lang,
        documentType: docTypeLabel.toUpperCase(),
        companyName: leadInfo?.company || meeting?.participants?.[0]?.company || undefined,
        contactName: leadInfo?.name || participantNames || undefined,
        email: leadInfo?.email || meeting?.participants?.[0]?.email || undefined,
        watermarkType: 'confidential',
        includeDocumentNumber: true,
      };

      await generateProfessionalDocument(documentData);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Organize raw text with AI
  const organizeRawText = async () => {
    if (!rawTextToOrganize.trim() || rawTextToOrganize.length < 10) {
      toast.error('Cole um texto com pelo menos 10 caracteres');
      return;
    }
    
    setIsGenerating(true);
    setActiveDocType('organize_notes');
    setGeneratedContent('');
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-meeting-document', {
        body: {
          document_type: 'organize_notes',
          raw_text: rawTextToOrganize,
          meeting_data: { title: 'Organizar Notas' },
          language: i18n.language
        }
      });
      
      if (error) throw error;
      
      setGeneratedContent(data.content);
      setIsOrganizeDialogOpen(false);
      setIsViewOpen(true);
      toast.success('Ata organizada com sucesso!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Error organizing notes:', error);
      toast.error('Erro ao organizar texto: ' + errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Reuniões</h2>
          <p className="text-muted-foreground">Crie reuniões e gere documentos profissionais com IA</p>
        </div>
        
        {/* Quick Guide Card */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-lg">1️⃣</span>
                <div>
                  <p className="font-medium">Crie a Reunião</p>
                  <p className="text-xs text-muted-foreground">Defina título, participantes e sua pauta/perguntas</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-lg">2️⃣</span>
                <div>
                  <p className="font-medium">Gere Documentos</p>
                  <p className="text-xs text-muted-foreground">A IA formata sua pauta em documentos profissionais</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-lg">3️⃣</span>
                <div>
                  <p className="font-medium">Organize Notas</p>
                  <p className="text-xs text-muted-foreground">Cole anotações brutas e transforme em ata estruturada</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-2 flex-wrap">
          {/* Organize Notes Button */}
          <Dialog open={isOrganizeDialogOpen} onOpenChange={setIsOrganizeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Organizar Notas Brutas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Transformar Notas em Ata
                </DialogTitle>
                <DialogDescription>
                  Cole suas anotações bagunçadas e a IA vai organizar em uma ata profissional com decisões, ações e responsáveis
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Cole seu texto aqui</Label>
                  <p className="text-xs text-muted-foreground">
                    Pode ser transcrição, anotações rápidas, bullet points - a IA vai estruturar tudo
                  </p>
                  <Textarea
                    value={rawTextToOrganize}
                    onChange={(e) => setRawTextToOrganize(e.target.value)}
                    placeholder={`Exemplo de texto que você pode colar:

- João disse que vai aprovar o orçamento até sexta
- Discutimos sobre o terreno em Goiás, precisa de análise ambiental
- Maria vai enviar proposta revisada
- Próxima reunião dia 20/02
- Cliente quer começar operação em agosto
- Falaram sobre financiamento via BNDES
- Decisão: vamos com a planta de 50t/dia
- Carlos vai fazer visita técnica na semana que vem...`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {rawTextToOrganize.length} caracteres • Mínimo 10 caracteres
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOrganizeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={organizeRawText}
                  disabled={rawTextToOrganize.length < 10 || isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Organizar com IA
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* New Meeting Button */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Reunião
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nova Reunião</DialogTitle>
              <DialogDescription>
                Preencha os dados da reunião para gerar documentos automaticamente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título da Reunião *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Reunião de Apresentação - Projeto OTR"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Reunião</Label>
                  <Select
                    value={formData.meeting_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, meeting_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de Planta</Label>
                  <Select
                    value={formData.plant_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, plant_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plantTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Escritório SP ou Online"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Link da Reunião</Label>
                  <Input
                    value={formData.meeting_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Lead Selection */}
              <div className="space-y-2">
                <Label>Vincular a Lead/Cliente</Label>
                <Select onValueChange={handleLeadSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company || lead.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              {/* Participants */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Participantes</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParticipant}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
                
                {participants.map((participant, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <Input
                      placeholder="Nome"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                    />
                    <Input
                      placeholder="Cargo"
                      value={participant.role || ''}
                      onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Empresa"
                        value={participant.company || ''}
                        onChange={(e) => updateParticipant(index, 'company', e.target.value)}
                        className="flex-1"
                      />
                      {participants.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeParticipant(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              {/* Pauta/Perguntas - Campo Principal */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">📋 Pauta / Perguntas da Reunião</Label>
                  <Badge variant="secondary" className="text-xs">Importante</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Liste aqui os tópicos, perguntas ou pontos que <strong>você quer discutir</strong> na reunião. 
                  A IA usará exatamente estes itens para gerar a pauta e os documentos.
                </p>
                <Textarea
                  value={formData.agenda_topics}
                  onChange={(e) => setFormData(prev => ({ ...prev, agenda_topics: e.target.value }))}
                  placeholder={`Exemplo:
1. Apresentar proposta comercial da planta OTR
2. Qual é a capacidade de investimento do parceiro?
3. Discutir cronograma de implementação
4. Revisar termos do contrato de parceria
5. Definir próximos passos e responsáveis`}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              
              {/* Notas/Contexto - Campo Secundário */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">📝 Contexto Adicional (opcional)</Label>
                <p className="text-xs text-muted-foreground">
                  Informações de fundo que ajudam a IA a entender o contexto, mas que não são itens de pauta.
                </p>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Cliente já visitou nossa fábrica na China em março. Interesse principal é em granulado para asfalto borracha..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createMutation.mutate({ ...formData, participants })}
                disabled={!formData.title || createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Criar Reunião
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterPlant} onValueChange={setFilterPlant}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de Planta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Plantas</SelectItem>
            {plantTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(statusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Meetings Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : meetings.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma reunião encontrada</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              Agendar Primeira Reunião
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {meetings.map((meeting) => {
              const status = statusConfig[meeting.status] || statusConfig.scheduled;
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={meeting.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg line-clamp-2">{meeting.title}</CardTitle>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <CardDescription className="flex flex-wrap gap-2">
                        {meeting.plant_type && (
                          <Badge variant="outline">
                            {plantTypes.find(p => p.value === meeting.plant_type)?.label}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {meetingTypes.find(m => m.value === meeting.meeting_type)?.label}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {meeting.scheduled_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(meeting.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                        )}
                        {meeting.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {meeting.location}
                          </div>
                        )}
                        {meeting.participants && meeting.participants.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {meeting.participants.length} participante(s)
                          </div>
                        )}
                      </div>
                      
                      {/* Document Status */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={meeting.agenda_content ? "default" : "outline"} className="text-xs">
                          <ClipboardList className="h-3 w-3 mr-1" />
                          Pauta
                        </Badge>
                        <Badge variant={meeting.summary_content ? "default" : "outline"} className="text-xs">
                          <FileCheck className="h-3 w-3 mr-1" />
                          Resumo
                        </Badge>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedMeeting(meeting);
                            setGeneratedContent(meeting.agenda_content || meeting.summary_content || '');
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        
                        <Select
                          value={meeting.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ id: meeting.id, status: v })}
                        >
                          <SelectTrigger className="w-auto">
                            <Edit className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([value, config]) => (
                              <SelectItem key={value} value={value}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Excluir esta reunião?')) {
                              deleteMutation.mutate(meeting.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* View/Generate Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedMeeting?.title || 'Documento Organizado'}
            </DialogTitle>
            <DialogDescription>
              {selectedMeeting ? 'Gere documentos profissionais baseados nos dados da reunião' : 'Visualize o documento gerado'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMeeting ? (
            <Tabs defaultValue="generate" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="generate">🤖 Gerar com IA</TabsTrigger>
                <TabsTrigger value="preview">👁️ Visualizar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generate" className="flex-1 overflow-auto">
                {/* Info Box */}
                {selectedMeeting.notes && (
                  <div className="mx-4 mt-4 p-3 bg-muted/50 rounded-lg border">
                    <p className="text-xs font-medium mb-1">📋 Pauta definida para esta reunião:</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{selectedMeeting.notes}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                  {/* Pauta/Agenda */}
                  <Card className="hover:border-primary transition-colors cursor-pointer group" 
                        onClick={() => !isGenerating && generateDocument(selectedMeeting, 'agenda')}>
                    <CardHeader className="text-center pb-2">
                      <ClipboardList className="h-10 w-10 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-base">Pauta Formatada</CardTitle>
                      <CardDescription className="text-xs">
                        Transforma suas perguntas/tópicos em pauta profissional
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button 
                        disabled={isGenerating}
                        className="w-full"
                        size="sm"
                      >
                        {isGenerating && activeDocType === 'agenda' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Gerar Pauta
                      </Button>
                      {selectedMeeting.agenda_content && (
                        <p className="text-xs text-primary mt-2">✓ Já gerada</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Convocatória */}
                  <Card className="hover:border-primary transition-colors group">
                    <CardHeader className="text-center pb-2">
                      <Mail className="h-10 w-10 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-base">Convocatória</CardTitle>
                      <CardDescription className="text-xs">
                        E-mail formal convidando os participantes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0 space-y-2">
                      <Button 
                        disabled={isGenerating}
                        className="w-full"
                        size="sm"
                        onClick={() => !isGenerating && generateDocument(selectedMeeting, 'convocation')}
                      >
                        {isGenerating && activeDocType === 'convocation' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Gerar Convite
                      </Button>
                      
                      {/* Send by Email Button - only visible when convocation is generated */}
                      {generatedContent && activeDocType === 'convocation' && (
                        <Button 
                          disabled={isSendingEmail || !selectedMeeting.participants?.length}
                          variant="outline"
                          className="w-full gap-2"
                          size="sm"
                          onClick={() => sendConvocationEmail(selectedMeeting, generatedContent)}
                        >
                          {isSendingEmail ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Enviar por E-mail
                          {selectedMeeting.participants?.length ? (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {selectedMeeting.participants.length}
                            </Badge>
                          ) : null}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Resumo Executivo */}
                  <Card className="hover:border-primary transition-colors cursor-pointer group"
                        onClick={() => !isGenerating && generateDocument(selectedMeeting, 'summary')}>
                    <CardHeader className="text-center pb-2">
                      <FileCheck className="h-10 w-10 mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-base">Resumo Executivo</CardTitle>
                      <CardDescription className="text-xs">
                        Síntese das decisões e próximos passos
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pt-0">
                      <Button 
                        disabled={isGenerating}
                        className="w-full"
                        size="sm"
                      >
                        {isGenerating && activeDocType === 'summary' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Gerar Resumo
                      </Button>
                      {selectedMeeting.summary_content && (
                        <p className="text-xs text-primary mt-2">✓ Já gerado</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[60vh]">
                  {generatedContent ? (
                    <div className="p-6">
                      <div className="flex justify-end gap-2 mb-4">
                        <Button
                          size="sm"
                          onClick={() => downloadPDF(generatedContent, selectedMeeting, activeDocType)}
                          disabled={isDownloadingPDF}
                          className="gap-2"
                        >
                          {isDownloadingPDF ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4" />
                          )}
                          Baixar PDF
                        </Button>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={generatedContent} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                      <FileText className="h-16 w-16 mb-4 opacity-50" />
                      <p>Nenhum documento gerado ainda</p>
                      <p className="text-sm">Clique em "Gerar com IA" para começar</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            /* Fallback para quando não há selectedMeeting mas há conteúdo gerado (organize_notes) */
            <ScrollArea className="h-[60vh]">
              {generatedContent ? (
                <div className="p-6">
                  <div className="flex justify-end gap-2 mb-4">
                    <Button
                      size="sm"
                      onClick={() => downloadPDF(generatedContent, null, activeDocType)}
                      disabled={isDownloadingPDF}
                      className="gap-2"
                    >
                      {isDownloadingPDF ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4" />
                      )}
                      Baixar PDF
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={generatedContent} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <FileText className="h-16 w-16 mb-4 opacity-50" />
                  <p>Nenhum documento gerado</p>
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
