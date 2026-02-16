import { toast } from 'sonner';

function copyToClipboard(text: string) {
  // Prefer async clipboard API
  try {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Link copiado'),
        () => {
          // fallback below
          throw new Error('clipboard_write_failed');
        }
      );
      return;
    }
  } catch {
    // continue to fallback
  }

  // Fallback: hidden textarea
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    toast.success('Link copiado');
  } catch {
    toast.info('Copie o link abaixo', { description: text, duration: 10000 });
  }
}

export function openExternal(url: string, fallbackMessage?: string) {
  if (typeof window === 'undefined') return;

  const showBlockedToast = () => {
    toast.info('Abertura bloqueada', {
      description:
        fallbackMessage ||
        'Seu navegador bloqueou a abertura em nova aba. Permita pop-ups para este site ou copie o link.',
      action: {
        label: 'Copiar link',
        onClick: () => copyToClipboard(url),
      },
      duration: 9000,
    });
  };

  // In previews the app can be inside an iframe; try to open from the top window.
  try {
    const topWin = window.top ?? window;
    const win = topWin.open(url, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      showBlockedToast();
    }
  } catch {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        showBlockedToast();
      }
    } catch {
      showBlockedToast();
    }
  }
}

