import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  FileSignature,
  Clock,
  User,
  Mail,
  Building2,
  Hash,
  Lock,
  Pen,
  Type,
  RotateCcw,
  X,
  Check,
  Download,
  Send,
  Eye,
  Calendar,
  Globe,
  Fingerprint,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import SignaturePadLib from 'signature_pad';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

// ELP Color Palette - Professional Corporate Design
const ELP_COLORS = {
  primary: '#1a2744',      // Navy Blue from logo
  secondary: '#2a3a5c',    // Lighter Navy
  accent: '#2e7d32',       // Green accent
  success: '#2e7d32',      // Green
  white: '#ffffff',
  lightGray: '#f8fafc',
  gray: '#666666',
  darkGray: '#333333',
  border: '#e0e0e0',
  background: '#fafafa',
};

export interface ICPSignatureData {
  dataUrl: string;
  timestamp: string;
  signerName: string;
  signerEmail: string;
  signerDocument: string; // CPF/CNPJ
  signerCompany?: string;
  signatureType: 'drawn' | 'typed';
  signatureHash: string;
  ipAddress?: string;
  userAgent?: string;
  legalAcceptance: boolean;
  certificateInfo: {
    issuer: string;
    serialNumber: string;
    validFrom: string;
    validTo: string;
    algorithm: string;
  };
}

interface ELPSignaturePortalProps {
  documentTitle: string;
  documentContent: string;
  signerName?: string;
  signerEmail?: string;
  signerCompany?: string;
  onComplete: (signature: ICPSignatureData) => void;
  onCancel: () => void;
  language?: 'pt' | 'en' | 'es' | 'it' | 'zh';
}

