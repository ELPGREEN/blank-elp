import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Download,
  Send,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  FileSignature,
  FileCheck,
  FileClock,
  Copy,
  Mail,
  Globe,
  Pen,
  CheckCircle2,
  Shield,
  Share2,
  Users,
  ClipboardList,
  Building2,
  Scale,
  Leaf,
  Lock,
  FileSpreadsheet,
  MessageSquare,
  Clock,
  Loader2,
  X,
  ExternalLink,
  Link2,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
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
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR, enUS, es, it, zhCN } from 'date-fns/locale';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { SignaturePad, SignatureVerification } from './SignaturePad';
import { ELPSignaturePortal, ICPSignatureData } from './ELPSignaturePortal';
import { BulkDocumentGenerator } from './BulkDocumentGenerator';
import { CollaborativeDocumentDialog } from './CollaborativeDocumentDialog';
import { MultipleSignersManager, Signer } from './MultipleSignersManager';
import { DocumentAICorrector } from './DocumentAICorrector';
import logoElp from "@/assets/logo-elp-lion.png";
import { SITE_URLS } from '@/lib/siteConfig';

interface SignatureData {
  dataUrl: string;
  timestamp: string;
  signerName: string;
  signerEmail: string;
  ipAddress?: string;
  type: 'drawn' | 'typed';
}

interface TemplateField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  content_pt: string;
  content_en: string;
  content_es: string;
  content_zh: string;
  content_it: string;
  fields: TemplateField[];
  is_active: boolean;
  created_at?: string;
}

interface GeneratedDocument {
  id: string;
  template_id: string | null;
  lead_id: string | null;
  lead_type: string | null;
  document_name: string;
  document_type: string;
  file_url: string | null;
  field_values: Record<string, string>;
  language: string;
  sent_to_email: string | null;
  sent_at: string | null;
  created_at: string;
  is_signed?: boolean;
  signed_at?: string | null;
  signer_name?: string | null;
  signer_email?: string | null;
  signature_type?: string | null;
  signature_hash?: string | null;
  generated_by?: string | null;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  type: string;
}

// Extended document type config with all 10 types
// Document type config - now returns function that accepts t() for translations
const getDocumentTypeConfig = (t: (key: string) => string): Record<string, { label: string; icon: typeof FileText; color: string; description: string }> => ({
  nda: { label: t('admin.documentGenerator.documentTypes.nda'), icon: Lock, color: 'bg-red-500/10 text-red-600', description: t('admin.documentGenerator.documentTypes.ndaDesc') },
  nda_unilateral: { label: t('admin.documentGenerator.documentTypes.ndaUnilateral'), icon: Lock, color: 'bg-red-500/10 text-red-600', description: t('admin.documentGenerator.documentTypes.ndaUnilateralDesc') },
  nda_bilateral: { label: t('admin.documentGenerator.documentTypes.ndaBilateral'), icon: Shield, color: 'bg-rose-500/10 text-rose-600', description: t('admin.documentGenerator.documentTypes.ndaBilateralDesc') },
  nda_multilateral: { label: t('admin.documentGenerator.documentTypes.ndaMultilateral'), icon: Users, color: 'bg-pink-500/10 text-pink-600', description: t('admin.documentGenerator.documentTypes.ndaMultilateralDesc') },
  form_level1: { label: t('admin.documentGenerator.documentTypes.formLevel1'), icon: ClipboardList, color: 'bg-blue-500/10 text-blue-600', description: t('admin.documentGenerator.documentTypes.formLevel1Desc') },
  form_level2: { label: t('admin.documentGenerator.documentTypes.formLevel2'), icon: Building2, color: 'bg-indigo-500/10 text-indigo-600', description: t('admin.documentGenerator.documentTypes.formLevel2Desc') },
  kyc: { label: t('admin.documentGenerator.documentTypes.kyc'), icon: FileCheck, color: 'bg-orange-500/10 text-orange-600', description: t('admin.documentGenerator.documentTypes.kycDesc') },
  joint_venture: { label: t('admin.documentGenerator.documentTypes.jointVenture'), icon: Scale, color: 'bg-purple-500/10 text-purple-600', description: t('admin.documentGenerator.documentTypes.jointVentureDesc') },
  contract: { label: t('admin.documentGenerator.documentTypes.contract'), icon: FileSignature, color: 'bg-green-500/10 text-green-600', description: t('admin.documentGenerator.documentTypes.contractDesc') },
  report: { label: t('admin.documentGenerator.documentTypes.report'), icon: Leaf, color: 'bg-emerald-500/10 text-emerald-600', description: t('admin.documentGenerator.documentTypes.reportDesc') },
  consent: { label: t('admin.documentGenerator.documentTypes.consent'), icon: Shield, color: 'bg-cyan-500/10 text-cyan-600', description: t('admin.documentGenerator.documentTypes.consentDesc') },
  proposal: { label: t('admin.documentGenerator.documentTypes.proposal'), icon: FileSpreadsheet, color: 'bg-violet-500/10 text-violet-600', description: t('admin.documentGenerator.documentTypes.proposalDesc') },
  interaction_log: { label: t('admin.documentGenerator.documentTypes.interactionLog'), icon: MessageSquare, color: 'bg-slate-500/10 text-slate-600', description: t('admin.documentGenerator.documentTypes.interactionLogDesc') },
  auto_reply: { label: t('admin.documentGenerator.documentTypes.autoReply'), icon: Clock, color: 'bg-amber-500/10 text-amber-600', description: t('admin.documentGenerator.documentTypes.autoReplyDesc') },
  loi: { label: t('admin.documentGenerator.documentTypes.loi'), icon: FileSignature, color: 'bg-amber-500/10 text-amber-600', description: t('admin.documentGenerator.documentTypes.loiDesc') },
  mou: { label: t('admin.documentGenerator.documentTypes.mou'), icon: FileCheck, color: 'bg-teal-500/10 text-teal-600', description: t('admin.documentGenerator.documentTypes.mouDesc') },
});

const ITEMS_PER_PAGE = 10;

