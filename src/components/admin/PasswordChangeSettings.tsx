import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function PasswordChangeSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const passwordRequirements = [
    { 
      label: t('admin.password.minLength', 'Mínimo 6 caracteres'), 
      valid: formData.newPassword.length >= 6 
    },
    { 
      label: t('admin.password.match', 'Senhas conferem'), 
      valid: formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0 
    },
  ];

  const isFormValid = passwordRequirements.every(req => req.valid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast({
        title: t('admin.password.invalidForm', 'Formulário inválido'),
        description: t('admin.password.checkRequirements', 'Verifique os requisitos da senha.'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast({
        title: t('admin.password.success', 'Senha alterada!'),
        description: t('admin.password.successDesc', 'Sua senha foi atualizada com sucesso.'),
      });

      // Clear form
      setFormData({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: t('admin.password.error', 'Erro ao alterar senha'),
        description: error.message || t('admin.password.errorDesc', 'Não foi possível alterar a senha.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          {t('admin.password.title', 'Alterar Senha')}
        </CardTitle>
        <CardDescription>
          {t('admin.password.description', 'Atualize sua senha de acesso ao painel administrativo.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('admin.password.new', 'Nova senha')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('admin.password.confirm', 'Confirmar nova senha')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Password requirements */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">
              {t('admin.password.requirements', 'Requisitos da senha:')}
            </p>
            <ul className="space-y-1">
              {passwordRequirements.map((req, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  {req.valid ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={req.valid ? 'text-emerald-500' : 'text-muted-foreground'}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? t('admin.password.updating', 'Atualizando...') : t('admin.password.update', 'Atualizar Senha')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