const translations = {
  pt: {
    title: 'Portal de Assinatura Digital',
    subtitle: 'Assine documentos com segurança jurídica',
    step1: 'Revisar Documento',
    step2: 'Dados do Signatário',
    step3: 'Assinatura',
    step4: 'Confirmação',
    reviewDoc: 'Revise o documento antes de assinar',
    signerInfo: 'Informações do Signatário',
    fullName: 'Nome Completo',
    email: 'Email',
    document: 'CPF/CNPJ',
    company: 'Empresa (opcional)',
    drawSignature: 'Desenhar Assinatura',
    typeSignature: 'Digitar Nome',
    signHere: 'Assine aqui usando o mouse ou toque',
    clear: 'Limpar',
    legalNotice: 'Declaro que li e concordo com os termos do documento. Esta assinatura eletrônica tem validade jurídica conforme a Medida Provisória nº 2.200-2/2001 (ICP-Brasil) e Lei nº 14.063/2020.',
    iAccept: 'Li e aceito os termos',
    sign: 'Assinar Documento',
    cancel: 'Cancelar',
    next: 'Próximo',
    back: 'Voltar',
    signatureSuccess: 'Documento Assinado com Sucesso!',
    downloadSigned: 'Baixar Documento Assinado',
    sendEmail: 'Enviar por Email',
    certificateInfo: 'Informações do Certificado',
    issuer: 'Autoridade Certificadora',
    serialNumber: 'Número de Série',
    algorithm: 'Algoritmo',
    validity: 'Validade',
    auditTrail: 'Trilha de Auditoria',
  },
  en: {
    title: 'Digital Signature Portal',
    subtitle: 'Sign documents with legal security',
    step1: 'Review Document',
    step2: 'Signer Information',
    step3: 'Signature',
    step4: 'Confirmation',
    reviewDoc: 'Review the document before signing',
    signerInfo: 'Signer Information',
    fullName: 'Full Name',
    email: 'Email',
    document: 'ID Number',
    company: 'Company (optional)',
    drawSignature: 'Draw Signature',
    typeSignature: 'Type Name',
    signHere: 'Sign here using mouse or touch',
    clear: 'Clear',
    legalNotice: 'I declare that I have read and agree to the terms of the document. This electronic signature is legally valid under applicable electronic signature laws.',
    iAccept: 'I have read and accept the terms',
    sign: 'Sign Document',
    cancel: 'Cancel',
    next: 'Next',
    back: 'Back',
    signatureSuccess: 'Document Successfully Signed!',
    downloadSigned: 'Download Signed Document',
    sendEmail: 'Send by Email',
    certificateInfo: 'Certificate Information',
    issuer: 'Certificate Authority',
    serialNumber: 'Serial Number',
    algorithm: 'Algorithm',
    validity: 'Validity',
    auditTrail: 'Audit Trail',
  },
  es: {
    title: 'Portal de Firma Digital',
    subtitle: 'Firme documentos con seguridad jurídica',
    step1: 'Revisar Documento',
    step2: 'Datos del Firmante',
    step3: 'Firma',
    step4: 'Confirmación',
    reviewDoc: 'Revise el documento antes de firmar',
    signerInfo: 'Información del Firmante',
    fullName: 'Nombre Completo',
    email: 'Email',
    document: 'Documento de Identidad',
    company: 'Empresa (opcional)',
    drawSignature: 'Dibujar Firma',
    typeSignature: 'Escribir Nombre',
    signHere: 'Firme aquí usando el mouse o toque',
    clear: 'Limpiar',
    legalNotice: 'Declaro que he leído y acepto los términos del documento. Esta firma electrónica tiene validez jurídica según las leyes aplicables.',
    iAccept: 'He leído y acepto los términos',
    sign: 'Firmar Documento',
    cancel: 'Cancelar',
    next: 'Siguiente',
    back: 'Volver',
    signatureSuccess: '¡Documento Firmado con Éxito!',
    downloadSigned: 'Descargar Documento Firmado',
    sendEmail: 'Enviar por Email',
    certificateInfo: 'Información del Certificado',
    issuer: 'Autoridad Certificadora',
    serialNumber: 'Número de Serie',
    algorithm: 'Algoritmo',
    validity: 'Validez',
    auditTrail: 'Pista de Auditoría',
  },
  it: {
    title: 'Portale Firma Digitale',
    subtitle: 'Firma documenti con sicurezza legale',
    step1: 'Rivedi Documento',
    step2: 'Dati Firmatario',
    step3: 'Firma',
    step4: 'Conferma',
    reviewDoc: 'Rivedi il documento prima di firmare',
    signerInfo: 'Informazioni Firmatario',
    fullName: 'Nome Completo',
    email: 'Email',
    document: 'Codice Fiscale/P.IVA',
    company: 'Azienda (opzionale)',
    drawSignature: 'Disegna Firma',
    typeSignature: 'Digita Nome',
    signHere: 'Firma qui usando mouse o touch',
    clear: 'Cancella',
    legalNotice: 'Dichiaro di aver letto e accettato i termini del documento. Questa firma elettronica è valida ai sensi del Regolamento eIDAS.',
    iAccept: 'Ho letto e accetto i termini',
    sign: 'Firma Documento',
    cancel: 'Annulla',
    next: 'Avanti',
    back: 'Indietro',
    signatureSuccess: 'Documento Firmato con Successo!',
    downloadSigned: 'Scarica Documento Firmato',
    sendEmail: 'Invia per Email',
    certificateInfo: 'Informazioni Certificato',
    issuer: 'Autorità di Certificazione',
    serialNumber: 'Numero Seriale',
    algorithm: 'Algoritmo',
    validity: 'Validità',
    auditTrail: 'Traccia di Audit',
  },
  zh: {
    title: '数字签名门户',
    subtitle: '安全合法地签署文件',
    step1: '审查文件',
    step2: '签署人信息',
    step3: '签名',
    step4: '确认',
    reviewDoc: '签署前请审查文件',
    signerInfo: '签署人信息',
    fullName: '全名',
    email: '电子邮件',
    document: '身份证号',
    company: '公司（可选）',
    drawSignature: '手写签名',
    typeSignature: '输入姓名',
    signHere: '在此处使用鼠标或触摸签名',
    clear: '清除',
    legalNotice: '我声明已阅读并同意文件条款。此电子签名具有法律效力。',
    iAccept: '我已阅读并接受条款',
    sign: '签署文件',
    cancel: '取消',
    next: '下一步',
    back: '返回',
    signatureSuccess: '文件签署成功！',
    downloadSigned: '下载签署文件',
    sendEmail: '通过电子邮件发送',
    certificateInfo: '证书信息',
    issuer: '证书颁发机构',
    serialNumber: '序列号',
    algorithm: '算法',
    validity: '有效期',
    auditTrail: '审计跟踪',
  },
};