export function DocumentGenerator() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get date locale based on current language
  const getDateLocale = () => {
    const locales: Record<string, any> = { pt: ptBR, en: enUS, es: es, it: it, zh: zhCN };
    return locales[i18n.language] || enUS;
  };

  // Create translated document type config
  const documentTypeConfig = getDocumentTypeConfig(t);

  const languageLabels: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    zh: '中文',
    it: 'Italiano',
  };

  // State
  const [activeTab, setActiveTab] = useState('generate');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [signatureFilter, setSignatureFilter] = useState<string>('all');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [submissionDetailOpen, setSubmissionDetailOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GeneratedDocument | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate> | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [selectedCountry, setSelectedCountry] = useState('brazil');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedLead, setSelectedLead] = useState<string>('none');
  const [sendToEmail, setSendToEmail] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [pendingSignature, setPendingSignature] = useState<SignatureData | null>(null);
  const [pendingICPSignature, setPendingICPSignature] = useState<ICPSignatureData | null>(null);
  const [documentToSign, setDocumentToSign] = useState<GeneratedDocument | null>(null);
  const [documentToShare, setDocumentToShare] = useState<GeneratedDocument | null>(null);
  const [icpPortalOpen, setIcpPortalOpen] = useState(false);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [collaborativeDialogOpen, setCollaborativeDialogOpen] = useState(false);
  
  // Multiple signers state
  const [enableMultipleSignatures, setEnableMultipleSignatures] = useState(false);
  const [signersList, setSignersList] = useState<Signer[]>([]);
  
  // Pagination state
  const [historyPage, setHistoryPage] = useState(1);
  const [submissionsPage, setSubmissionsPage] = useState(1);

  // Country options with flags
  const countryOptions = [
    { code: 'brazil', label: '🇧🇷 Brasil', lang: 'pt' },
    { code: 'italy', label: '🇮🇹 Italia', lang: 'it' },
    { code: 'germany', label: '🇩🇪 Deutschland', lang: 'de' },
    { code: 'usa', label: '🇺🇸 United States', lang: 'en' },
    { code: 'australia', label: '🇦🇺 Australia', lang: 'en' },
    { code: 'mexico', label: '🇲🇽 México', lang: 'es' },
    { code: 'china', label: '🇨🇳 中国', lang: 'zh' },
  ];

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('*').order('name');
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        fields: typeof t.fields === 'string' ? JSON.parse(t.fields) || [] : t.fields || [],
      })) as DocumentTemplate[];
    },
  });

  // Fetch generated documents
  const { data: generatedDocs, isLoading: docsLoading } = useQuery({
    queryKey: ['generated-documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('generated_documents').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return data as GeneratedDocument[];
    },
  });

  // Fetch leads for selection
  const { data: leads } = useQuery({
    queryKey: ['all-leads-for-docs'],
    queryFn: async () => {
      const [contactsRes, marketplaceRes] = await Promise.all([
        supabase.from('contacts').select('id, name, email, company').limit(100),
        supabase.from('marketplace_registrations').select('id, contact_name, email, company_name').limit(100),
      ]);
      const allLeads: Lead[] = [];
      contactsRes.data?.forEach(c => allLeads.push({ id: c.id, name: c.name, email: c.email, company: c.company, type: 'contact' }));
      marketplaceRes.data?.forEach(m => allLeads.push({ id: m.id, name: m.contact_name, email: m.email, company: m.company_name, type: 'marketplace' }));
      return allLeads;
    },
  });

  // Filter documents
  const filteredDocs = useMemo(() => {
    if (!generatedDocs) return [];
    return generatedDocs.filter(doc => {
      const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [generatedDocs, searchTerm, typeFilter]);

  // Client submissions (templates filled by clients - those without generated_by)
  const clientSubmissions = useMemo(() => {
    if (!generatedDocs) return [];
    return generatedDocs.filter(doc => {
      const isClientSubmission = !doc.generated_by || doc.document_name.includes('Preenchido');
      const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (doc.signer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                           (doc.signer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
      const matchesSignature = signatureFilter === 'all' || 
                               (signatureFilter === 'signed' && doc.is_signed) ||
                               (signatureFilter === 'pending' && !doc.is_signed);
      return isClientSubmission && matchesSearch && matchesType && matchesSignature;
    });
  }, [generatedDocs, searchTerm, typeFilter, signatureFilter]);

  // Paginated data
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocs, historyPage]);

  const paginatedSubmissions = useMemo(() => {
    const start = (submissionsPage - 1) * ITEMS_PER_PAGE;
    return clientSubmissions.slice(start, start + ITEMS_PER_PAGE);
  }, [clientSubmissions, submissionsPage]);

  const historyTotalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
  const submissionsTotalPages = Math.ceil(clientSubmissions.length / ITEMS_PER_PAGE);

  // Stats
  const stats = useMemo(() => {
    const docs = generatedDocs || [];
    const submissions = docs.filter(d => !d.generated_by || d.document_name.includes('Preenchido'));
    return {
      total: docs.length,
      sent: docs.filter(d => d.sent_at).length,
      pending: docs.filter(d => !d.sent_at).length,
      signed: docs.filter(d => d.is_signed).length,
      submissions: submissions.length,
      submissionsSigned: submissions.filter(d => d.is_signed).length,
    };
  }, [generatedDocs]);

  // Generate SHA-256 hash
  const generateHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSelectTemplate = (template: DocumentTemplate) => {
    const safeTemplate = {
      ...template,
      fields: Array.isArray(template.fields) ? template.fields : [],
    };
    setSelectedTemplate(safeTemplate);
    setFieldValues({});
    setPreviewContent('');
    setManualEntryMode(false);
    setSelectedLead('none');
    setGenerateOpen(true);
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLead(leadId);
    if (leadId === 'none') {
      return;
    }
    const lead = leads?.find(l => l.id === leadId);
    if (lead) {
      setFieldValues(prev => ({
        ...prev,
        company_name: lead.company || '',
        contact_name: lead.name,
        email: lead.email,
        date: format(new Date(), 'dd/MM/yyyy'),
        disclosing_party: 'ELP Alliance S/A',
        receiving_party: lead.company || lead.name,
      }));
      setSendToEmail(lead.email);
    }
  };

  // AI-powered document field generation
  const handleAIFill = async () => {
    if (!selectedTemplate) return;
    
    setIsGeneratingAI(true);
    try {
      const templateContent = getContentByLanguage(selectedTemplate, selectedLanguage);
      const existingFields = selectedTemplate.fields?.map(f => ({ name: f.name, label: f.label, type: f.type })) || [];
      
      const { data, error } = await supabase.functions.invoke('generate-document-ai', {
        body: {
          templateType: selectedTemplate.type,
          country: selectedCountry,
          language: selectedLanguage,
          existingFields,
          templateContent: templateContent.substring(0, 1500),
          generateFullDocument: true,
        },
      });

      if (error) throw error;

      if (data?.fields) {
        // Merge AI-generated fields with existing values
        setFieldValues(prev => ({
          ...prev,
          ...data.fields,
          date: format(new Date(), 'dd/MM/yyyy'),
          disclosing_party: 'ELP Alliance S/A',
        }));

        // If AI generated document content, update the preview
        if (data.documentContent) {
          // Apply field values to the generated content
          let content = data.documentContent;
          Object.entries(data.fields).forEach(([key, value]) => {
            if (typeof value === 'string') {
              content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }
          });
          setPreviewContent(content);
          
          toast({
            title: t('admin.documentGenerator.ai.documentGenerated', '📄 Documento completo gerado'),
            description: t('admin.documentGenerator.ai.documentGeneratedDesc', 'O conteúdo do documento foi criado com base no template e jurisdição selecionados'),
          });
        }

        // Show jurisdiction info
        if (data.jurisdictionInfo) {
          toast({
            title: t('admin.documentGenerator.ai.jurisdictionApplied', 'Jurisdição aplicada'),
            description: `${data.jurisdictionInfo.governingLaw || data.countryLegalData?.governingLaw}`,
          });
        }

        // Show recommended clauses if any
        if (data.recommendedClauses?.length > 0) {
          toast({
            title: t('admin.documentGenerator.ai.recommendedClauses', '💡 Cláusulas Recomendadas'),
            description: data.recommendedClauses.slice(0, 2).join('; '),
          });
        }
      }

      if (data?.legalNotes?.length > 0) {
        toast({
          title: t('admin.documentGenerator.ai.legalNotes', 'Notas Legais'),
          description: data.legalNotes[0],
        });
      }

      toast({
        title: t('admin.documentGenerator.ai.success', '✨ Documento preenchido com IA'),
        description: t('admin.documentGenerator.ai.successDesc', 'Revise os valores e ajuste conforme necessário'),
      });
    } catch (error) {
      console.error('AI fill error:', error);
      toast({
        title: t('admin.documentGenerator.ai.error', 'Erro ao gerar com IA'),
        description: t('admin.documentGenerator.ai.errorDesc', 'Tente novamente ou preencha manualmente'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getContentByLanguage = (template: DocumentTemplate, lang: string) => {
    const contentMap: Record<string, string> = {
      pt: template.content_pt,
      en: template.content_en,
      es: template.content_es,
      zh: template.content_zh,
      it: template.content_it,
    };
    return contentMap[lang] || template.content_pt;
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;
    let content = getContentByLanguage(selectedTemplate, selectedLanguage);
    Object.entries(fieldValues).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    });
    setPreviewContent(content);
  };

  const generatePDF = async (content: string, fileName: string, signature?: SignatureData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    const maxY = 270;
    let yPos = 20;
    
    // Load logo
    let logoBase64: string | null = null;
    try {
      const response = await fetch(logoElp);
      const blob = await response.blob();
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.log("Could not load logo");
    }

    // Generate QR Code
    let qrCodeBase64: string | null = null;
    try {
      qrCodeBase64 = await QRCode.toDataURL(SITE_URLS.contact, {
        width: 200,
        margin: 1,
        color: { dark: '#003366', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
    } catch (e) {
      console.log("Could not generate QR code");
    }
    
    // === COVER PAGE - WHITE BACKGROUND WITH NAVY STRIPES ===
    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    
    // TOP STRIPE - Navy blue
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, pageWidth, 8, "F");
    
    // Accent line - Green
    doc.setFillColor(46, 125, 50);
    doc.rect(0, 8, pageWidth, 2, "F");
    
    // BOTTOM STRIPE - Navy blue
    doc.setFillColor(0, 51, 102);
    doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

    // Logo centered with shadow effect
    if (logoBase64) {
      try {
        // Shadow
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(pageWidth / 2 - 27, 32, 54, 29, 3, 3, "F");
        // White background
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth / 2 - 28, 30, 54, 29, 3, 3, "F");
        // Logo
        doc.addImage(logoBase64, "PNG", pageWidth / 2 - 25, 32, 48, 25);
      } catch (e) {}
    }

    // Company name with elegant typography
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ELP Green Technology", pageWidth / 2, 72, { align: "center" });
    
    // Decorative line with dots
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - 35, 77, pageWidth / 2 + 35, 77);
    doc.setFillColor(46, 125, 50);
    doc.circle(pageWidth / 2 - 38, 77, 1.5, "F");
    doc.circle(pageWidth / 2 + 38, 77, 1.5, "F");

    // Document title with decorative frame
    yPos = 95;
    const docTitle = selectedTemplate?.name || 'Document';
    
    // Title background frame
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin + 10, yPos - 8, contentWidth - 20, 35, 3, 3, "FD");
    
    // Inner accent line
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin + 12, yPos - 6, contentWidth - 24, 31, 2, 2, "S");
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    const titleLines = doc.splitTextToSize(docTitle, contentWidth - 40);
    let titleY = yPos + 5;
    titleLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, titleY, { align: "center" });
      titleY += 12;
    });

    // Document type badge with icon
    yPos = 145;
    const badgeWidth = 70;
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(pageWidth / 2 - badgeWidth / 2, yPos, badgeWidth, 12, 3, 3, "F");
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`📋 ${(selectedTemplate?.type || 'DOC').toUpperCase()}`, pageWidth / 2, yPos + 8, { align: "center" });

    // Info cards with improved design
    yPos = 165;
    const cardWidth = (contentWidth - 15) / 2;
    const cardHeight = 32;

    // Company card with icon
    if (fieldValues.company_name) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, yPos, cardWidth, cardHeight, 3, 3, "FD");
      
      // Left accent bar
      doc.setFillColor(0, 51, 102);
      doc.roundedRect(margin, yPos, 5, cardHeight, 3, 0, "F");
      doc.rect(margin + 2, yPos, 3, cardHeight, "F");
      
      doc.setTextColor(100);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`🏢 ${t('admin.documentGenerator.fields.companyName', 'EMPRESA').toUpperCase()}`, margin + 12, yPos + 10);
      
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(10);
      doc.text(fieldValues.company_name.substring(0, 22), margin + 12, yPos + 22);
    }

    // Contact card with icon
    if (fieldValues.contact_name) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(46, 125, 50);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin + cardWidth + 15, yPos, cardWidth, cardHeight, 3, 3, "FD");
      
      // Left accent bar
      doc.setFillColor(46, 125, 50);
      doc.roundedRect(margin + cardWidth + 15, yPos, 5, cardHeight, 3, 0, "F");
      doc.rect(margin + cardWidth + 17, yPos, 3, cardHeight, "F");
      
      doc.setTextColor(100);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`👤 ${t('admin.documentGenerator.fields.contactName', 'CONTATO').toUpperCase()}`, margin + cardWidth + 27, yPos + 10);
      
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(10);
      doc.text(fieldValues.contact_name.substring(0, 22), margin + cardWidth + 27, yPos + 22);
    }

    // Date card - full width
    yPos += cardHeight + 10;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, contentWidth, 22, 3, 3, "FD");
    
    // Date icon section
    doc.setFillColor(0, 51, 102);
    doc.roundedRect(margin, yPos, 25, 22, 3, 0, "F");
    doc.rect(margin + 10, yPos, 15, 22, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.text("📅", margin + 8, yPos + 14);
    
    doc.setTextColor(100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(t('admin.documentGenerator.fields.date', 'DATA').toUpperCase(), margin + 32, yPos + 9);
    
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(11);
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), margin + 32, yPos + 17);

    // Footer on cover with contact info
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("www.elpgreen.com", pageWidth / 2, pageHeight - 14, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("info@elpgreen.com | +39 350 102 1359", pageWidth / 2, pageHeight - 6, { align: "center" });

    // === CONTENT PAGES ===
    doc.addPage();
    yPos = 25;

    // Professional header with logo and document info
    const addPageHeader = () => {
      // Header background
      doc.setFillColor(250, 251, 253);
      doc.rect(0, 0, pageWidth, 20, "F");
      
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", margin, 4, 18, 9);
        } catch (e) {}
      }
      
      // Header line
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.5);
      doc.line(margin + 22, 14, pageWidth - margin, 14);
      
      // Document title in header
      doc.setFontSize(7);
      doc.setTextColor(80);
      doc.setFont("helvetica", "normal");
      doc.text(docTitle.substring(0, 45), pageWidth - margin, 10, { align: "right" });
      
      // Confidential badge
      doc.setFillColor(220, 53, 69);
      doc.roundedRect(pageWidth - margin - 25, 11, 25, 5, 1, 1, "F");
      doc.setTextColor(255);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text("CONFIDENCIAL", pageWidth - margin - 12.5, 14.5, { align: "center" });
    };
    
    addPageHeader();

    // Content section header with elegant design
    doc.setFillColor(0, 51, 102);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
    
    // Accent stripe
    doc.setFillColor(46, 125, 50);
    doc.rect(margin, yPos + 10, contentWidth, 2, "F");
    
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`📄 ${docTitle}`, margin + 5, yPos + 8);
    yPos += 22;

    // Parse and render content with smart page breaks
    doc.setTextColor(40);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Split content into paragraphs for smart page breaks
    const paragraphs = content.split(/\n\n+/);
    
    const addNewPage = () => {
      doc.addPage();
      yPos = 25;
      addPageHeader();
    };
    
    // Helper to check if a section header
    const isSectionHeader = (text: string): boolean => {
      return text.startsWith('#') || 
             text.startsWith('CLÁUSULA') || 
             text.startsWith('CLAUSE') || 
             text.startsWith('ARTÍCULO') ||
             /^[0-9]+\./.test(text.trim()) ||
             /^[IVXLCDM]+\./.test(text.trim());
    };
    
    // Helper to render a paragraph with proper formatting
    const renderParagraph = (paragraph: string) => {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) return;
      
      // Check if it's a header/title
      const isHeader = isSectionHeader(trimmedPara);
      const isBullet = trimmedPara.startsWith('-') || trimmedPara.startsWith('•') || /^[a-z]\)/.test(trimmedPara);
      
      // Calculate space needed for this paragraph
      let fontSize = 9;
      let lineHeight = 5;
      let textToRender = trimmedPara;
      
      if (isHeader) {
        // Remove markdown # symbols
        textToRender = trimmedPara.replace(/^#+\s*/, '');
        fontSize = trimmedPara.startsWith('##') ? 10 : 11;
        lineHeight = 6;
      } else if (isBullet) {
        fontSize = 8.5;
        lineHeight = 4.5;
      }
      
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(textToRender, contentWidth - (isBullet ? 12 : 6));
      const paragraphHeight = lines.length * lineHeight + (isHeader ? 8 : 4);
      
      // Smart page break: if paragraph won't fit, start new page
      // Exception: if it's too long, we'll have to split it
      if (yPos + paragraphHeight > maxY - 15 && paragraphHeight < maxY - 40) {
        addNewPage();
      }
      
      // Render header with special styling
      if (isHeader) {
        // Section header bar
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(0, 51, 102);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, yPos - 2, contentWidth, lines.length * lineHeight + 6, 1, 1, "FD");
        
        // Left accent bar
        doc.setFillColor(0, 51, 102);
        doc.rect(margin, yPos - 2, 3, lines.length * lineHeight + 6, "F");
        
        doc.setTextColor(0, 51, 102);
        doc.setFont("helvetica", "bold");
        
        lines.forEach((line: string, idx: number) => {
          if (yPos > maxY - 10) {
            addNewPage();
          }
          doc.text(line, margin + 8, yPos + 3);
          yPos += lineHeight;
        });
        
        yPos += 4;
      } else if (isBullet) {
        // Bullet point styling
        doc.setTextColor(50);
        doc.setFont("helvetica", "normal");
        
        // Bullet indicator
        doc.setFillColor(46, 125, 50);
        doc.circle(margin + 4, yPos + 1.5, 1.2, "F");
        
        lines.forEach((line: string, idx: number) => {
          if (yPos > maxY - 10) {
            addNewPage();
            doc.setFillColor(46, 125, 50);
            doc.circle(margin + 4, yPos + 1.5, 1.2, "F");
          }
          doc.text(line, margin + (idx === 0 ? 10 : 10), yPos + 2);
          yPos += lineHeight;
        });
        
        yPos += 2;
      } else {
        // Regular paragraph
        doc.setTextColor(40);
        doc.setFont("helvetica", "normal");
        
        lines.forEach((line: string) => {
          if (yPos > maxY - 10) {
            addNewPage();
          }
          doc.text(line, margin + 3, yPos);
          yPos += lineHeight;
        });
        
        yPos += 3;
      }
    };
    
    // Render all paragraphs with smart breaks
    paragraphs.forEach((paragraph) => {
      renderParagraph(paragraph);
    });

    // === SIGNATURE PAGE ===
    addNewPage();
    
    // Header
    doc.setFillColor(0, 51, 102);
    doc.roundedRect(margin, yPos - 2, contentWidth, 12, 2, 2, "F");
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`✍️ ${t('admin.documentGenerator.signature.title', 'Aceite e Assinatura do Documento')}`, margin + 4, yPos + 6);
    yPos += 18;

    // Partnership reminder
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, "F");
    doc.setTextColor(255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(t('admin.documentGenerator.signature.partnership', 'Global Partnership Opportunity'), pageWidth / 2, yPos + 5, { align: "center" });
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("Joint Venture Model - We bring technology, you bring resources", pageWidth / 2, yPos + 9.5, { align: "center" });
    yPos += 18;

    // Signatory info section
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, contentWidth, 50, 2, 2, "FD");
    
    doc.setFillColor(0, 51, 102);
    doc.roundedRect(margin, yPos, contentWidth, 8, 2, 0, "F");
    doc.rect(margin, yPos + 4, contentWidth, 4, "F");
    doc.setTextColor(255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(t('admin.documentGenerator.signature.signatoryInfo', 'Informações do Signatário'), margin + 4, yPos + 5.5);
    
    const fieldY = yPos + 14;
    const fieldColW = (contentWidth - 12) / 2;
    
    const formFields = [
      { label: t('admin.documentGenerator.fields.companyName', 'Nome da Empresa'), x: margin + 4, y: fieldY },
      { label: t('admin.documentGenerator.fields.representativeName', 'Nome do Representante'), x: margin + 4 + fieldColW + 4, y: fieldY },
      { label: t('admin.documentGenerator.fields.position', 'Cargo'), x: margin + 4, y: fieldY + 12 },
      { label: t('admin.documentGenerator.fields.email', 'E-mail'), x: margin + 4 + fieldColW + 4, y: fieldY + 12 },
      { label: t('admin.documentGenerator.fields.phone', 'Telefone'), x: margin + 4, y: fieldY + 24 },
      { label: t('admin.documentGenerator.fields.date', 'Data'), x: margin + 4 + fieldColW + 4, y: fieldY + 24 }
    ];
    
    formFields.forEach(field => {
      doc.setTextColor(80);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text(field.label + ":", field.x, field.y);
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);
      doc.line(field.x, field.y + 6, field.x + fieldColW - 4, field.y + 6);
    });
    
    yPos += 58;

    // Declaration
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(46, 125, 50);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, "FD");
    
    doc.setTextColor(50);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const declText = t('admin.documentGenerator.signature.declaration', 'Declaro que revisei e compreendi o documento apresentado acima. Manifesto minha concordância com os termos e condições aqui estabelecidos.');
    const declLines = doc.splitTextToSize(declText, contentWidth - 8);
    let declY = yPos + 6;
    declLines.forEach((line: string) => {
      doc.text(line, margin + 4, declY);
      declY += 4;
    });
    yPos += 28;

    // Signature boxes
    const sigBoxW = (contentWidth - 8) / 2;
    const sigBoxH = 42;
    
    // Partner signature box
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, sigBoxW, sigBoxH, 2, 2, "FD");
    
    doc.setFillColor(0, 51, 102);
    doc.roundedRect(margin, yPos, sigBoxW, 7, 2, 0, "F");
    doc.rect(margin, yPos + 3, sigBoxW, 4, "F");
    doc.setTextColor(255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(t('admin.documentGenerator.signature.partnerSignature', 'Assinatura do Parceiro'), margin + sigBoxW / 2, yPos + 5, { align: "center" });
    
    if (signature) {
      try {
        doc.addImage(signature.dataUrl, 'PNG', margin + 8, yPos + 10, 48, 18);
        
        // Verified badge
        doc.setFillColor(34, 139, 34);
        doc.roundedRect(margin + 5, yPos + sigBoxH - 10, 40, 7, 2, 2, "F");
        doc.setTextColor(255);
        doc.setFontSize(5);
        doc.text(`✓ ${t('admin.documentGenerator.signature.verified', 'ASSINATURA VERIFICADA')}`, margin + 25, yPos + sigBoxH - 6, { align: "center" });
      } catch (e) {}
    } else {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, yPos + 30, margin + sigBoxW - 10, yPos + 30);
    }
    
    doc.setTextColor(120);
    doc.setFontSize(4);
    doc.setFont("helvetica", "italic");
    doc.text(t('admin.documentGenerator.fields.date', 'Data'), margin + 10, yPos + 38);
    doc.line(margin + 10, yPos + 39, margin + 35, yPos + 39);
    
    // ELP signature box
    doc.setFillColor(240, 255, 240);
    doc.setDrawColor(46, 125, 50);
    doc.roundedRect(margin + sigBoxW + 8, yPos, sigBoxW, sigBoxH, 2, 2, "FD");
    
    doc.setFillColor(46, 125, 50);
    doc.roundedRect(margin + sigBoxW + 8, yPos, sigBoxW, 7, 2, 0, "F");
    doc.rect(margin + sigBoxW + 8, yPos + 3, sigBoxW, 4, "F");
    doc.setTextColor(255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("ELP Green Technology", margin + sigBoxW + 8 + sigBoxW / 2, yPos + 5, { align: "center" });
    
    doc.setDrawColor(180, 180, 180);
    doc.line(margin + sigBoxW + 18, yPos + 30, margin + sigBoxW * 2 - 2, yPos + 30);
    
    doc.setTextColor(120);
    doc.setFontSize(4);
    doc.text(t('admin.documentGenerator.fields.date', 'Data'), margin + sigBoxW + 18, yPos + 38);
    doc.line(margin + sigBoxW + 18, yPos + 39, margin + sigBoxW + 43, yPos + 39);
    
    yPos += sigBoxH + 8;

    // QR Code section
    if (qrCodeBase64) {
      const qrSectionHeight = 45;
      
      doc.setFillColor(248, 250, 255);
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, yPos, contentWidth, qrSectionHeight, 3, 3, "FD");
      
      const qrSize = 32;
      const qrX = margin + 8;
      const qrY = yPos + (qrSectionHeight - qrSize) / 2;
      
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.3);
      doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "S");
      
      try {
        doc.addImage(qrCodeBase64, "PNG", qrX, qrY, qrSize, qrSize);
      } catch (e) {}
      
      const textStartX = margin + qrSize + 20;
      
      doc.setTextColor(0, 51, 102);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`📱 ${t('admin.documentGenerator.qr.title', 'Complete Online')}`, textStartX, yPos + 12);
      
      doc.setTextColor(60);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(t('admin.documentGenerator.qr.description', 'Escaneie para acessar o formulário online'), textStartX, yPos + 20);
      
      doc.setTextColor(46, 125, 50);
      doc.setFontSize(5);
      doc.setFont("helvetica", "bold");
      doc.text(`🌐 https://www.elpgreen.com/contact`, textStartX, yPos + 28);
      
      doc.setFillColor(46, 125, 50);
      doc.roundedRect(textStartX, yPos + 32, 40, 7, 2, 2, "F");
      doc.setTextColor(255);
      doc.setFontSize(5);
      doc.text(t('admin.documentGenerator.qr.scan', 'Escaneie para Acessar'), textStartX + 20, yPos + 36.5, { align: "center" });
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.3);
      doc.line(margin, 282, pageWidth - margin, 282);
      
      doc.setFontSize(5);
      doc.setTextColor(0, 51, 102);
      doc.setFont("helvetica", "bold");
      doc.text("ELP Green Technology", margin, 286);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("www.elpgreen.com | info@elpgreen.com | +39 350 102 1359", margin, 290);
      
      doc.setTextColor(120);
      doc.text(t('admin.documentGenerator.pdf.confidential', 'Confidencial'), pageWidth / 2, 290, { align: "center" });
      
      doc.setFontSize(6);
      doc.setTextColor(0, 51, 102);
      doc.text(`${t('admin.documentGenerator.pagination.page', 'Página')} ${i} / ${totalPages}`, pageWidth - margin, 286, { align: "right" });
    }
    
    doc.save(fileName);
    return doc.output('blob');
  };

  const handleSignatureSave = async (signature: SignatureData) => {
    setPendingSignature(signature);
    setSignatureOpen(false);
    toast({ title: t('admin.documentGenerator.toast.signatureCaptured', 'Assinatura capturada!'), description: t('admin.documentGenerator.toast.clickToFinalize', 'Clique em "Gerar PDF Assinado" para finalizar.') });
  };

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: Partial<DocumentTemplate>) => {
      const payload = {
        name: template.name,
        type: template.type,
        content_pt: template.content_pt,
        content_en: template.content_en || template.content_pt,
        content_es: template.content_es || template.content_pt,
        content_zh: template.content_zh || template.content_pt,
        content_it: template.content_it || template.content_pt,
        fields: JSON.parse(JSON.stringify(template.fields || [])),
        is_active: template.is_active ?? true,
      };
      
      if (template.id) {
        const { error } = await supabase.from('document_templates').update(payload).eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('document_templates').insert({
          ...payload,
          name: payload.name || 'Novo Template',
          type: payload.type || 'contract',
          content_pt: payload.content_pt || '',
          content_en: payload.content_en || '',
          content_es: payload.content_es || '',
          content_zh: payload.content_zh || '',
          content_it: payload.content_it || '',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      setTemplateEditorOpen(false);
      setEditingTemplate(null);
      toast({ title: t('admin.documentGenerator.toast.templateSaved', 'Template salvo com sucesso!') });
    },
    onError: () => toast({ title: t('admin.documentGenerator.toast.templateSaveError', 'Erro ao salvar template'), variant: 'destructive' }),
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('document_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({ title: t('admin.documentGenerator.toast.templateDeleted', 'Template excluído!') });
    },
  });

  // Generate document mutation
  const generateDocMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !previewContent) return;

      const hasSignature = !!pendingSignature;
      const suffix = hasSignature ? '_ASSINADO' : '';
      const fileName = `${selectedTemplate.type.toUpperCase()}_${(fieldValues.company_name || fieldValues.contact_name || 'doc').replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}${suffix}.pdf`;
      
      generatePDF(previewContent, fileName, pendingSignature || undefined);

      let signatureHash: string | null = null;
      if (pendingSignature) {
        signatureHash = await generateHash(JSON.stringify(pendingSignature));
      }

      const leadIdToSave = selectedLead === 'none' ? null : selectedLead;
      
      // Multiple signers configuration
      const requiredSignatures = enableMultipleSignatures && signersList.length > 0 ? signersList.length : 1;
      const firstSigner = enableMultipleSignatures && signersList.length > 0 ? signersList[0] : null;

      const { data: insertedDoc, error } = await (supabase.from('generated_documents') as any).insert({
        template_id: selectedTemplate.id,
        lead_id: leadIdToSave,
        lead_type: leads?.find(l => l.id === leadIdToSave)?.type || null,
        document_name: fileName,
        document_type: selectedTemplate.type,
        field_values: {
          ...fieldValues,
          // Store signers list in field_values for reference
          ...(enableMultipleSignatures && signersList.length > 0 ? { signers_list: JSON.stringify(signersList) } : {}),
        },
        language: selectedLanguage,
        generated_by: user?.id,
        is_signed: hasSignature,
        signed_at: pendingSignature?.timestamp || null,
        signer_name: pendingSignature?.signerName || firstSigner?.name || null,
        signer_email: pendingSignature?.signerEmail || firstSigner?.email || null,
        signature_type: pendingSignature?.type || null,
        signature_hash: signatureHash,
        signature_data: pendingSignature ? JSON.parse(JSON.stringify(pendingSignature)) : null,
        // Multiple signatures fields
        required_signatures: requiredSignatures,
        current_signatures: hasSignature ? 1 : 0,
        signature_status: hasSignature ? (requiredSignatures > 1 ? 'partial' : 'complete') : 'pending',
        pending_signer_email: !hasSignature && firstSigner ? firstSigner.email : null,
        pending_signer_name: !hasSignature && firstSigner ? firstSigner.name : null,
        all_signatures_data: hasSignature && pendingSignature ? JSON.parse(JSON.stringify([pendingSignature])) : [],
      }).select('id').single();

      if (error) throw error;

      if (pendingSignature && insertedDoc) {
        await supabase.from('signature_log').insert({
          document_id: insertedDoc.id,
          signer_name: pendingSignature.signerName,
          signer_email: pendingSignature.signerEmail,
          signature_type: pendingSignature.type,
          signature_hash: signatureHash || '',
          timestamp: pendingSignature.timestamp,
        });
      }

      // If we have multiple signers and no signature yet, notify the first signer
      if (!hasSignature && insertedDoc && enableMultipleSignatures && signersList.length > 0) {
        const firstSignerToNotify = signersList[0];
        const signatureLink = SITE_URLS.signDocument(insertedDoc.id);
        
        try {
          await supabase.functions.invoke('send-document-signature-link', {
            body: {
              documentId: insertedDoc.id,
              documentName: fileName,
              recipientEmail: firstSignerToNotify.email,
              recipientName: firstSignerToNotify.name,
              signatureLink,
              language: selectedLanguage,
            },
          });
          
          toast({
            title: t('admin.documentGenerator.toast.firstSignerNotified', 'Primeiro signatário notificado'),
            description: `${t('admin.documentGenerator.toast.emailSentTo', 'E-mail enviado para')} ${firstSignerToNotify.email}`,
          });
        } catch (notifyErr) {
          console.error('Error notifying first signer:', notifyErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      setGenerateOpen(false);
      setPendingSignature(null);
      setFieldValues({});
      setPreviewContent('');
      setEnableMultipleSignatures(false);
      setSignersList([]);
      toast({ title: pendingSignature ? t('admin.documentGenerator.toast.signedDocumentGenerated', 'Documento assinado e gerado!') : t('admin.documentGenerator.toast.documentGenerated', 'Documento gerado com sucesso!') });
    },
    onError: () => toast({ title: t('admin.documentGenerator.toast.documentGenerateError', 'Erro ao gerar documento'), variant: 'destructive' }),
  });

  // Send document mutation
  const sendDocMutation = useMutation({
    mutationFn: async ({ docId, email }: { docId: string; email: string }) => {
      const doc = generatedDocs?.find(d => d.id === docId);
      if (!doc) return;

      await supabase.functions.invoke('send-reply-email', {
        body: {
          to: email,
          toName: doc.signer_name || email.split('@')[0],
          subject: `${t('admin.documentGenerator.share.documentSubject', 'Documento')}: ${doc.document_name}${doc.is_signed ? ` (${t('admin.documentGenerator.submissions.signedFilter', 'Assinado')})` : ''}`,
          message: `${t('admin.documentGenerator.share.attachedDocument', 'Segue em anexo o documento')} ${doc.document_name}.${doc.is_signed ? `\n\n✓ ${t('admin.documentGenerator.share.validSignature', 'Este documento possui assinatura digital válida conforme Lei 14.063/2020.')}` : ''}\n\n${t('admin.documentGenerator.share.regards', 'Atenciosamente')},\nELP Green Technology`,
          replyType: doc.is_signed ? 'document_signed' : 'document_received',
          documentName: doc.document_name,
          documentType: doc.document_type,
        },
      });

      await supabase.from('generated_documents').update({ sent_to_email: email, sent_at: new Date().toISOString() }).eq('id', docId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents'] });
      setShareDialogOpen(false);
      setDocumentToShare(null);
      setSendToEmail('');
      toast({ title: t('admin.documentGenerator.toast.documentSent', 'Documento enviado por email!') });
    },
  });

  // Copy share link
  const copyShareLink = (doc: GeneratedDocument) => {
    const link = SITE_URLS.document(doc.id);
    navigator.clipboard.writeText(link);
    toast({ title: t('admin.documentGenerator.toast.linkCopied', 'Link copiado!'), description: t('admin.documentGenerator.toast.linkCopiedDesc', 'O link foi copiado para a área de transferência.') });
  };

  const openNewTemplate = () => {
    setEditingTemplate({
      name: '',
      type: 'nda',
      content_pt: '',
      content_en: '',
      content_es: '',
      content_zh: '',
      content_it: '',
      fields: [],
      is_active: true,
    });
    setTemplateEditorOpen(true);
  };

  const openEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setTemplateEditorOpen(true);
  };

  const addFieldToTemplate = () => {
    if (!editingTemplate) return;
    const newField: TemplateField = { name: `field_${Date.now()}`, label: t('admin.documentGenerator.templateEditor.newField', 'Novo Campo'), type: 'text', required: false };
    setEditingTemplate({ ...editingTemplate, fields: [...(editingTemplate.fields || []), newField] });
  };

  const updateTemplateField = (index: number, updates: Partial<TemplateField>) => {
    if (!editingTemplate) return;
    const fields = [...(editingTemplate.fields || [])];
    fields[index] = { ...fields[index], ...updates };
    setEditingTemplate({ ...editingTemplate, fields });
  };

  const removeTemplateField = (index: number) => {
    if (!editingTemplate) return;
    const fields = [...(editingTemplate.fields || [])];
    fields.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, fields });
  };

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <p className="text-sm text-muted-foreground">
          {t('admin.documentGenerator.pagination.page', 'Página')} {currentPage} {t('admin.documentGenerator.pagination.of', 'de')} {totalPages}
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('admin.documentGenerator.pagination.previous', 'Anterior')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
          >
            {t('admin.documentGenerator.pagination.next', 'Próximo')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.documentGenerator.stats.totalGenerated', 'Total Gerados')}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.documentGenerator.stats.signed', 'Assinados')}</p>
                <p className="text-2xl font-bold">{stats.signed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500/10 to-sky-600/5 border-sky-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.documentGenerator.stats.sent', 'Enviados')}</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
              <Send className="h-8 w-8 text-sky-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.documentGenerator.stats.templates', 'Templates')}</p>
                <p className="text-2xl font-bold">{templates?.length || 0}</p>
              </div>
              <FileSignature className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.documentGenerator.stats.filled', 'Preenchidos')}</p>
                <p className="text-2xl font-bold">{stats.submissions}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="correct" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.documentGenerator.tabs.correct', 'Corrigir')}</span>
            <span className="sm:hidden">{t('admin.documentGenerator.tabs.correct', 'IA')}</span>
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.documentGenerator.tabs.generate', 'Gerar')}</span>
            <span className="sm:hidden">{t('admin.documentGenerator.tabs.generate', 'Gerar')}</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.documentGenerator.tabs.submissions', 'Preenchidos')}</span>
            <span className="sm:hidden">{t('admin.documentGenerator.tabs.submissions', 'Preench.')}</span>
            {stats.submissions > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{stats.submissions}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.documentGenerator.tabs.history', 'Histórico')}</span>
            <span className="sm:hidden">{t('admin.documentGenerator.tabs.history', 'Hist.')}</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileSignature className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.documentGenerator.tabs.templates', 'Templates')}</span>
            <span className="sm:hidden">{t('admin.documentGenerator.tabs.templates', 'Templ.')}</span>
          </TabsTrigger>
        </TabsList>

         {/* AI Document Correction Tab */}
         <TabsContent value="correct">
           <DocumentAICorrector />
         </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t('admin.documentGenerator.generate.title', 'Selecione um Template')}</CardTitle>
                  <CardDescription>{t('admin.documentGenerator.generate.description', 'Escolha o tipo de documento que deseja gerar')}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCollaborativeDialogOpen(true)} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    IA Colaborativa
                  </Button>
                  <BulkDocumentGenerator />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {templates?.filter(t => t.is_active).map((template) => {
                    const config = documentTypeConfig[template.type] || documentTypeConfig.contract;
                    const Icon = config.icon;
                    return (
                      <motion.div key={template.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/30 h-full" onClick={() => handleSelectTemplate(template)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${config.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate">{template.name}</CardTitle>
                                <CardDescription className="text-xs truncate">{config.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-1">
                              {['PT', 'EN', 'ES', 'ZH', 'IT'].map(lang => (
                                <Badge key={lang} variant="outline" className="text-xs px-1.5">{lang}</Badge>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">{template.fields?.length || 0} {t('admin.documentGenerator.generate.customizableFields', 'campos personalizáveis')}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Submissions Tab */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('admin.documentGenerator.submissions.title', 'Templates Preenchidos por Clientes')}
                  </CardTitle>
                  <CardDescription>{t('admin.documentGenerator.submissions.description', 'Documentos preenchidos e enviados por clientes/parceiros')}</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-emerald-500/10 text-emerald-600">{stats.submissionsSigned} {t('admin.documentGenerator.submissions.signed', 'assinados')}</Badge>
                  <Badge variant="outline">{stats.submissions - stats.submissionsSigned} {t('admin.documentGenerator.submissions.pending', 'pendentes')}</Badge>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('admin.documentGenerator.submissions.searchPlaceholder', 'Buscar por nome, email ou empresa...')}
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setSubmissionsPage(1); }} 
                    className="pl-9" 
                  />
                </div>
                <Select value={signatureFilter} onValueChange={(v) => { setSignatureFilter(v); setSubmissionsPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Shield className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('admin.documentGenerator.submissions.signatureFilter', 'Assinatura')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.documentGenerator.submissions.all', 'Todos')}</SelectItem>
                    <SelectItem value="signed">{t('admin.documentGenerator.submissions.signedFilter', '✓ Assinados')}</SelectItem>
                    <SelectItem value="pending">{t('admin.documentGenerator.submissions.pendingFilter', '⏳ Pendentes')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setSubmissionsPage(1); }}>
                  <SelectTrigger className="w-full sm:w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('admin.documentGenerator.submissions.typeFilter', 'Tipo')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.documentGenerator.submissions.all', 'Todos')}</SelectItem>
                    {Object.entries(documentTypeConfig).slice(0, 10).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : clientSubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t('admin.documentGenerator.submissions.noSubmissions', 'Nenhum template preenchido')}</p>
                  <p className="text-sm">{t('admin.documentGenerator.submissions.noSubmissionsDesc', 'Quando clientes preencherem templates, aparecerão aqui.')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedSubmissions.map((doc) => {
                      const config = documentTypeConfig[doc.document_type] || documentTypeConfig.contract;
                      const Icon = config.icon;
                      const fieldVals = doc.field_values || {};
                      const companyName = fieldVals.razao_social || fieldVals.company_name || '-';
                      const contactName = fieldVals.representante || fieldVals.contact_name || doc.signer_name || '-';
                      const email = fieldVals.email || doc.signer_email || '-';
                      
                      return (
                        <motion.div 
                          key={doc.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer ${doc.is_signed ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-400'}`}
                          onClick={() => { setSelectedSubmission(doc); setSubmissionDetailOpen(true); }}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                              <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="font-medium truncate">{companyName}</span>
                                  {doc.is_signed ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 text-xs flex-shrink-0">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      {t('admin.documentGenerator.history.signed', 'Assinado')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs flex-shrink-0">
                                      <FileClock className="h-3 w-3 mr-1" />
                                      {t('admin.documentGenerator.submissions.pending', 'Pendente')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{contactName}</span>
                                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">{config.label}</Badge>
                                  <Badge variant="outline" className="text-xs">{doc.language.toUpperCase()}</Badge>
                                  <span>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateLocale() })}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 self-end lg:self-center">
                              <Button size="sm" variant="outline" title={t('admin.documentGenerator.submissionDetail.viewDetails', 'Ver Detalhes')}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <PaginationControls 
                    currentPage={submissionsPage} 
                    totalPages={submissionsTotalPages} 
                    onPageChange={setSubmissionsPage} 
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t('admin.documentGenerator.history.title', 'Documentos Gerados')}</CardTitle>
                  <CardDescription>{t('admin.documentGenerator.history.description', 'Histórico completo de documentos')}</CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={t('admin.documentGenerator.history.searchPlaceholder', 'Buscar documentos...')}
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setHistoryPage(1); }} 
                    className="pl-9" 
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setHistoryPage(1); }}>
                  <SelectTrigger className="w-full sm:w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t('admin.documentGenerator.history.typeFilter', 'Tipo')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.documentGenerator.submissions.all', 'Todos')}</SelectItem>
                    {Object.entries(documentTypeConfig).slice(0, 10).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{t('admin.documentGenerator.history.noDocuments', 'Nenhum documento encontrado')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedHistory.map((doc) => {
                      const config = documentTypeConfig[doc.document_type] || documentTypeConfig.contract;
                      const Icon = config.icon;
                      return (
                        <div key={doc.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${doc.is_signed ? 'border-l-4 border-l-emerald-500' : ''}`}>
                          <div className="flex items-start sm:items-center gap-4 min-w-0">
                            <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium flex flex-wrap items-center gap-2">
                                <span className="truncate">{doc.document_name}</span>
                                {doc.is_signed && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 text-xs flex-shrink-0">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t('admin.documentGenerator.history.signed', 'Assinado')}
                                  </Badge>
                                )}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm', { locale: getDateLocale() })}</span>
                                <Badge variant="outline" className="text-xs">{doc.language.toUpperCase()}</Badge>
                                {doc.sent_at && (
                                  <Badge className="bg-sky-500/10 text-sky-600 text-xs">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {t('admin.documentGenerator.history.sent', 'Enviado')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                            <Button size="sm" variant="outline" title={t('admin.documentGenerator.submissionDetail.downloadPdf', 'Baixar')}><Download className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" title={t('admin.documentGenerator.share.title', 'Compartilhar')} onClick={() => { setDocumentToShare(doc); setShareDialogOpen(true); }}><Share2 className="h-4 w-4" /></Button>
                            {!doc.is_signed && (
                              <Button size="sm" variant="outline" className="text-emerald-600" title={t('admin.documentGenerator.signature.sign', 'Assinar')} onClick={() => setDocumentToSign(doc)}><Pen className="h-4 w-4" /></Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <PaginationControls 
                    currentPage={historyPage} 
                    totalPages={historyTotalPages} 
                    onPageChange={setHistoryPage} 
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t('admin.documentGenerator.templates.title', 'Templates Disponíveis')}</CardTitle>
                  <CardDescription>{t('admin.documentGenerator.templates.description', 'Gerencie os modelos de documentos')}</CardDescription>
                </div>
                <Button onClick={openNewTemplate} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.documentGenerator.templates.newTemplate', 'Novo Template')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {templates?.map((template) => {
                    const config = documentTypeConfig[template.type] || documentTypeConfig.contract;
                    const Icon = config.icon;
                    return (
                      <div key={template.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium truncate">{template.name}</span>
                              <Badge className={config.color}>{config.label}</Badge>
                              {!template.is_active && <Badge variant="secondary">{t('admin.documentGenerator.templates.inactive', 'Inativo')}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{template.fields?.length || 0} {t('admin.documentGenerator.templates.fields', 'campos')} · {config.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                          <Button size="sm" variant="ghost" onClick={() => handleSelectTemplate(template)} title={t('admin.documentGenerator.templates.use', 'Usar')}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => openEditTemplate(template)} title={t('admin.documentGenerator.templates.edit', 'Editar')}><Edit className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive" title={t('admin.documentGenerator.templates.delete', 'Excluir')}><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('admin.documentGenerator.templates.deleteConfirmTitle', 'Excluir template?')}</AlertDialogTitle>
                                <AlertDialogDescription>{t('admin.documentGenerator.templates.deleteConfirmDesc', 'Esta ação não pode ser desfeita.')}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('admin.documentGenerator.generate.cancel', 'Cancelar')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTemplateMutation.mutate(template.id)}>{t('admin.documentGenerator.templates.delete', 'Excluir')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Document Dialog */}
      <Dialog open={generateOpen} onOpenChange={(open) => {
        setGenerateOpen(open);
        if (!open) {
          setSelectedTemplate(null);
          setPreviewContent('');
          setFieldValues({});
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('admin.documentGenerator.generate.generateDocument', 'Gerar')} {selectedTemplate?.name || t('admin.documentGenerator.history.document', 'Documento')}
            </DialogTitle>
            <DialogDescription>{t('admin.documentGenerator.generate.fillFieldsOrSelectLead', 'Preencha os campos ou selecione um lead existente')}</DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Side */}
                <div className="space-y-4">
                  {/* AI Fill Button */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="font-medium">{t('admin.documentGenerator.ai.title', 'Preenchimento com IA')}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">Beta</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-xs">{t('admin.documentGenerator.ai.jurisdiction', 'Jurisdição')}</Label>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger className="h-9">
                            <MapPin className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countryOptions.map((c) => (
                              <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">{t('admin.documentGenerator.generate.language', 'Idioma')}</Label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="h-9">
                            <Globe className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(languageLabels).map(([code, label]) => (
                              <SelectItem key={code} value={code}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAIFill} 
                      disabled={isGeneratingAI}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('admin.documentGenerator.ai.generating', 'Gerando...')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          {t('admin.documentGenerator.ai.fillWithAI', 'Preencher com IA')}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {t('admin.documentGenerator.ai.hint', 'A IA preencherá os campos com base nas leis do país selecionado')}
                    </p>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('admin.documentGenerator.generate.manualFill', 'Preenchimento Manual')}</span>
                    </div>
                    <Switch checked={manualEntryMode} onCheckedChange={setManualEntryMode} />
                  </div>

                  {!manualEntryMode && (
                    <div>
                      <Label>{t('admin.documentGenerator.generate.selectLead', 'Selecionar Lead')}</Label>
                      <Select value={selectedLead} onValueChange={handleSelectLead}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.documentGenerator.generate.selectExistingLead', 'Escolha um lead existente')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('admin.documentGenerator.generate.noneManual', 'Nenhum (manual)')}</SelectItem>
                          {leads?.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>{lead.name} - {lead.company || lead.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedTemplate?.fields?.map((field) => (
                      <div key={field.name}>
                        <Label className="text-sm">{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        {field.type === 'textarea' ? (
                          <Textarea value={fieldValues[field.name] || ''} onChange={(e) => setFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))} placeholder={field.placeholder || field.label} rows={3} />
                        ) : field.type === 'select' && field.options ? (
                          <Select value={fieldValues[field.name] || 'placeholder_empty'} onValueChange={(v) => setFieldValues(prev => ({ ...prev, [field.name]: v === 'placeholder_empty' ? '' : v }))}>
                            <SelectTrigger><SelectValue placeholder={`${t('admin.documentGenerator.templateEditor.selectPlaceholder', 'Selecione')} ${field.label}`} /></SelectTrigger>
                            <SelectContent>
                              {field.options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={fieldValues[field.name] || ''} onChange={(e) => setFieldValues(prev => ({ ...prev, [field.name]: e.target.value }))} placeholder={field.placeholder || field.label} />
                        )}
                      </div>
                    ))}
                  </div>

                  <Button onClick={handlePreview} variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    {t('admin.documentGenerator.generate.preview', 'Pré-visualizar')}
                  </Button>

                  {/* Multiple Signers Section */}
                  {previewContent && (
                    <MultipleSignersManager
                      signers={signersList}
                      onSignersChange={setSignersList}
                      enableMultipleSignatures={enableMultipleSignatures}
                      onEnableMultipleSignaturesChange={setEnableMultipleSignatures}
                    />
                  )}

                  {/* Signature Section */}
                  {previewContent && !enableMultipleSignatures && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label className="flex items-center gap-2"><Pen className="h-4 w-4" />{t('admin.documentGenerator.generate.signatureOptional', 'Assinatura Digital (Opcional)')}</Label>
                      
                      {pendingSignature ? (
                        <div className="space-y-2">
                          <SignatureVerification signature={pendingSignature} />
                          <Button variant="outline" size="sm" onClick={() => setPendingSignature(null)} className="w-full"><X className="h-4 w-4 mr-2" />{t('admin.documentGenerator.generate.removeSignature', 'Remover Assinatura')}</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" onClick={() => setSignatureOpen(true)}><Pen className="h-4 w-4 mr-2" />{t('admin.documentGenerator.generate.simpleSignature', 'Assinatura Simples')}</Button>
                          <Button variant="outline" className="border-primary/50 text-primary" onClick={() => setIcpPortalOpen(true)}><Shield className="h-4 w-4 mr-2" />{t('admin.documentGenerator.generate.icpBrasil', 'ICP-Brasil')}</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preview Side */}
                <div className="space-y-4">
                  <Label>{t('admin.documentGenerator.generate.previewDocument', 'Pré-visualização')}</Label>
                  <ScrollArea className="h-[400px] rounded-lg border bg-white dark:bg-slate-950 p-4">
                    {previewContent ? (
                      <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">{previewContent}</pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>{t('admin.documentGenerator.generate.fillAndPreview', 'Preencha os campos e clique em "Pré-visualizar"')}</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>{t('admin.documentGenerator.generate.cancel', 'Cancelar')}</Button>
                <Button onClick={() => generateDocMutation.mutate()} disabled={!previewContent || generateDocMutation.isPending}>
                  {generateDocMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  {pendingSignature ? t('admin.documentGenerator.generate.generateSignedPdf', 'Gerar PDF Assinado') : t('admin.documentGenerator.generate.generatePdf', 'Gerar PDF')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate?.id ? t('admin.documentGenerator.templateEditor.editTemplate', 'Editar Template') : t('admin.documentGenerator.templateEditor.newTemplate', 'Novo Template')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.documentGenerator.templateEditor.templateName', 'Nome do Template')}</Label>
                <Input value={editingTemplate?.name || ''} onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: NDA Bilateral" />
              </div>
              <div>
                <Label>{t('admin.documentGenerator.templateEditor.type', 'Tipo')}</Label>
                <Select value={editingTemplate?.type || 'nda'} onValueChange={(v) => setEditingTemplate(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label} - {val.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={editingTemplate?.is_active ?? true} onCheckedChange={(v) => setEditingTemplate(prev => ({ ...prev, is_active: v }))} />
              <Label>{t('admin.documentGenerator.templateEditor.activeTemplate', 'Template Ativo')}</Label>
            </div>

            {/* Fields Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('admin.documentGenerator.templateEditor.customizableFields', 'Campos Personalizáveis')}</Label>
                <Button size="sm" variant="outline" onClick={addFieldToTemplate}><Plus className="h-4 w-4 mr-1" />{t('admin.documentGenerator.templateEditor.addField', 'Adicionar Campo')}</Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {editingTemplate?.fields?.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                    <Input value={field.name} onChange={(e) => updateTemplateField(index, { name: e.target.value })} placeholder="nome_campo" className="w-32" />
                    <Input value={field.label} onChange={(e) => updateTemplateField(index, { label: e.target.value })} placeholder="Label" className="flex-1" />
                    <Select value={field.type} onValueChange={(v) => updateTemplateField(index, { type: v })}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">{t('admin.documentGenerator.templateEditor.fieldTypes.text', 'Texto')}</SelectItem>
                        <SelectItem value="textarea">{t('admin.documentGenerator.templateEditor.fieldTypes.textarea', 'Área de Texto')}</SelectItem>
                        <SelectItem value="number">{t('admin.documentGenerator.templateEditor.fieldTypes.number', 'Número')}</SelectItem>
                        <SelectItem value="date">{t('admin.documentGenerator.templateEditor.fieldTypes.date', 'Data')}</SelectItem>
                        <SelectItem value="select">{t('admin.documentGenerator.templateEditor.fieldTypes.select', 'Seleção')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" onClick={() => removeTemplateField(index)} className="text-destructive h-8 w-8"><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.documentGenerator.templateEditor.fieldHint', 'Use {{nome_campo}} no conteúdo do template para inserir valores dinâmicos.')}</p>
            </div>

            {/* Content by Language */}
            <Tabs defaultValue="pt" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                {Object.entries(languageLabels).map(([code, label]) => (
                  <TabsTrigger key={code} value={code} className="text-xs">{code.toUpperCase()}</TabsTrigger>
                ))}
              </TabsList>
              {Object.keys(languageLabels).map((lang) => (
                <TabsContent key={lang} value={lang}>
                  <Label>{t('admin.documentGenerator.templateEditor.content', 'Conteúdo')} ({languageLabels[lang]})</Label>
                  <Textarea
                    value={(editingTemplate as any)?.[`content_${lang}`] || ''}
                    onChange={(e) => setEditingTemplate(prev => ({ ...prev, [`content_${lang}`]: e.target.value }))}
                    rows={12}
                    placeholder={`${t('admin.documentGenerator.templateEditor.contentPlaceholder', 'Conteúdo do documento em')} ${languageLabels[lang]}...\n\n${t('admin.documentGenerator.templateEditor.fieldHint', 'Use {{campo}} para inserir valores dinâmicos.')}`}
                    className="font-mono text-sm"
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateEditorOpen(false)}>{t('admin.documentGenerator.generate.cancel', 'Cancelar')}</Button>
            <Button onClick={() => editingTemplate && saveTemplateMutation.mutate(editingTemplate)} disabled={saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t('admin.documentGenerator.templateEditor.saveTemplate', 'Salvar Template')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />{t('admin.documentGenerator.share.title', 'Compartilhar Documento')}</DialogTitle>
            <DialogDescription>{documentToShare?.document_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('admin.documentGenerator.share.sendByEmail', 'Enviar por Email')}</Label>
              <div className="flex gap-2">
                <Input value={sendToEmail} onChange={(e) => setSendToEmail(e.target.value)} placeholder="email@exemplo.com" type="email" />
                <Button onClick={() => documentToShare && sendDocMutation.mutate({ docId: documentToShare.id, email: sendToEmail })} disabled={!sendToEmail || sendDocMutation.isPending}>
                  {sendDocMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t('admin.documentGenerator.share.or', 'ou')}</span></div>
            </div>
            <div>
              <Label>{t('admin.documentGenerator.share.copyLink', 'Copiar Link')}</Label>
              <div className="flex gap-2">
                <Input value={documentToShare ? `${window.location.origin}/documents/${documentToShare.id}` : ''} readOnly />
                <Button variant="outline" onClick={() => documentToShare && copyShareLink(documentToShare)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Pad Dialog */}
      <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t('admin.documentGenerator.signature.digitalSignature', 'Assinatura Digital')}</DialogTitle></DialogHeader>
          <SignaturePad onSave={handleSignatureSave} onCancel={() => setSignatureOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* ICP Signature Portal */}
      {icpPortalOpen && (
        <Dialog open={icpPortalOpen} onOpenChange={setIcpPortalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ELPSignaturePortal
              documentTitle={selectedTemplate?.name || t('admin.documentGenerator.history.document', 'Documento')}
              documentContent={previewContent || ''}
              signerName={fieldValues.contact_name}
              signerEmail={fieldValues.email}
              signerCompany={fieldValues.company_name}
              onComplete={(data) => {
                setPendingICPSignature(data);
                setPendingSignature({
                  dataUrl: data.dataUrl,
                  timestamp: data.timestamp,
                  signerName: data.signerName,
                  signerEmail: data.signerEmail,
                  type: 'typed',
                });
                setIcpPortalOpen(false);
                toast({ title: t('admin.documentGenerator.toast.icpSignatureRegistered', 'Assinatura ICP-Brasil registrada!') });
              }}
              onCancel={() => setIcpPortalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Submission Detail Dialog */}
      <Dialog open={submissionDetailOpen} onOpenChange={setSubmissionDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('admin.documentGenerator.submissionDetail.title', 'Detalhes do Template Preenchido')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.documentGenerator.submissionDetail.description', 'Informações enviadas pelo cliente/parceiro')}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {selectedSubmission.is_signed ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 text-sm py-1 px-3">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {t('admin.documentGenerator.submissionDetail.documentSigned', 'Documento Assinado')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-400 text-sm py-1 px-3">
                    <FileClock className="h-4 w-4 mr-1" />
                    {t('admin.documentGenerator.submissionDetail.signaturePending', 'Assinatura Pendente')}
                  </Badge>
                )}
                <Badge variant="outline">{selectedSubmission.language.toUpperCase()}</Badge>
                <Badge variant="outline">
                  {documentTypeConfig[selectedSubmission.document_type]?.label || selectedSubmission.document_type}
                </Badge>
              </div>

              {/* Document Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">📄 {t('admin.documentGenerator.submissionDetail.document', 'Documento')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.documentGenerator.submissionDetail.name', 'Nome')}:</span>
                    <span className="font-medium">{selectedSubmission.document_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('admin.documentGenerator.submissionDetail.sentAt', 'Enviado em')}:</span>
                    <span>{format(new Date(selectedSubmission.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: getDateLocale() })}</span>
                  </div>
                  {selectedSubmission.template_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Template ID:</span>
                      <span className="font-mono text-xs">{selectedSubmission.template_id.slice(0, 8)}...</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Signature Info */}
              {selectedSubmission.is_signed && (
                <Card className="border-emerald-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-emerald-600 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t('admin.documentGenerator.submissionDetail.signatureValidation', 'Validação de Assinatura')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.documentGenerator.submissionDetail.signedBy', 'Assinante')}:</span>
                      <span className="font-medium">{selectedSubmission.signer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedSubmission.signer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.documentGenerator.submissionDetail.type', 'Tipo')}:</span>
                      <span>{selectedSubmission.signature_type === 'drawn' ? t('admin.documentGenerator.submissionDetail.drawnSignature', 'Manuscrita Digital') : t('admin.documentGenerator.submissionDetail.typedSignature', 'Digitada')}</span>
                    </div>
                    {selectedSubmission.signed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('admin.documentGenerator.submissionDetail.dateTime', 'Data/Hora')}:</span>
                        <span>{format(new Date(selectedSubmission.signed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: getDateLocale() })}</span>
                      </div>
                    )}
                    {selectedSubmission.signature_hash && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground text-xs">{t('admin.documentGenerator.submissionDetail.sha256Hash', 'Hash SHA-256')}:</span>
                        <p className="font-mono text-xs break-all mt-1 bg-muted/50 p-2 rounded">{selectedSubmission.signature_hash}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Field Values */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('admin.documentGenerator.submissionDetail.filledFields', '📝 Campos Preenchidos')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedSubmission.field_values || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-4 py-1 border-b border-border/50 last:border-0">
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-medium text-right">{value || '-'}</span>
                      </div>
                    ))}
                    {Object.keys(selectedSubmission.field_values || {}).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">{t('admin.documentGenerator.submissionDetail.noFields', 'Nenhum campo preenchido')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSubmissionDetailOpen(false)} className="flex-1">
                  {t('admin.documentGenerator.submissionDetail.close', 'Fechar')}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { 
                    setDocumentToShare(selectedSubmission); 
                    setShareDialogOpen(true);
                    setSubmissionDetailOpen(false);
                  }}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {t('admin.documentGenerator.submissionDetail.reply', 'Responder')}
                </Button>
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin.documentGenerator.submissionDetail.downloadPdf', 'Baixar PDF')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collaborative AI Document Generator */}
      <CollaborativeDocumentDialog
        open={collaborativeDialogOpen}
        onOpenChange={setCollaborativeDialogOpen}
        onDocumentGenerated={(content, docType) => {
          setPreviewContent(content);
          toast({
            title: '✨ Documento gerado com IA colaborativa',
            description: 'O conteúdo foi aplicado. Revise e ajuste conforme necessário.',
          });
        }}
        defaultValues={{
          companyName: fieldValues.company_name,
          contactName: fieldValues.contact_name,
          email: fieldValues.email,
          country: selectedCountry,
        }}
      />
    </div>
  );
}
