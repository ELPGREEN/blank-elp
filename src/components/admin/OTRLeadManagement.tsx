import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mountain,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Send,
  FileDown,
  Eye,
  MoreVertical,
  Calendar,
  MapPin,
  Building2,
  User,
  Mail,
  Phone,
  Package,
  Ruler,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  History,
  Target,
  Briefcase,
  Plus,
  Trash2,
  BarChart3,
  PieChart,
  Globe,
  CalendarDays,
  X,
  Printer,
  Flag,
  Settings,
  Webhook,
  Bell,
  Edit,
  Save,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';

interface OTRLead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  message: string;
  channel: string;
  status: string;
  created_at: string;
}

interface LeadNote {
  id: string;
  contact_id: string;
  user_id: string | null;
  note: string;
  note_type: string;
  created_at: string;
}

interface ConversionGoal {
  id: string;
  month: number;
  year: number;
  target_leads: number;
  target_conversions: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface NotificationWebhook {
  id: string;
  name: string;
  webhook_url: string;
  webhook_type: 'slack' | 'teams' | 'discord';
  is_active: boolean;
  events: string[];
  created_at: string;
}

interface ParsedOTRData {
  indicatorName: string;
  indicatorCompany: string;
  indicatorEmail: string;
  indicatorPhone: string;
  indicatorWhatsApp: string;
  sourceName: string;
  sourceCompany: string;
  sourceType: string;
  location: string;
  volume: string;
  tireSizes: string;
  details: string;
}

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  contacted: { label: 'Contatado', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Send },
  negotiating: { label: 'Negociando', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: Briefcase },
  converted: { label: 'Convertido', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: TrendingUp },
  rejected: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: XCircle },
};

const noteTypeConfig = {
  note: { label: 'Nota', icon: MessageSquare, color: 'text-slate-600' },
  status_change: { label: 'Status', icon: RefreshCw, color: 'text-blue-600' },
  email_sent: { label: 'Email', icon: Mail, color: 'text-green-600' },
  call: { label: 'Ligação', icon: Phone, color: 'text-purple-600' },
  meeting: { label: 'Reunião', icon: Calendar, color: 'text-orange-600' },
};

const CHART_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

const parseOTRMessage = (message: string): ParsedOTRData => {
  const lines = message.split('\n');
  const data: ParsedOTRData = {
    indicatorName: '',
    indicatorCompany: '',
    indicatorEmail: '',
    indicatorPhone: '',
    indicatorWhatsApp: '',
    sourceName: '',
    sourceCompany: '',
    sourceType: '',
    location: '',
    volume: '',
    tireSizes: '',
    details: '',
  };

  let section = '';
  let detailsStart = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('INDICADOR:')) section = 'indicator';
    else if (trimmed.includes('FONTE INDICADA:')) section = 'source';
    else if (trimmed.includes('DETALHES ADICIONAIS:')) {
      section = 'details';
      detailsStart = true;
      continue;
    }

    if (detailsStart) {
      data.details += trimmed + '\n';
      continue;
    }

    if (section === 'indicator') {
      if (trimmed.startsWith('- Nome:')) data.indicatorName = trimmed.replace('- Nome:', '').trim();
      if (trimmed.startsWith('- Empresa:')) data.indicatorCompany = trimmed.replace('- Empresa:', '').trim();
      if (trimmed.startsWith('- Email:')) data.indicatorEmail = trimmed.replace('- Email:', '').trim();
      if (trimmed.startsWith('- Telefone:')) data.indicatorPhone = trimmed.replace('- Telefone:', '').trim();
      if (trimmed.startsWith('- WhatsApp:')) data.indicatorWhatsApp = trimmed.replace('- WhatsApp:', '').trim();
    }

    if (section === 'source') {
      if (trimmed.startsWith('- Nome do Contato:')) data.sourceName = trimmed.replace('- Nome do Contato:', '').trim();
      if (trimmed.startsWith('- Empresa Geradora:')) data.sourceCompany = trimmed.replace('- Empresa Geradora:', '').trim();
      if (trimmed.startsWith('- Tipo:')) data.sourceType = trimmed.replace('- Tipo:', '').trim();
      if (trimmed.startsWith('- Localização:')) data.location = trimmed.replace('- Localização:', '').trim();
      if (trimmed.startsWith('- Volume Anual Estimado:')) data.volume = trimmed.replace('- Volume Anual Estimado:', '').trim();
      if (trimmed.startsWith('- Medidas dos Pneus:')) data.tireSizes = trimmed.replace('- Medidas dos Pneus:', '').trim();
    }
  }

  data.details = data.details.trim();
  return data;
};