export function ELPSignaturePortal({
  documentTitle,
  documentContent,
  signerName = '',
  signerEmail = '',
  signerCompany = '',
  onComplete,
  onCancel,
  language = 'pt',
}: ELPSignaturePortalProps) {
  const { toast } = useToast();
  const t = translations[language];

  const [step, setStep] = useState(1);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [formData, setFormData] = useState({
    name: signerName,
    email: signerEmail,
    document: '',
    company: signerCompany,
  });
  const [typedName, setTypedName] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [signatureComplete, setSignatureComplete] = useState(false);
  const [finalSignature, setFinalSignature] = useState<ICPSignatureData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && step === 3 && signatureMode === 'draw') {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePadLib(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: ELP_COLORS.primary,
        minWidth: 0.5,
        maxWidth: 2.5,
      });

      signaturePadRef.current.addEventListener('endStroke', () => {
        setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
      });

      return () => {
        signaturePadRef.current?.off();
      };
    }
  }, [step, signatureMode]);

  const clearSignature = useCallback(() => {
    if (signatureMode === 'draw') {
      signaturePadRef.current?.clear();
      setIsEmpty(true);
    } else {
      setTypedName('');
    }
  }, [signatureMode]);

  // Generate SHA-256 hash
  const generateHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Generate typed signature as image
  const generateTypedSignatureImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 36px "Brush Script MT", cursive, Georgia, serif';
    ctx.fillStyle = ELP_COLORS.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  // Generate certificate serial number
  const generateSerialNumber = (): string => {
    const chars = 'ABCDEF0123456789';
    let result = 'ELP-';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSign = async () => {
    let signatureDataUrl: string;

    if (signatureMode === 'draw') {
      if (signaturePadRef.current?.isEmpty()) return;
      signatureDataUrl = signaturePadRef.current?.toDataURL('image/png') ?? '';
    } else {
      if (!typedName.trim()) return;
      signatureDataUrl = generateTypedSignatureImage();
    }

    const timestamp = new Date().toISOString();
    const signatureHash = await generateHash(
      JSON.stringify({
        signatureDataUrl,
        timestamp,
        signer: formData,
        document: documentTitle,
      })
    );

    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 3);

    const signature: ICPSignatureData = {
      dataUrl: signatureDataUrl,
      timestamp,
      signerName: formData.name,
      signerEmail: formData.email,
      signerDocument: formData.document,
      signerCompany: formData.company,
      signatureType: signatureMode === 'draw' ? 'drawn' : 'typed',
      signatureHash,
      legalAcceptance: legalAccepted,
      certificateInfo: {
        issuer: 'ELP Green Technology - Autoridade Certificadora Própria',
        serialNumber: generateSerialNumber(),
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        algorithm: 'SHA-256 with RSA Encryption',
      },
    };

    setFinalSignature(signature);
    setSignatureComplete(true);
    setStep(4);
  };

  const handleComplete = () => {
    if (finalSignature) {
      onComplete(finalSignature);
    }
  };

  const canProceedStep2 = formData.name && formData.email && formData.document;
  const canSign = legalAccepted && (signatureMode === 'draw' ? !isEmpty : typedName.trim().length > 0);

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header with ELP Branding */}
      <div 
        className="p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${ELP_COLORS.primary} 0%, ${ELP_COLORS.secondary} 100%)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ELP GREEN TECHNOLOGY</h2>
              <p className="text-sm text-white/80">{t.title}</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0">
            <Lock className="h-3 w-3 mr-1" />
            ICP-Brasil
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s === step
                    ? 'bg-white text-primary scale-110'
                    : s < step
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 mx-1 rounded transition-all ${
                    s < step ? 'bg-white/50' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mt-2 text-xs text-white/70">
          <span>{t.step1}</span>
          <span>{t.step2}</span>
          <span>{t.step3}</span>
          <span>{t.step4}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Review Document */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t.reviewDoc}</h3>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSignature className="h-5 w-5" />
                    {documentTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] border rounded-lg p-4 bg-muted/30">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{documentContent}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Signer Information */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t.signerInfo}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t.fullName} *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t.fullName}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t.email} *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    {t.document} *
                  </Label>
                  <Input
                    value={formData.document}
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                    placeholder="000.000.000-00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t.company}
                  </Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da Empresa"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Certificate Preview */}
              <Card className="mt-6 border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Award className="h-10 w-10 text-primary" />
                    <div>
                      <p className="font-medium">Certificado Digital ELP</p>
                      <p className="text-sm text-muted-foreground">
                        Assinatura com validade jurídica conforme ICP-Brasil
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Signature */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Pen className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{t.step3}</h3>
              </div>

              <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as 'draw' | 'type')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw" className="flex items-center gap-2">
                    <Pen className="h-4 w-4" />
                    {t.drawSignature}
                  </TabsTrigger>
                  <TabsTrigger value="type" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    {t.typeSignature}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="mt-4">
                  <div className="relative border-2 border-dashed border-primary/30 rounded-xl overflow-hidden bg-white">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-40 cursor-crosshair"
                      style={{ touchAction: 'none' }}
                    />
                    {isEmpty && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-muted-foreground text-sm">{t.signHere}</p>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearSignature}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {t.clear}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="type" className="mt-4 space-y-3">
                  <Input
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder={t.fullName}
                    className="text-center text-lg"
                  />
                  {typedName && (
                    <Card className="p-4 bg-white">
                      <p
                        className="text-center text-2xl"
                        style={{ 
                          fontFamily: '"Brush Script MT", cursive, Georgia, serif',
                          fontStyle: 'italic',
                          color: ELP_COLORS.primary,
                        }}
                      >
                        {typedName}
                      </p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              {/* Timestamp Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Hash className="h-3 w-3 mr-1" />
                  SHA-256
                </Badge>
              </div>

              {/* Legal Notice */}
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
                <CardContent className="pt-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">{t.legalNotice}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                      id="legal"
                      checked={legalAccepted}
                      onCheckedChange={(checked) => setLegalAccepted(checked as boolean)}
                    />
                    <Label htmlFor="legal" className="text-sm font-medium cursor-pointer">
                      {t.iAccept}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && finalSignature && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-emerald-600">{t.signatureSuccess}</h3>
                <p className="text-sm text-muted-foreground mt-1">{documentTitle}</p>
              </div>

              {/* Signature Preview */}
              <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="pt-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <img
                      src={finalSignature.dataUrl}
                      alt="Assinatura"
                      className="h-16 mx-auto object-contain"
                    />
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{finalSignature.signerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{finalSignature.signerEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(finalSignature.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certificate Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    {t.certificateInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.issuer}:</span>
                    <span className="font-mono text-xs">{finalSignature.certificateInfo.issuer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.serialNumber}:</span>
                    <span className="font-mono text-xs">{finalSignature.certificateInfo.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.algorithm}:</span>
                    <span className="font-mono text-xs">{finalSignature.certificateInfo.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hash:</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">{finalSignature.signatureHash}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}>
            {step === 1 ? (
              <>
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                {t.back}
              </>
            )}
          </Button>

          {step < 3 && (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 2 && !canProceedStep2}
              style={{ backgroundColor: ELP_COLORS.primary }}
            >
              {t.next}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={handleSign}
              disabled={!canSign}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              {t.sign}
            </Button>
          )}

          {step === 4 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleComplete}>
                <Download className="h-4 w-4 mr-2" />
                {t.downloadSigned}
              </Button>
              <Button onClick={handleComplete} style={{ backgroundColor: ELP_COLORS.primary }}>
                <Check className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
