import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SITE_URLS } from '@/lib/siteConfig';
import { motion } from 'framer-motion';
import {
  FileText,
  Globe,
  Download,
  Send,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileSignature,
  Pen,
  Shield,
  Lock,
  Upload,
  X,
  File,
  CheckSquare,
  Copy,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import logoElp from '@/assets/logo-elp.png';
import { format } from 'date-fns';
import SignaturePad from 'signature_pad';
import { generateTemplateDocumentPDF, type TemplateDocumentData } from '@/lib/generateTemplateDocumentPDF';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

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
}

const languageLabels: Record<string, { label: string; flag: string }> = {
  pt: { label: 'Português', flag: '🇧🇷' },
  en: { label: 'English', flag: '🇺🇸' },
  es: { label: 'Español', flag: '🇪🇸' },
  zh: { label: '中文', flag: '🇨🇳' },
  it: { label: 'Italiano', flag: '🇮🇹' },
};

const typeLabels: Record<string, string> = {
  nda_bilateral: 'NDA Bilateral',
  kyc: 'KYC / Due Diligence',
  joint_venture: 'Joint Venture',
  consent: 'LGPD/GDPR Consent',
  nda: 'NDA',
  contract: 'Contract',
  loi: 'Letter of Intent',
  mou: 'Memorandum of Understanding',
};

interface SignatureData {
  dataUrl: string;
  timestamp: string;
  signerName: string;
  signerEmail: string;
  type: 'drawn' | 'typed';
}

