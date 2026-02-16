import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, LogOut, Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { useToast } from '@/hooks/use-toast';
import logoElp from '@/assets/logo-elp.png';

interface AdminHeaderProps {
  onLogout: () => void;
  onNavigateTab: (tab: string) => void;
}

const adminLanguages = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export function AdminHeader({ onLogout, onNavigateTab }: AdminHeaderProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const currentLang = adminLanguages.find(l => l.code === i18n.language) || adminLanguages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('elp-language', langCode);
  };

  const handleUpdateApp = async () => {
    try {
      // If SW isn't available (or in environments where it isn't registered), just reload.
      if (!('serviceWorker' in navigator)) {
        window.location.reload();
        return;
      }

      toast({
        title: t('admin.updatingApp', 'Atualizando…'),
        description: t('admin.updatingAppDesc', 'Buscando uma nova versão e limpando o cache local.'),
      });

      // Best-effort cache clear (helps when stale JS is being served).
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        window.location.reload();
        return;
      }

      // Ask SW to check for updates.
      await reg.update();

      // If there's a waiting SW, activate it immediately.
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      let reloaded = false;
      const reloadOnce = () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

      // Fallback: reload after a short delay even if controllerchange doesn't fire.
      setTimeout(reloadOnce, 1500);
    } catch (e) {
      console.error('[Admin] Update app error:', e);
      toast({
        title: t('admin.updateFailed', 'Não foi possível atualizar'),
        description: t('admin.updateFailedDesc', 'Tente um hard refresh (Ctrl+Shift+R) ou limpar o cache do navegador.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="bg-card/95 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50 h-16">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-xl border border-primary/10">
            <img src={logoElp} alt="ELP" className="h-8 w-auto" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg leading-tight">{t('admin.title', 'Painel Admin')}</h1>
            <p className="text-xs text-muted-foreground leading-tight">{t('admin.subtitle', 'ELP Green Technology')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                <span className="sm:hidden">{currentLang.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
              {adminLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`cursor-pointer gap-2 ${i18n.language === lang.code ? 'bg-primary/10' : ''}`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpdateApp}
            className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground"
            title={t('admin.updateApp', 'Limpar cache / Atualizar app')}
          >
            <RefreshCw className="h-4 w-4" />
            <span>{t('admin.updateApp', 'Atualizar app')}</span>
          </Button>

          <NotificationCenter onNavigate={onNavigateTab} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="hidden md:flex gap-2 text-muted-foreground hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
            <span>{t('admin.viewSite', 'Ver Site')}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.logout', 'Sair')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