export function OTRLeadManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<OTRLead | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('note');
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState('leads');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Goals state
  const [goalsDialogOpen, setGoalsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ConversionGoal | null>(null);
  const [goalForm, setGoalForm] = useState({ target_leads: 10, target_conversions: 3, notes: '' });
  
  // Webhooks state
  const [webhooksDialogOpen, setWebhooksDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', webhook_url: '', webhook_type: 'slack' as const, events: ['lead_approved', 'lead_converted'] });
  const [sendingWeeklyReport, setSendingWeeklyReport] = useState(false);

  // Fetch OTR leads
  const { data: otrLeads = [], isLoading, refetch } = useQuery({
    queryKey: ['otr-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('channel', 'otr-source-indication')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OTRLead[];
    },
  });

  // Fetch notes for selected lead
  const { data: leadNotes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['lead-notes', selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead?.id) return [];
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('contact_id', selectedLead.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LeadNote[];
    },
    enabled: !!selectedLead?.id,
  });

  // Fetch conversion goals
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const { data: conversionGoals = [] } = useQuery({
    queryKey: ['conversion-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('otr_conversion_goals')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data as ConversionGoal[];
    },
  });

  const currentGoal = conversionGoals.find(g => g.month === currentMonth && g.year === currentYear);

  // Fetch notification webhooks
  const { data: webhooks = [], refetch: refetchWebhooks } = useQuery({
    queryKey: ['notification-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as NotificationWebhook[];
    },
  });

  // Update lead status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, sendNotification = false }: { id: string; status: string; sendNotification?: boolean }) => {
      const { error } = await supabase
        .from('contacts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;

      // Add status change note
      await supabase.from('lead_notes').insert({
        contact_id: id,
        user_id: user?.id,
        note: `Status alterado para: ${statusConfig[status as keyof typeof statusConfig]?.label || status}`,
        note_type: 'status_change',
      });

      const lead = otrLeads.find(l => l.id === id);
      
      // Send notification email if approved
      if (status === 'approved' && sendNotification) {
        if (lead) {
          const parsed = parseOTRMessage(lead.message);
          await supabase.functions.invoke('notify-otr-approval', {
            body: {
              leadId: lead.id,
              leadName: lead.name,
              leadEmail: lead.email,
              leadCompany: lead.company,
              sourceCompany: parsed.sourceCompany,
              sourceType: parsed.sourceType,
              location: parsed.location,
              volume: parsed.volume,
              tireSizes: parsed.tireSizes,
              details: parsed.details,
              approvedBy: user?.email || 'Admin',
            },
          });
        }
      }

      // Send webhook notification
      if (lead) {
        const parsed = parseOTRMessage(lead.message);
        const eventMap: Record<string, string> = {
          approved: 'lead_approved',
          converted: 'lead_converted',
          rejected: 'lead_rejected',
        };
        const event = eventMap[status];
        if (event) {
          await supabase.functions.invoke('send-webhook-notification', {
            body: {
              event,
              leadId: lead.id,
              leadName: lead.name,
              leadCompany: lead.company,
              sourceCompany: parsed.sourceCompany,
              sourceType: parsed.sourceType,
              location: parsed.location,
              volume: parsed.volume,
              status,
            },
          });
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['otr-leads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['lead-notes'] });
      const statusLabel = statusConfig[variables.status as keyof typeof statusConfig]?.label || variables.status;
      toast({ 
        title: 'Status atualizado', 
        description: variables.status === 'approved' ? 'Notificação enviada à equipe comercial' : `Lead marcado como ${statusLabel}` 
      });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  // Save conversion goal mutation
  const saveGoalMutation = useMutation({
    mutationFn: async (goal: { month: number; year: number; target_leads: number; target_conversions: number; notes: string }) => {
      const { error } = await supabase
        .from('otr_conversion_goals')
        .upsert({
          month: goal.month,
          year: goal.year,
          target_leads: goal.target_leads,
          target_conversions: goal.target_conversions,
          notes: goal.notes || null,
          created_by: user?.id,
        }, { onConflict: 'month,year' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversion-goals'] });
      setGoalsDialogOpen(false);
      toast({ title: 'Meta salva com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar meta', variant: 'destructive' });
    },
  });

  // Add webhook mutation
  const addWebhookMutation = useMutation({
    mutationFn: async (webhook: typeof newWebhook) => {
      const { error } = await supabase.from('notification_webhooks').insert({
        name: webhook.name,
        webhook_url: webhook.webhook_url,
        webhook_type: webhook.webhook_type,
        events: webhook.events,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-webhooks'] });
      setNewWebhook({ name: '', webhook_url: '', webhook_type: 'slack', events: ['lead_approved', 'lead_converted'] });
      toast({ title: 'Webhook adicionado' });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar webhook', variant: 'destructive' });
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notification_webhooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-webhooks'] });
      toast({ title: 'Webhook removido' });
    },
  });

  // Toggle webhook active status
  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('notification_webhooks').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-webhooks'] });
    },
  });

  // Send weekly report manually
  const sendWeeklyReport = async () => {
    setSendingWeeklyReport(true);
    try {
      const { error } = await supabase.functions.invoke('send-weekly-report');
      if (error) throw error;
      toast({ title: 'Relatório semanal enviado', description: 'Email enviado para os administradores' });
    } catch {
      toast({ title: 'Erro ao enviar relatório', variant: 'destructive' });
    } finally {
      setSendingWeeklyReport(false);
    }
  };

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async ({ contactId, note, noteType }: { contactId: string; note: string; noteType: string }) => {
      const { error } = await supabase.from('lead_notes').insert({
        contact_id: contactId,
        user_id: user?.id,
        note,
        note_type: noteType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes'] });
      setNewNote('');
      setNewNoteType('note');
      toast({ title: 'Nota adicionada' });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar nota', variant: 'destructive' });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from('lead_notes').delete().eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-notes'] });
      toast({ title: 'Nota removida' });
    },
  });

  // Send email
  const sendEmail = async () => {
    if (!selectedLead || !emailSubject || !emailMessage) return;
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-reply-email', {
        body: {
          to: selectedLead.email,
          toName: selectedLead.name,
          subject: emailSubject,
          message: emailMessage,
          replyType: 'contact',
        },
      });
      if (error) throw error;

      // Add email sent note
      await supabase.from('lead_notes').insert({
        contact_id: selectedLead.id,
        user_id: user?.id,
        note: `Email enviado: "${emailSubject}"`,
        note_type: 'email_sent',
      });

      queryClient.invalidateQueries({ queryKey: ['lead-notes'] });
      toast({ title: 'Email enviado com sucesso' });
      setEmailDialogOpen(false);
      setEmailSubject('');
      setEmailMessage('');
    } catch {
      toast({ title: 'Erro ao enviar email', variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  // Generate PDF
  const generatePDF = (lead: OTRLead) => {
    const parsed = parseOTRMessage(lead.message);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // ELP Brand Colors - Navy Blue
    const navyBlue = { r: 26, g: 39, b: 68 };
    const white = { r: 255, g: 255, b: 255 };
    
    // Header - WHITE BACKGROUND
    doc.setFillColor(white.r, white.g, white.b);
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    // Navy blue accent line
    doc.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.rect(0, 26, pageWidth, 2, 'F');
    
    // Navy text on white background
    doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ELP Green Technology', margin, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Indicação OTR', margin, 18);
    doc.text('www.elpgreen.com', pageWidth - margin, 14, { align: 'right' });
    
    let y = 35;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, y);
    doc.text(`Status: ${statusConfig[lead.status as keyof typeof statusConfig]?.label || lead.status}`, pageWidth - margin - 40, y);
    
    doc.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 5, pageWidth - margin, y + 5);
    
    y = 52;
    
    // Section: Indicador
    doc.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.rect(margin, y - 4, 2, 8, 'F');
    doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO INDICADOR', margin + 6, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`Nome: ${parsed.indicatorName || lead.name}`, margin, y); y += 7;
    doc.text(`Empresa: ${parsed.indicatorCompany || lead.company || 'N/A'}`, margin, y); y += 7;
    doc.text(`Email: ${parsed.indicatorEmail || lead.email}`, margin, y); y += 7;
    doc.text(`Telefone: ${parsed.indicatorPhone || 'N/A'}`, margin, y); y += 7;
    doc.text(`WhatsApp: ${parsed.indicatorWhatsApp || 'N/A'}`, margin, y); y += 15;
    
    // Section: Fonte OTR
    doc.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.rect(margin, y - 4, 2, 8, 'F');
    doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DA FONTE OTR', margin + 6, y);
    y += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`Contato: ${parsed.sourceName || 'N/A'}`, margin, y); y += 7;
    doc.text(`Empresa Geradora: ${parsed.sourceCompany || 'N/A'}`, margin, y); y += 7;
    doc.text(`Tipo: ${parsed.sourceType || 'N/A'}`, margin, y); y += 7;
    doc.text(`Localização: ${parsed.location || 'N/A'}`, margin, y); y += 7;
    doc.text(`Volume Anual: ${parsed.volume || 'N/A'}`, margin, y); y += 7;
    doc.text(`Medidas: ${parsed.tireSizes || 'N/A'}`, margin, y); y += 15;
    
    if (parsed.details) {
      doc.setFillColor(navyBlue.r, navyBlue.g, navyBlue.b);
      doc.rect(margin, y - 4, 2, 8, 'F');
      doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALHES ADICIONAIS', margin + 6, y);
      y += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(parsed.details, pageWidth - margin * 2);
      doc.text(lines, margin, y);
    }
    
    // Footer
    doc.setDrawColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('ELP Green Technology | Programa de Indicação OTR', margin, pageHeight - 12);
    doc.text('Transformando resíduos em recursos sustentáveis', margin, pageHeight - 8);
    doc.setTextColor(navyBlue.r, navyBlue.g, navyBlue.b);
    doc.setFont('helvetica', 'bold');
    doc.text('Página 1/1', pageWidth - margin, pageHeight - 10, { align: 'right' });
    
    doc.save(`otr-lead-${lead.id.slice(0, 8)}.pdf`);
    toast({ title: 'PDF gerado com sucesso' });
  };

  // Export CSV
  const exportCSV = () => {
    const filtered = filteredLeads;
    const headers = ['Data', 'Nome', 'Email', 'Empresa', 'Status', 'Fonte', 'Tipo', 'Localização', 'Volume'];
    const rows = filtered.map(lead => {
      const parsed = parseOTRMessage(lead.message);
      return [
        new Date(lead.created_at).toLocaleDateString('pt-BR'),
        lead.name,
        lead.email,
        lead.company || '',
        statusConfig[lead.status as keyof typeof statusConfig]?.label || lead.status,
        parsed.sourceCompany,
        parsed.sourceType,
        parsed.location,
        parsed.volume,
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `otr-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado com sucesso' });
  };

  // Filter leads
  const filteredLeads = otrLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      lead.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter leads by date for analytics
  const filteredByDateLeads = useMemo(() => {
    return otrLeads.filter(lead => {
      if (!dateFilter.start && !dateFilter.end) return true;
      const leadDate = new Date(lead.created_at);
      if (dateFilter.start && leadDate < new Date(dateFilter.start)) return false;
      if (dateFilter.end && leadDate > new Date(dateFilter.end + 'T23:59:59')) return false;
      return true;
    });
  }, [otrLeads, dateFilter]);

  // Stats based on filtered leads
  const stats = useMemo(() => ({
    total: filteredByDateLeads.length,
    pending: filteredByDateLeads.filter(l => l.status === 'pending').length,
    approved: filteredByDateLeads.filter(l => l.status === 'approved').length,
    contacted: filteredByDateLeads.filter(l => l.status === 'contacted').length,
    negotiating: filteredByDateLeads.filter(l => l.status === 'negotiating').length,
    converted: filteredByDateLeads.filter(l => l.status === 'converted').length,
    rejected: filteredByDateLeads.filter(l => l.status === 'rejected').length,
  }), [filteredByDateLeads]);

  // Analytics data
  const analyticsData = useMemo(() => {
    // Status distribution
    const statusData = [
      { name: 'Pendentes', value: stats.pending, fill: '#f59e0b' },
      { name: 'Aprovados', value: stats.approved, fill: '#10b981' },
      { name: 'Contatados', value: stats.contacted, fill: '#3b82f6' },
      { name: 'Negociando', value: stats.negotiating, fill: '#8b5cf6' },
      { name: 'Convertidos', value: stats.converted, fill: '#059669' },
      { name: 'Rejeitados', value: stats.rejected, fill: '#ef4444' },
    ].filter(d => d.value > 0);

    // Region distribution
    const regionMap: Record<string, number> = {};
    filteredByDateLeads.forEach(lead => {
      const parsed = parseOTRMessage(lead.message);
      const location = parsed.location || 'Não informado';
      const region = location.includes('Brazil') || location.includes('brasil') || location.includes('SP') || location.includes('MG') || location.includes('PA') 
        ? 'Brasil' 
        : location.includes('Italy') || location.includes('itália') || location.includes('italia')
        ? 'Itália'
        : location.includes('Germany') || location.includes('alemanha')
        ? 'Alemanha'
        : location.includes('Europe') || location.includes('europa')
        ? 'Europa (Outros)'
        : location.includes('Chile') || location.includes('Peru') || location.includes('Colombia')
        ? 'América Latina'
        : 'Outros';
      regionMap[region] = (regionMap[region] || 0) + 1;
    });
    const regionData = Object.entries(regionMap).map(([name, value]) => ({ name, value }));

    // Source type distribution
    const sourceTypeMap: Record<string, number> = {};
    filteredByDateLeads.forEach(lead => {
      const parsed = parseOTRMessage(lead.message);
      const type = parsed.sourceType || 'Não informado';
      sourceTypeMap[type] = (sourceTypeMap[type] || 0) + 1;
    });
    const sourceTypeData = Object.entries(sourceTypeMap).map(([name, value]) => ({ name, value }));

    // Monthly trend
    const monthlyMap: Record<string, { total: number; converted: number }> = {};
    filteredByDateLeads.forEach(lead => {
      const month = new Date(lead.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!monthlyMap[month]) monthlyMap[month] = { total: 0, converted: 0 };
      monthlyMap[month].total++;
      if (lead.status === 'converted') monthlyMap[month].converted++;
    });
    const monthlyData = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      total: data.total,
      converted: data.converted,
      rate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
    })).slice(-6);

    // Conversion rate
    const conversionRate = stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0;

    return { statusData, regionData, sourceTypeData, monthlyData, conversionRate };
  }, [filteredByDateLeads, stats]);

  // Generate full analytics PDF report
  const generateAnalyticsReport = () => {
    setGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(6, 95, 70);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ELP GREEN TECHNOLOGY', 20, 18);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Relatório de Leads OTR', 20, 28);
      
      // Date range
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const dateRangeText = dateFilter.start || dateFilter.end 
        ? `Período: ${dateFilter.start || 'Início'} até ${dateFilter.end || 'Hoje'}`
        : 'Período: Todos os dados';
      doc.text(dateRangeText, 20, 45);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 80, 45);
      
      // Summary Stats
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 95, 70);
      doc.text('Resumo Executivo', 20, 60);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const statsY = 70;
      const statBoxWidth = 35;
      const statBoxes = [
        { label: 'Total', value: stats.total, color: [100, 116, 139] },
        { label: 'Pendentes', value: stats.pending, color: [245, 158, 11] },
        { label: 'Aprovados', value: stats.approved, color: [16, 185, 129] },
        { label: 'Contatados', value: stats.contacted, color: [59, 130, 246] },
        { label: 'Negociando', value: stats.negotiating, color: [139, 92, 246] },
        { label: 'Convertidos', value: stats.converted, color: [5, 150, 105] },
      ];
      
      statBoxes.forEach((stat, i) => {
        const x = 15 + (i * statBoxWidth);
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
        doc.roundedRect(x, statsY, 30, 25, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(String(stat.value), x + 15, statsY + 12, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, x + 15, statsY + 20, { align: 'center' });
      });
      
      // Conversion Rate
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Taxa de Conversão: ${analyticsData.conversionRate}%`, 20, 110);
      
      // Regional breakdown
      doc.setFontSize(14);
      doc.setTextColor(6, 95, 70);
      doc.text('Distribuição por Região', 20, 130);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      let regionY = 140;
      analyticsData.regionData.forEach((region) => {
        const percentage = stats.total > 0 ? Math.round((region.value / stats.total) * 100) : 0;
        doc.text(`${region.name}: ${region.value} leads (${percentage}%)`, 25, regionY);
        regionY += 8;
      });
      
      // Source type breakdown
      doc.setFontSize(14);
      doc.setTextColor(6, 95, 70);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Tipo de Fonte', 20, regionY + 15);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      let sourceY = regionY + 25;
      analyticsData.sourceTypeData.forEach((source) => {
        const percentage = stats.total > 0 ? Math.round((source.value / stats.total) * 100) : 0;
        doc.text(`${source.name}: ${source.value} leads (${percentage}%)`, 25, sourceY);
        sourceY += 8;
      });
      
      // Lead list (new page)
      doc.addPage();
      doc.setFillColor(6, 95, 70);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Lista de Leads OTR', 20, 16);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Table header
      let tableY = 35;
      doc.setFillColor(240, 240, 240);
      doc.rect(15, tableY, pageWidth - 30, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Data', 18, tableY + 5);
      doc.text('Indicador', 45, tableY + 5);
      doc.text('Fonte OTR', 90, tableY + 5);
      doc.text('Localização', 135, tableY + 5);
      doc.text('Status', 175, tableY + 5);
      
      tableY += 12;
      doc.setFont('helvetica', 'normal');
      
      filteredByDateLeads.slice(0, 25).forEach((lead) => {
        if (tableY > 270) {
          doc.addPage();
          tableY = 20;
        }
        const parsed = parseOTRMessage(lead.message);
        doc.text(new Date(lead.created_at).toLocaleDateString('pt-BR'), 18, tableY);
        doc.text(lead.name.slice(0, 20), 45, tableY);
        doc.text((parsed.sourceCompany || 'N/A').slice(0, 20), 90, tableY);
        doc.text((parsed.location || 'N/A').slice(0, 18), 135, tableY);
        doc.text(statusConfig[lead.status as keyof typeof statusConfig]?.label || lead.status, 175, tableY);
        tableY += 7;
      });
      
      if (filteredByDateLeads.length > 25) {
        doc.setTextColor(100);
        doc.text(`... e mais ${filteredByDateLeads.length - 25} leads`, 20, tableY + 5);
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`ELP Green Technology - Relatório OTR - Página ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }
      
      doc.save(`relatorio-otr-${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'Relatório PDF gerado com sucesso' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Erro ao gerar relatório', variant: 'destructive' });
    } finally {
      setGeneratingReport(false);
    }
  };

  const clearDateFilter = () => {
    setDateFilter({ start: '', end: '' });
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleAddNote = () => {
    if (!selectedLead || !newNote.trim()) return;
    setAddingNote(true);
    addNoteMutation.mutate(
      { contactId: selectedLead.id, note: newNote, noteType: newNoteType },
      { onSettled: () => setAddingNote(false) }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border-l-4 border-l-slate-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Mountain className="h-6 w-6 text-slate-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Contatados</p>
                <p className="text-2xl font-bold">{stats.contacted}</p>
              </div>
              <Send className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Negociando</p>
                <p className="text-2xl font-bold">{stats.negotiating}</p>
              </div>
              <Briefcase className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold">{stats.converted}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversão</p>
                <p className="text-2xl font-bold">{analyticsData.conversionRate}%</p>
              </div>
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Mountain className="h-4 w-4" />
            Leads
            {stats.pending > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mountain className="h-5 w-5" />
                    Gestão de Leads OTR
                  </CardTitle>
                  <CardDescription>
                    Sistema de aprovação e acompanhamento de indicações de fontes OTR
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, empresa ou conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="contacted">Contatados</SelectItem>
                    <SelectItem value="negotiating">Negociando</SelectItem>
                    <SelectItem value="converted">Convertidos</SelectItem>
                    <SelectItem value="rejected">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <Mountain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum lead encontrado</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Indicador</TableHead>
                        <TableHead>Fonte OTR</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => {
                        const parsed = parseOTRMessage(lead.message);
                        const isExpanded = expandedRows.has(lead.id);
                        const StatusIcon = statusConfig[lead.status as keyof typeof statusConfig]?.icon || Clock;
                        
                        return (
                          <>
                            <TableRow 
                              key={lead.id} 
                              className={`cursor-pointer hover:bg-muted/50 ${lead.status === 'pending' ? 'bg-amber-500/5' : ''}`}
                              onClick={() => toggleRowExpand(lead.id)}
                            >
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{lead.name}</p>
                                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{parsed.sourceCompany || 'N/A'}</p>
                                  <p className="text-sm text-muted-foreground">{parsed.sourceType || 'N/A'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{parsed.location || 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusConfig[lead.status as keyof typeof statusConfig]?.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[lead.status as keyof typeof statusConfig]?.label || lead.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedLead(lead); setDetailsOpen(true); }}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver Detalhes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setSelectedLead(lead); setEmailDialogOpen(true); }}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Enviar Email
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generatePDF(lead)}>
                                      <FileDown className="h-4 w-4 mr-2" />
                                      Gerar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {lead.status === 'pending' && (
                                      <>
                                        <DropdownMenuItem 
                                          className="text-green-600"
                                          onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'approved', sendNotification: true })}
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Aprovar (Notificar Equipe)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-red-600"
                                          onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'rejected' })}
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Rejeitar
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {lead.status !== 'pending' && (
                                      <>
                                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'contacted' })}>
                                          <Send className="h-4 w-4 mr-2" />
                                          Marcar como Contatado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'negotiating' })}>
                                          <Briefcase className="h-4 w-4 mr-2" />
                                          Em Negociação
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'converted' })}>
                                          <TrendingUp className="h-4 w-4 mr-2" />
                                          Convertido
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                            <AnimatePresence>
                              {isExpanded && (
                                <TableRow key={`${lead.id}-expanded`}>
                                  <TableCell colSpan={7} className="p-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-6 bg-muted/30 border-t">
                                        <div className="grid md:grid-cols-2 gap-6">
                                          {/* Indicador */}
                                          <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                              <User className="h-4 w-4" />
                                              Dados do Indicador
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>{parsed.indicatorName || lead.name}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{parsed.indicatorCompany || lead.company || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span>{parsed.indicatorEmail || lead.email}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{parsed.indicatorPhone || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Fonte */}
                                          <div>
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                              <Mountain className="h-4 w-4" />
                                              Dados da Fonte OTR
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                              <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4 text-muted-foreground" />
                                                <span><strong>Contato:</strong> {parsed.sourceName || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span><strong>Empresa:</strong> {parsed.sourceCompany || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                <span><strong>Volume:</strong> {parsed.volume || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                                <span><strong>Medidas:</strong> {parsed.tireSizes || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {parsed.details && (
                                          <div className="mt-4 pt-4 border-t">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                              <MessageSquare className="h-4 w-4" />
                                              Detalhes Adicionais
                                            </h4>
                                            <p className="text-sm text-muted-foreground">{parsed.details}</p>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                          {lead.status === 'pending' && (
                                            <>
                                              <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'approved', sendNotification: true })}
                                              >
                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                Aprovar Lead
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="destructive"
                                                onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'rejected' })}
                                              >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Rejeitar
                                              </Button>
                                            </>
                                          )}
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => { setSelectedLead(lead); setDetailsOpen(true); }}
                                          >
                                            <History className="h-4 w-4 mr-2" />
                                            Ver Histórico
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => { setSelectedLead(lead); setEmailDialogOpen(true); }}
                                          >
                                            <Send className="h-4 w-4 mr-2" />
                                            Enviar Email
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => generatePDF(lead)}
                                          >
                                            <FileDown className="h-4 w-4 mr-2" />
                                            Gerar PDF
                                          </Button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </AnimatePresence>
                          </>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* Date Filter & Actions */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics de Leads OTR
                  </CardTitle>
                  <CardDescription>
                    Análise de desempenho e métricas de conversão
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={generateAnalyticsReport}
                    disabled={generatingReport}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    {generatingReport ? 'Gerando...' : 'Relatório PDF'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Data Inicial
                    </Label>
                    <Input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Data Final
                    </Label>
                    <Input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                {(dateFilter.start || dateFilter.end) && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilter}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar filtro
                  </Button>
                )}
              </div>
              {(dateFilter.start || dateFilter.end) && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>
                    Exibindo dados de <strong>{dateFilter.start || 'início'}</strong> até <strong>{dateFilter.end || 'hoje'}</strong>
                    {' '}({filteredByDateLeads.length} leads)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={analyticsData.statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Region Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Leads por Região
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.regionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Source Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mountain className="h-5 w-5" />
                  Tipo de Fonte OTR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={analyticsData.sourceTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.sourceTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendência Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total Leads" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="converted" name="Convertidos" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog with Notes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mountain className="h-5 w-5" />
              Detalhes da Indicação OTR
            </DialogTitle>
            <DialogDescription>
              Visualize detalhes e histórico de interações
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-6 pr-4">
                {(() => {
                  const parsed = parseOTRMessage(selectedLead.message);
                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={statusConfig[selectedLead.status as keyof typeof statusConfig]?.color}>
                          {statusConfig[selectedLead.status as keyof typeof statusConfig]?.label || selectedLead.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Recebido em {new Date(selectedLead.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Dados do Indicador</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Nome:</span> {parsed.indicatorName || selectedLead.name}</div>
                            <div><span className="text-muted-foreground">Empresa:</span> {parsed.indicatorCompany || selectedLead.company || 'N/A'}</div>
                            <div><span className="text-muted-foreground">Email:</span> {parsed.indicatorEmail || selectedLead.email}</div>
                            <div><span className="text-muted-foreground">Telefone:</span> {parsed.indicatorPhone || 'N/A'}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Dados da Fonte OTR</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Contato:</span> {parsed.sourceName || 'N/A'}</div>
                            <div><span className="text-muted-foreground">Empresa:</span> {parsed.sourceCompany || 'N/A'}</div>
                            <div><span className="text-muted-foreground">Tipo:</span> {parsed.sourceType || 'N/A'}</div>
                            <div><span className="text-muted-foreground">Localização:</span> {parsed.location || 'N/A'}</div>
                            <div><span className="text-muted-foreground">Volume:</span> {parsed.volume || 'N/A'}</div>
                            <div><span className="text-muted-foreground">Medidas:</span> {parsed.tireSizes || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {parsed.details && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-semibold mb-2">Detalhes Adicionais</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{parsed.details}</p>
                          </div>
                        </>
                      )}
                      
                      <Separator />
                      
                      {/* Notes Section */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <History className="h-4 w-4" />
                          Histórico de Interações
                        </h4>
                        
                        {/* Add Note Form */}
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <div className="flex gap-3 mb-3">
                            <Select value={newNoteType} onValueChange={setNewNoteType}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="note">Nota</SelectItem>
                                <SelectItem value="call">Ligação</SelectItem>
                                <SelectItem value="meeting">Reunião</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Adicionar nota ou observação..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              size="sm" 
                              onClick={handleAddNote}
                              disabled={!newNote.trim() || addingNote}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                        
                        {/* Notes List */}
                        <div className="space-y-3">
                          {leadNotes.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhuma nota registrada
                            </p>
                          ) : (
                            leadNotes.map((note) => {
                              const NoteIcon = noteTypeConfig[note.note_type as keyof typeof noteTypeConfig]?.icon || MessageSquare;
                              const noteColor = noteTypeConfig[note.note_type as keyof typeof noteTypeConfig]?.color || 'text-slate-600';
                              return (
                                <div key={note.id} className="flex gap-3 p-3 bg-background rounded-lg border">
                                  <div className={`mt-0.5 ${noteColor}`}>
                                    <NoteIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm">{note.note}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(note.created_at).toLocaleString('pt-BR')}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteNoteMutation.mutate(note.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
            {selectedLead && (
              <>
                <Button variant="outline" onClick={() => generatePDF(selectedLead)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={() => { setDetailsOpen(false); setEmailDialogOpen(true); }}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email</DialogTitle>
            <DialogDescription>
              Enviar email para {selectedLead?.name} ({selectedLead?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto do email"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Escreva sua mensagem..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={sendEmail} disabled={sendingEmail || !emailSubject || !emailMessage}>
              {sendingEmail ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
