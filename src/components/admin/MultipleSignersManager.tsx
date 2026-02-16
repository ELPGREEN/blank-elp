import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  Mail,
  User,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export interface Signer {
  id: string;
  name: string;
  email: string;
  order: number;
  role?: string;
  status?: 'pending' | 'signed' | 'notified';
  signedAt?: string;
}

interface MultipleSignersManagerProps {
  signers: Signer[];
  onSignersChange: (signers: Signer[]) => void;
  enableMultipleSignatures: boolean;
  onEnableMultipleSignaturesChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const translations = {
  pt: {
    title: 'Configuração de Assinaturas',
    description: 'Defina quem deve assinar o documento',
    enableMultiple: 'Múltiplas assinaturas',
    enableMultipleDesc: 'Permitir que mais de uma pessoa assine este documento',
    signers: 'Signatários',
    addSigner: 'Adicionar Signatário',
    signerName: 'Nome do Signatário',
    signerEmail: 'E-mail do Signatário',
    signerRole: 'Cargo/Função (opcional)',
    order: 'Ordem',
    status: 'Status',
    pending: 'Pendente',
    signed: 'Assinado',
    notified: 'Notificado',
    remove: 'Remover',
    noSigners: 'Nenhum signatário adicionado',
    addFirstSigner: 'Adicione o primeiro signatário',
    signatureOrder: 'Os signatários serão notificados na ordem definida',
  },
  en: {
    title: 'Signature Configuration',
    description: 'Define who should sign the document',
    enableMultiple: 'Multiple signatures',
    enableMultipleDesc: 'Allow more than one person to sign this document',
    signers: 'Signers',
    addSigner: 'Add Signer',
    signerName: 'Signer Name',
    signerEmail: 'Signer Email',
    signerRole: 'Role/Position (optional)',
    order: 'Order',
    status: 'Status',
    pending: 'Pending',
    signed: 'Signed',
    notified: 'Notified',
    remove: 'Remove',
    noSigners: 'No signers added',
    addFirstSigner: 'Add the first signer',
    signatureOrder: 'Signers will be notified in the defined order',
  },
};

export function MultipleSignersManager({
  signers,
  onSignersChange,
  enableMultipleSignatures,
  onEnableMultipleSignaturesChange,
  disabled = false,
}: MultipleSignersManagerProps) {
  const [newSigner, setNewSigner] = useState<Partial<Signer>>({
    name: '',
    email: '',
    role: '',
  });

  // Use Portuguese by default for admin panel
  const t = translations.pt;

  const handleAddSigner = () => {
    if (!newSigner.name || !newSigner.email) return;

    const signer: Signer = {
      id: `signer_${Date.now()}`,
      name: newSigner.name,
      email: newSigner.email,
      role: newSigner.role,
      order: signers.length + 1,
      status: 'pending',
    };

    onSignersChange([...signers, signer]);
    setNewSigner({ name: '', email: '', role: '' });
  };

  const handleRemoveSigner = (id: string) => {
    const updated = signers
      .filter(s => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    onSignersChange(updated);
  };

  const handleMoveSigner = (id: string, direction: 'up' | 'down') => {
    const idx = signers.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === signers.length - 1) return;

    const newSigners = [...signers];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSigners[idx], newSigners[swapIdx]] = [newSigners[swapIdx], newSigners[idx]];
    
    onSignersChange(newSigners.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'signed':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t.signed}
          </Badge>
        );
      case 'notified':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Mail className="w-3 h-3 mr-1" />
            {t.notified}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            <Clock className="w-3 h-3 mr-1" />
            {t.pending}
          </Badge>
        );
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t.title}</CardTitle>
              <CardDescription className="text-xs">{t.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle for multiple signatures */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="multiple-signatures" className="font-medium">
              {t.enableMultiple}
            </Label>
            <p className="text-xs text-muted-foreground">{t.enableMultipleDesc}</p>
          </div>
          <Switch
            id="multiple-signatures"
            checked={enableMultipleSignatures}
            onCheckedChange={onEnableMultipleSignaturesChange}
            disabled={disabled}
          />
        </div>

        <AnimatePresence>
          {enableMultipleSignatures && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <Separator />

              {/* Add new signer form */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t.addSigner}</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="signer-name" className="text-xs text-muted-foreground">
                      {t.signerName} *
                    </Label>
                    <Input
                      id="signer-name"
                      placeholder="João Silva"
                      value={newSigner.name || ''}
                      onChange={e => setNewSigner({ ...newSigner, name: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signer-email" className="text-xs text-muted-foreground">
                      {t.signerEmail} *
                    </Label>
                    <Input
                      id="signer-email"
                      type="email"
                      placeholder="joao@empresa.com"
                      value={newSigner.email || ''}
                      onChange={e => setNewSigner({ ...newSigner, email: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signer-role" className="text-xs text-muted-foreground">
                      {t.signerRole}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="signer-role"
                        placeholder="Diretor"
                        value={newSigner.role || ''}
                        onChange={e => setNewSigner({ ...newSigner, role: e.target.value })}
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        onClick={handleAddSigner}
                        disabled={disabled || !newSigner.name || !newSigner.email}
                        size="icon"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signers list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t.signers} ({signers.length})</Label>
                  {signers.length > 1 && (
                    <p className="text-xs text-muted-foreground">{t.signatureOrder}</p>
                  )}
                </div>

                {signers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">{t.noSigners}</p>
                    <p className="text-xs">{t.addFirstSigner}</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {signers.map((signer, index) => (
                        <motion.div
                          key={signer.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleMoveSigner(signer.id, 'up')}
                              disabled={index === 0 || disabled}
                            >
                              <GripVertical className="h-3 w-3 rotate-90" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => handleMoveSigner(signer.id, 'down')}
                              disabled={index === signers.length - 1 || disabled}
                            >
                              <GripVertical className="h-3 w-3 rotate-90" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {signer.order}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium truncate">{signer.name}</span>
                              {signer.role && (
                                <span className="text-xs text-muted-foreground">({signer.role})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{signer.email}</span>
                            </div>
                          </div>

                          {getStatusBadge(signer.status)}

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveSigner(signer.id)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default MultipleSignersManager;
