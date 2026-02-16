import { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, User, Sparkles, Leaf, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { TechGrid } from '@/components/ui/tech-grid';

// Lazy load particles
const ParticleField = lazy(() => import('@/components/3d/ParticleField').then(m => ({ default: m.ParticleField })));

// Lista de emails autorizados (mesma lista usada no ProtectedRoute)
const ALLOWED_EMAILS = [
  'info@elpgreen.com',
  'elpenergia@gmail.com',
];

const isEmailAllowed = (email: string): boolean => {
  return ALLOWED_EMAILS.some(
    allowed => allowed.toLowerCase() === email.toLowerCase()
  );
};

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Google OAuth - a verificação será feita no ProtectedRoute após redirect
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: t('signup.googleError', 'Erro no cadastro com Google'),
        description: error.message || t('signup.googleErrorDesc', 'Não foi possível conectar com o Google.'),
        variant: 'destructive',
      });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se o email é autorizado ANTES de tentar cadastrar
    if (!isEmailAllowed(formData.email)) {
      toast({
        title: t('signup.accessDenied', 'Acesso Negado'),
        description: t('signup.accessDeniedDesc', 'Este email não está autorizado para cadastro. Entre em contato com o administrador.'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('signup.passwordMismatch', 'Senhas não conferem'),
        description: t('signup.passwordMismatchDesc', 'Por favor, verifique se as senhas são iguais.'),
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: t('signup.passwordShort', 'Senha muito curta'),
        description: t('signup.passwordShortDesc', 'A senha deve ter pelo menos 6 caracteres.'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            full_name: formData.name,
          },
        },
      });

      if (error) throw error;

      toast({
        title: t('signup.success', 'Conta criada com sucesso!'),
        description: t('signup.successDesc', 'Você já pode fazer login.'),
      });
      
      navigate('/login');
    } catch (error: any) {
      let message = t('signup.error', 'Ocorreu um erro ao criar sua conta.');
      
      if (error.message?.includes('already registered')) {
        message = t('signup.alreadyRegistered', 'Este email já está cadastrado. Tente fazer login.');
      }
      
      toast({
        title: t('signup.errorTitle', 'Erro no cadastro'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>
      <TechGrid />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10 p-4"
      >
        <GlassCard className="p-8 bg-card/80 backdrop-blur-xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
              <Leaf className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1 mb-3"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-primary text-xs font-medium">ELP Green</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{t('signup.title', 'Criar Conta')}</h1>
            <p className="text-muted-foreground text-sm">{t('signup.subtitle', 'Cadastre-se para acessar o painel')}</p>
          </div>

          {/* Aviso de acesso restrito */}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
            <ShieldAlert className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-200">
              {t('signup.restrictedAccess', 'Acesso restrito a emails autorizados. Entre em contato com o administrador caso precise de acesso.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t('signup.name', 'Nome completo')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('signup.namePlaceholder', 'Seu nome')}
                  className="pl-10 bg-background/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('signup.email', 'Email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 bg-background/50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('signup.password', 'Senha')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-background/50"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('signup.confirmPassword', 'Confirmar senha')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-background/50"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity" 
              size="lg" 
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? t('signup.creating', 'Criando conta...') : t('signup.createAccount', 'Criar conta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t('signup.orContinue', 'ou continue com')}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-background/50"
            size="lg"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              t('signup.connecting', 'Conectando...')
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t('signup.signupGoogle', 'Cadastrar com Google')}
              </>
            )}
          </Button>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t('signup.hasAccount', 'Já tem uma conta?')}{' '}
              <Button variant="link" className="p-0 h-auto text-primary" onClick={() => navigate('/login')}>
                {t('signup.login', 'Fazer login')}
              </Button>
            </p>
            <Button variant="link" className="text-muted-foreground hover:text-primary" onClick={() => navigate('/')}>
              ← {t('signup.backToSite', 'Voltar ao site')}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Signup;