export default function TemplateViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'pt');
  const [downloadLanguage, setDownloadLanguage] = useState(i18n.language || 'pt');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { file: File; name: string }>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [generatedDocumentId, setGeneratedDocumentId] = useState<string | null>(null);
  
  // Signature states
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize signature pad
  useEffect(() => {
    if (signatureDialogOpen && signatureType === 'drawn' && signatureCanvasRef.current) {
      signaturePadRef.current = new SignaturePad(signatureCanvasRef.current, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      });
    }
    return () => {
      signaturePadRef.current = null;
    };
  }, [signatureDialogOpen, signatureType]);

  // Fetch template
  const { data: template, isLoading, error } = useQuery({
    queryKey: ['public-template', id],
    queryFn: async () => {
      if (!id) throw new Error('No template ID');
      const { data, error } = await (supabase as any)
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      
      let fields: TemplateField[] = [];
      try {
        if (typeof data.fields === 'string') {
          fields = JSON.parse(data.fields) || [];
        } else if (Array.isArray(data.fields)) {
          fields = data.fields;
        }
      } catch (e) {
        console.error('Error parsing fields', e);
        fields = [];
      }
      
      return { ...data, fields } as DocumentTemplate;
    },
    enabled: !!id,
  });

  const getContentByLanguage = (lang: string) => {
    if (!template) return '';
    const contentMap: Record<string, string> = {
      pt: template.content_pt,
      en: template.content_en,
      es: template.content_es,
      zh: template.content_zh,
      it: template.content_it,
    };
    return contentMap[lang] || template.content_pt;
  };

  // Update preview when fields or language change
  useEffect(() => {
    if (!template) return;
    let content = getContentByLanguage(selectedLanguage);
    
    // Replace template variables with field values
    Object.entries(fieldValues).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    });
    
    setPreviewContent(content);
  }, [template, fieldValues, selectedLanguage]);

  // Generate SHA-256 hash
  const generateHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Generate PDF with professional design
  const generatePDF = async (signature?: SignatureData | null, signatureHash?: string | null) => {
    if (!template || !previewContent) return;
    
    const documentData: TemplateDocumentData = {
      templateName: template.name,
      templateType: template.type,
      content: previewContent,
      language: selectedLanguage as 'pt' | 'en' | 'es' | 'zh' | 'it',
      fieldValues,
      checkboxValues,
      uploadedFiles: Object.values(uploadedFiles).map(f => f.name),
      signatureData: signature || undefined,
      signatureHash: signatureHash || undefined,
    };
    
    await generateTemplateDocumentPDF(documentData);
  };

  // Capture signature
  const handleCaptureSignature = () => {
    if (!signerName || !signerEmail) {
      toast({
        title: t('templateViewer.signatureRequired', 'Preencha nome e email'),
        variant: 'destructive',
      });
      return;
    }

    let dataUrl = '';
    if (signatureType === 'drawn') {
      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
        toast({
          title: t('templateViewer.drawSignature', 'Desenhe sua assinatura'),
          variant: 'destructive',
        });
        return;
      }
      dataUrl = signaturePadRef.current.toDataURL('image/png');
    } else {
      // Create typed signature as image
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 100);
        ctx.font = 'italic 32px "Brush Script MT", cursive';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedSignature || signerName, 150, 50);
      }
      dataUrl = canvas.toDataURL('image/png');
    }

    const signature: SignatureData = {
      dataUrl,
      timestamp: new Date().toISOString(),
      signerName,
      signerEmail,
      type: signatureType,
    };

    setSignatureData(signature);
    setSignatureDialogOpen(false);
    toast({
      title: t('templateViewer.signatureCaptured', 'Assinatura capturada!'),
      description: t('templateViewer.clickSubmit', 'Agora clique em "Enviar Documento".'),
    });
  };

  // Clear signature
  const handleClearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!template) throw new Error('No template');
      
      let signatureHash: string | null = null;
      if (signatureData) {
        signatureHash = await generateHash(JSON.stringify(signatureData));
      }
      
      // Combine all field values including checkboxes
      const allFieldValues = {
        ...fieldValues,
        ...Object.fromEntries(
          Object.entries(checkboxValues).map(([k, v]) => [k, v ? 'Sim / Yes ✓' : 'Não / No'])
        ),
        uploadedFiles: Object.keys(uploadedFiles),
      };

      // Determine if document requires multiple signatures (bilateral NDAs, joint ventures, etc.)
      const requiresMultipleSignatures = ['nda_bilateral', 'joint_venture', 'mou'].includes(template.type);
      const requiredSignatures = requiresMultipleSignatures ? 2 : 1;
      
      // Get second signer info from field values
      const secondSignerEmail = fieldValues.second_signer_email || fieldValues.contraparte_email || fieldValues.partner_email;
      const secondSignerName = fieldValues.second_signer_name || fieldValues.contraparte_nome || fieldValues.partner_name;

      // Save to generated_documents (cast to any to handle new columns not yet in types)
      const { data: insertedDoc, error } = await (supabase.from('generated_documents') as any).insert({
        template_id: template.id,
        document_name: `${template.name} - ${fieldValues.razao_social || fieldValues.company_name || 'Preenchido'}`,
        document_type: template.type,
        field_values: allFieldValues,
        language: selectedLanguage,
        is_signed: signatureData && !requiresMultipleSignatures,
        signed_at: signatureData?.timestamp || null,
        signer_name: signatureData?.signerName || null,
        signer_email: signatureData?.signerEmail || null,
        signature_type: signatureData?.type || null,
        signature_hash: signatureHash,
        signature_data: signatureData ? JSON.parse(JSON.stringify(signatureData)) : null,
        // Multiple signatures fields
        required_signatures: requiredSignatures,
        current_signatures: signatureData ? 1 : 0,
        all_signatures_data: signatureData ? [signatureData] : [],
        pending_signer_email: requiresMultipleSignatures && signatureData ? secondSignerEmail : null,
        pending_signer_name: requiresMultipleSignatures && signatureData ? secondSignerName : null,
        signature_status: signatureData 
          ? (requiresMultipleSignatures ? 'partial' : 'complete') 
          : 'pending',
      }).select('id').single();
      
      if (error) throw error;
      
      // Store the generated document ID for the success screen
      if (insertedDoc) {
        setGeneratedDocumentId(insertedDoc.id);
      }

      // Upload files to storage if any
      if (Object.keys(uploadedFiles).length > 0 && insertedDoc) {
        for (const [fieldName, fileData] of Object.entries(uploadedFiles)) {
          const filePath = `${insertedDoc.id}/${fieldName}_${fileData.name}`;
          await supabase.storage.from('lead-documents').upload(filePath, fileData.file);
        }
      }

      // Log signature
      if (signatureData && insertedDoc) {
        await supabase.from('signature_log').insert({
          document_id: insertedDoc.id,
          signer_name: signatureData.signerName,
          signer_email: signatureData.signerEmail,
          signature_type: signatureData.type,
          signature_hash: signatureHash || '',
          timestamp: signatureData.timestamp,
        });
      }

      // Send notification email to admin
      await supabase.functions.invoke('notify-template-submission', {
        body: {
          documentId: insertedDoc?.id,
          templateName: template.name,
          templateType: template.type,
          fieldValues,
          language: selectedLanguage,
          isSigned: !!signatureData,
          signatureHash,
          signedAt: signatureData?.timestamp,
          signerName: signatureData?.signerName,
          signerEmail: signatureData?.signerEmail,
        },
      });

      // Send automatic email with signature link
      const recipientEmail = fieldValues.email || fieldValues.contact_email || signatureData?.signerEmail;
      const recipientName = fieldValues.representante || fieldValues.contact_name || fieldValues.nome || signatureData?.signerName || 'Partner';
      const companyName = fieldValues.razao_social || fieldValues.company_name || fieldValues.empresa;
      
      // If no signature yet, send signature link to primary signer
      if (recipientEmail && insertedDoc && !signatureData) {
        console.log('Sending signature link email to:', recipientEmail);
        try {
          await supabase.functions.invoke('send-document-signature-link', {
            body: {
              documentId: insertedDoc.id,
              documentName: `${template.name} - ${companyName || 'Document'}`,
              templateType: template.type,
              recipientEmail,
              recipientName,
              companyName,
              language: selectedLanguage,
              fieldValues,
              isFirstSigner: true,
              requiresMultipleSignatures,
            },
          });
          console.log('Signature link email sent successfully');
        } catch (emailError) {
          console.error('Error sending signature link email:', emailError);
        }
      }
      
      // If document requires multiple signatures and first signature is done, send to second signer
      if (requiresMultipleSignatures && signatureData && secondSignerEmail && insertedDoc) {
        console.log('Sending signature link to second signer:', secondSignerEmail);
        try {
          await supabase.functions.invoke('send-document-signature-link', {
            body: {
              documentId: insertedDoc.id,
              documentName: `${template.name} - ${companyName || 'Document'}`,
              templateType: template.type,
              recipientEmail: secondSignerEmail,
              recipientName: secondSignerName || 'Partner',
              companyName,
              language: selectedLanguage,
              fieldValues,
              isFirstSigner: false,
              requiresMultipleSignatures: true,
              firstSignerName: signatureData.signerName,
            },
          });
          console.log('Second signer signature link email sent successfully');
        } catch (emailError) {
          console.error('Error sending second signer email:', emailError);
        }
      }

      // Generate PDF
      await generatePDF(signatureData, signatureHash || undefined);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: t('templateViewer.submitSuccess', 'Formulário enviado com sucesso!'),
        description: t('templateViewer.submitDescription', 'Entraremos em contato em breve.'),
      });
    },
    onError: () => {
      toast({
        title: t('templateViewer.submitError', 'Erro ao enviar'),
        description: t('templateViewer.tryAgain', 'Tente novamente.'),
        variant: 'destructive',
      });
    },
  });

  const handleFieldChange = (name: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCheckboxValues(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [name]: { file, name: file.name } }));
    } else {
      setUploadedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[name];
        return newFiles;
      });
    }
  };

  const handleRemoveFile = (name: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[name];
      return newFiles;
    });
    if (fileInputRefs.current[name]) {
      fileInputRefs.current[name]!.value = '';
    }
  };

  const handleSubmit = async () => {
    // No validation required - submit directly
    submitMutation.mutate();
  };

  const openSignatureDialog = () => {
    // Pre-fill from form fields
    setSignerName(fieldValues.representante || fieldValues.contact_name || '');
    setSignerEmail(fieldValues.email || fieldValues.contact_email || '');
    setSignatureDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">
              {t('templateViewer.notFound', 'Template não encontrado')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('templateViewer.notFoundDescription', 'O template solicitado não está disponível ou foi desativado.')}
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('templateViewer.backHome', 'Voltar ao Início')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    const handleDownloadPDF = async (lang: string) => {
      if (!template || !previewContent) return;
      
      // Get content in selected download language
      let content = getContentByLanguage(lang);
      Object.entries(fieldValues).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
      });
      
      const documentData: TemplateDocumentData = {
        templateName: template.name,
        templateType: template.type,
        content,
        language: lang as 'pt' | 'en' | 'es' | 'zh' | 'it',
        fieldValues,
        checkboxValues,
        uploadedFiles: Object.values(uploadedFiles).map(f => f.name),
        signatureData: signatureData || undefined,
        signatureHash: undefined,
      };
      
      await generateTemplateDocumentPDF(documentData);
    };
    
    // Generate signature link using production domain
    const signatureLink = generatedDocumentId 
      ? SITE_URLS.signDocument(generatedDocumentId)
      : null;
    
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast({
        title: t('templateViewer.copied', 'Copiado!'),
        description: t('templateViewer.linkCopied', 'Link copiado para a área de transferência'),
      });
    };

    const openSignaturePage = () => {
      if (signatureLink) {
        window.open(signatureLink, '_blank');
      }
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <SEO title="Documento Enviado" description="Seu documento foi enviado com sucesso." />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-lg w-full"
        >
          <Card className="border-emerald-500/20 bg-card/95 backdrop-blur-lg">
            <CardContent className="p-8 text-center">
              <div className="bg-emerald-500/10 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">
                {t('templateViewer.success', 'Enviado com Sucesso!')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('templateViewer.successDescription', 'Recebemos seu documento preenchido. Nossa equipe entrará em contato em breve.')}
              </p>
              
              {/* Document ID and Signature Link */}
              {generatedDocumentId && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-semibold text-emerald-400">
                      {t('templateViewer.documentInfo', 'Informações do Documento')}
                    </h3>
                  </div>
                  
                  {/* Document ID */}
                  <div className="mb-3">
                    <Label className="text-xs text-muted-foreground">
                      {t('templateViewer.documentId', 'ID do Documento')}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-slate-900 rounded text-sm font-mono text-emerald-300 overflow-x-auto">
                        {generatedDocumentId}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyToClipboard(generatedDocumentId)}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Signature Link */}
                  {signatureLink && !signatureData && (
                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground">
                        {t('templateViewer.signatureLink', 'Link para Assinatura Digital')}
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-slate-900 rounded text-xs font-mono text-blue-300 overflow-x-auto break-all">
                          {signatureLink}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(signatureLink)}
                          className="shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('templateViewer.signatureLinkDesc', 'Compartilhe este link ou use o QR Code do documento para assinatura digital.')}
                      </p>
                    </div>
                  )}
                  
                  {/* Open Signature Page Button */}
                  {signatureLink && !signatureData && (
                    <Button 
                      onClick={openSignaturePage}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('templateViewer.openSignature', 'Abrir Página de Assinatura')}
                    </Button>
                  )}
                  
                  {/* Already signed indicator */}
                  {signatureData && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-emerald-400">
                          {t('templateViewer.alreadySigned', 'Documento já assinado')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('templateViewer.signedBy', 'Por')}: {signatureData.signerName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Language selector for download */}
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  {t('templateViewer.selectDownloadLanguage', 'Selecione o idioma do PDF / Select PDF language')}
                </Label>
                <Select value={downloadLanguage} onValueChange={setDownloadLanguage}>
                  <SelectTrigger className="w-full">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languageLabels).map(([code, { label, flag }]) => (
                      <SelectItem key={code} value={code}>
                        <span className="flex items-center gap-2">
                          <span>{flag}</span>
                          <span>{label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button onClick={() => handleDownloadPDF(downloadLanguage)} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  {t('templateViewer.downloadCopy', 'Baixar Cópia')} ({languageLabels[downloadLanguage]?.flag})
                </Button>
                <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('templateViewer.backToSite', 'Voltar ao Site')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Default fields if template has none defined
  const defaultFields: TemplateField[] = [
    { name: 'razao_social', label: 'Razão Social / Company Name', type: 'text', required: true },
    { name: 'cnpj_vat', label: 'CNPJ / VAT / Tax ID', type: 'text', required: true },
    { name: 'endereco', label: 'Endereço / Address', type: 'text', required: true },
    { name: 'representante', label: 'Representante Legal / Legal Representative', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'telefone', label: 'Telefone / Phone', type: 'tel' },
  ];

  const fieldsToShow = template.fields && template.fields.length > 0 ? template.fields : defaultFields;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SEO 
        title={`${template.name} - ELP Green Technology`}
        description={`Preencha o documento ${template.name}`}
      />

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoElp} alt="ELP" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">ELP Green Technology</h1>
              <p className="text-xs text-muted-foreground leading-tight">Document Portal</p>
            </div>
          </div>
          
          {/* Language Selector */}
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-40">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageLabels).map(([code, { label, flag }]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{flag}</span>
                    <span>{label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Document Header */}
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              {typeLabels[template.type] || template.type}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
            <p className="text-muted-foreground">
              {t('templateViewer.instruction', 'Preencha os campos abaixo para completar o documento')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <Card className="bg-card/95 backdrop-blur-lg border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5" />
                  {t('templateViewer.fillFields', 'Preencher Campos')}
                </CardTitle>
                <CardDescription>
                  {t('templateViewer.requiredNote', 'Campos com * são obrigatórios')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Fields Section */}
                {fieldsToShow.filter(f => f.type !== 'checkbox' && f.type !== 'file').map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-1">
                      {field.type === 'email' && <Mail className="h-3 w-3" />}
                      {field.type === 'tel' && <Phone className="h-3 w-3" />}
                      {field.name.includes('endereco') || field.name.includes('address') ? <MapPin className="h-3 w-3" /> : null}
                      {field.name.includes('razao') || field.name.includes('company') ? <Building2 className="h-3 w-3" /> : null}
                      {field.name.includes('representante') || field.name.includes('contact_name') ? <User className="h-3 w-3" /> : null}
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={fieldValues[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-[100px]"
                      />
                    ) : field.type === 'select' && field.options ? (
                      <Select
                        value={fieldValues[field.name] || ''}
                        onValueChange={(value) => handleFieldChange(field.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || 'Selecione...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type || 'text'}
                        value={fieldValues[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}

                {/* Checkbox Fields Section - Document Checklist */}
                {fieldsToShow.filter(f => f.type === 'checkbox').length > 0 && (
                  <div className="border-t border-border/50 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <CheckSquare className="h-4 w-4" />
                        {t('templateViewer.documentChecklist', 'Checklist de Documentos / Document Checklist')}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const checkboxFields = fieldsToShow.filter(f => f.type === 'checkbox');
                          const allChecked = checkboxFields.every(f => checkboxValues[f.name]);
                          const newValues: Record<string, boolean> = {};
                          checkboxFields.forEach(f => {
                            newValues[f.name] = !allChecked;
                          });
                          setCheckboxValues(prev => ({ ...prev, ...newValues }));
                        }}
                        className="text-xs"
                      >
                        {fieldsToShow.filter(f => f.type === 'checkbox').every(f => checkboxValues[f.name])
                          ? t('templateViewer.uncheckAll', 'Desmarcar Todos')
                          : t('templateViewer.checkAll', 'Marcar Todos')}
                      </Button>
                    </div>
                    <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                      {fieldsToShow.filter(f => f.type === 'checkbox').map((field) => (
                        <div key={field.name} className="flex items-start space-x-3">
                          <Checkbox
                            id={field.name}
                            checked={checkboxValues[field.name] || false}
                            onCheckedChange={(checked) => handleCheckboxChange(field.name, checked as boolean)}
                            className="mt-0.5"
                          />
                          <Label 
                            htmlFor={field.name} 
                            className="text-sm font-normal cursor-pointer leading-tight flex-1"
                          >
                            {field.label}
                            {field.required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload Section */}
                {fieldsToShow.filter(f => f.type === 'file').length > 0 && (
                  <div className="border-t border-border/50 pt-4 mt-4">
                    <Label className="flex items-center gap-2 text-base font-semibold mb-4">
                      <Upload className="h-4 w-4" />
                      {t('templateViewer.attachDocuments', 'Anexar Documentos / Attach Documents')}
                    </Label>
                    <div className="space-y-3">
                      {fieldsToShow.filter(f => f.type === 'file').map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name} className="text-sm flex items-center gap-1">
                            <File className="h-3 w-3" />
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              ref={(el) => { fileInputRefs.current[field.name] = el; }}
                              id={field.name}
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                              className="flex-1"
                            />
                            {uploadedFiles[field.name] && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFile(field.name)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {uploadedFiles[field.name] && (
                            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
                              <CheckCircle2 className="h-3 w-3" />
                              {uploadedFiles[field.name].name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      {t('templateViewer.acceptedFormats', 'Formatos aceitos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB cada)')}
                    </p>
                  </div>
                )}

                {/* Signature Section */}
                <div className="border-t border-border/50 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <FileSignature className="h-4 w-4" />
                      {t('templateViewer.digitalSignature', 'Assinatura Digital')}
                    </Label>
                    {signatureData && (
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {t('templateViewer.signed', 'Assinado')}
                      </Badge>
                    )}
                  </div>
                  
                  {signatureData ? (
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <div className="bg-white rounded p-2 flex justify-center">
                        <img src={signatureData.dataUrl} alt="Signature" className="max-h-16" />
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>{t('templateViewer.signedBy', 'Assinado por')}:</strong> {signatureData.signerName}</p>
                        <p><strong>Email:</strong> {signatureData.signerEmail}</p>
                        <p><strong>{t('templateViewer.dateTime', 'Data/Hora')}:</strong> {format(new Date(signatureData.timestamp), "dd/MM/yyyy 'às' HH:mm:ss")}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSignatureData(null)}
                        className="w-full text-destructive hover:text-destructive"
                      >
                        {t('templateViewer.removeSignature', 'Remover Assinatura')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={openSignatureDialog}
                      className="w-full border-dashed"
                    >
                      <Pen className="h-4 w-4 mr-2" />
                      {t('templateViewer.addSignature', 'Adicionar Assinatura Digital')}
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {t('templateViewer.signatureNote', 'Assinatura com validação criptográfica (SHA-256)')}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : signatureData ? (
                      <Lock className="h-4 w-4 mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {signatureData 
                      ? t('templateViewer.submitSigned', 'Enviar Documento Assinado')
                      : t('templateViewer.submit', 'Enviar Documento')}
                  </Button>
                  <Button
                    onClick={() => generatePDF(signatureData, undefined)}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('templateViewer.downloadPreview', 'Baixar Prévia PDF')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card className="bg-card/95 backdrop-blur-lg border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('templateViewer.preview', 'Prévia do Documento')}
                </CardTitle>
                <CardDescription>
                  {t('templateViewer.previewNote', 'Os campos preenchidos aparecerão automaticamente')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white text-black rounded-lg p-6 max-h-[600px] overflow-y-auto">
                  <MarkdownRenderer 
                    content={previewContent || getContentByLanguage(selectedLanguage)}
                    className="text-gray-800"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      {/* Signature Dialog */}
      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              {t('templateViewer.signDocument', 'Assinar Documento')}
            </DialogTitle>
            <DialogDescription>
              {t('templateViewer.signDescription', 'Adicione sua assinatura digital para validar o documento.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Signer Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('templateViewer.fullName', 'Nome Completo')} *</Label>
                <Input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder={t('templateViewer.namePlaceholder', 'Seu nome completo')}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="email@empresa.com"
                />
              </div>
            </div>

            {/* Signature Type Tabs */}
            <div className="space-y-2">
              <Label>{t('templateViewer.signatureType', 'Tipo de Assinatura')}</Label>
              <div className="flex gap-2">
                <Button
                  variant={signatureType === 'drawn' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureType('drawn')}
                  className="flex-1"
                >
                  <Pen className="h-4 w-4 mr-2" />
                  {t('templateViewer.draw', 'Desenhar')}
                </Button>
                <Button
                  variant={signatureType === 'typed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSignatureType('typed')}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t('templateViewer.type', 'Digitar')}
                </Button>
              </div>
            </div>

            {/* Signature Area */}
            {signatureType === 'drawn' ? (
              <div className="space-y-2">
                <Label>{t('templateViewer.drawBelow', 'Desenhe sua assinatura abaixo')}</Label>
                <div className="border rounded-lg p-2 bg-white">
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={150}
                    className="w-full h-36 border rounded cursor-crosshair"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                  {t('templateViewer.clear', 'Limpar')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('templateViewer.typeSignature', 'Digite sua assinatura')}</Label>
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder={signerName || t('templateViewer.yourName', 'Seu Nome')}
                  className="font-serif italic text-2xl h-16 text-center"
                />
                <div className="bg-white border rounded-lg p-4 flex items-center justify-center min-h-20">
                  <span className="font-serif italic text-3xl text-black">
                    {typedSignature || signerName || t('templateViewer.preview', 'Prévia')}
                  </span>
                </div>
              </div>
            )}

            {/* Legal Notice */}
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {t('templateViewer.legalNotice', 'Ao assinar, você confirma que leu e concorda com os termos deste documento. Sua assinatura é protegida por criptografia SHA-256 e possui validade jurídica conforme Lei 14.063/2020 (Brasil) e Regulamento eIDAS (União Europeia).')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSignatureDialogOpen(false)} className="flex-1">
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button onClick={handleCaptureSignature} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('templateViewer.confirmSignature', 'Confirmar Assinatura')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 py-6 bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ELP Green Technology. All rights reserved.</p>
          <p className="mt-1">
            <a href="https://elpgreen.com" target="_blank" rel="noopener" className="hover:text-primary">
              www.elpgreen.com
            </a>
            {' | '}
            <a href="mailto:info@elpgreen.com" className="hover:text-primary">
              info@elpgreen.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
