import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Check, X, Pen, RotateCcw, Download, Upload, Type, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SignaturePadLib from 'signature_pad';
import { format } from 'date-fns';

interface SignatureData {
  dataUrl: string;
  timestamp: string;
  signerName: string;
  signerEmail: string;
  ipAddress?: string;
  type: 'drawn' | 'typed';
}

interface SignaturePadProps {
  onSave: (signature: SignatureData) => void;
  onCancel: () => void;
  signerName?: string;
  signerEmail?: string;
  documentTitle?: string;
}

export function SignaturePad({
  onSave,
  onCancel,
  signerName = '',
  signerEmail = '',
  documentTitle = 'Documento',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(signerName);
  const [name, setName] = useState(signerName);
  const [email, setEmail] = useState(signerEmail);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && activeTab === 'draw') {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePadLib(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(20, 40, 80)',
        minWidth: 0.5,
        maxWidth: 2.5,
      });

      signaturePadRef.current.addEventListener('endStroke', () => {
        setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
      });
    }

    return () => {
      signaturePadRef.current?.off();
    };
  }, [activeTab]);

  const handleClear = useCallback(() => {
    if (activeTab === 'draw') {
      signaturePadRef.current?.clear();
      setIsEmpty(true);
    } else {
      setTypedName('');
    }
  }, [activeTab]);

  const generateTypedSignature = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 36px "Brush Script MT", cursive, Georgia, serif';
    ctx.fillStyle = '#142850';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleSave = useCallback(() => {
    let dataUrl: string;
    let type: 'drawn' | 'typed';

    if (activeTab === 'draw') {
      if (signaturePadRef.current?.isEmpty()) return;
      dataUrl = signaturePadRef.current?.toDataURL('image/png') ?? '';
      type = 'drawn';
    } else {
      if (!typedName.trim()) return;
      dataUrl = generateTypedSignature();
      type = 'typed';
    }

    const signatureData: SignatureData = {
      dataUrl,
      timestamp: new Date().toISOString(),
      signerName: name || typedName,
      signerEmail: email,
      type,
    };

    onSave(signatureData);
  }, [activeTab, typedName, name, email, onSave]);

  const canSave = activeTab === 'draw' ? !isEmpty : typedName.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Pen className="h-5 w-5 text-primary" />
          Assinatura Digital
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Documento: {documentTitle}
        </p>
      </div>

      {/* Signer Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Nome Completo *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do signatário"
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Email *</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="h-9"
          />
        </div>
      </div>

      {/* Signature Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'draw' | 'type')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <Pen className="h-4 w-4" />
            Desenhar
          </TabsTrigger>
          <TabsTrigger value="type" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Digitar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="mt-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-40 border-2 border-dashed rounded-lg cursor-crosshair bg-white"
              style={{ touchAction: 'none' }}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground text-sm">
                  Assine aqui usando o mouse ou toque
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <div className="space-y-3">
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="text-center text-lg"
            />
            {typedName && (
              <Card className="p-4 bg-white">
                <p
                  className="text-center text-2xl text-[#142850]"
                  style={{ fontFamily: '"Brush Script MT", cursive, Georgia, serif', fontStyle: 'italic' }}
                >
                  {typedName}
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Timestamp Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss")}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          SHA-256 Hash será gerado
        </Badge>
      </div>

      {/* Legal Notice */}
      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
        <p>
          Ao assinar, você declara que leu e concorda com os termos do documento. 
          Esta assinatura eletrônica tem validade jurídica conforme a Lei nº 14.063/2020 (Brasil) 
          e Regulamento eIDAS (UE).
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!canSave || !name.trim() || !email.trim()}
          >
            <Check className="h-4 w-4 mr-2" />
            Assinar Documento
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Signature Verification Badge Component
interface SignatureVerificationProps {
  signature: SignatureData;
  className?: string;
}

export function SignatureVerification({ signature, className = '' }: SignatureVerificationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 ${className}`}
    >
      <div className="p-2 rounded-full bg-emerald-500/10">
        <Check className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Documento Assinado
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-500">
          {signature.signerName} • {format(new Date(signature.timestamp), "dd/MM/yyyy 'às' HH:mm")}
        </p>
      </div>
      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
        {signature.type === 'drawn' ? 'Manuscrita' : 'Digitada'}
      </Badge>
    </motion.div>
  );
}

// Signature Preview Component
interface SignaturePreviewProps {
  signature: SignatureData;
  size?: 'sm' | 'md' | 'lg';
}

export function SignaturePreview({ signature, size = 'md' }: SignaturePreviewProps) {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-32',
  };

  return (
    <div className={`${sizeClasses[size]} bg-white rounded border p-2`}>
      <img
        src={signature.dataUrl}
        alt={`Assinatura de ${signature.signerName}`}
        className="h-full w-auto mx-auto object-contain"
      />
    </div>
  );
}
