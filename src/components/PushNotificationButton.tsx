import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PushNotificationButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function PushNotificationButton({
  variant = 'outline',
  size = 'default',
  showLabel = true,
  className = '',
}: PushNotificationButtonProps) {
  const { t } = useTranslation();
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isSubscribed) {
      unsubscribe();
    } else {
      subscribe(['general', 'news', 'promotions', 'status']);
    }
  };

  const buttonContent = (
    <>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isSubscribed ? t('pwa.disableNotifications') : t('pwa.enableNotifications')}
        </span>
      )}
    </>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={isLoading}
            className={className}
          >
            {buttonContent}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSubscribed ? t('pwa.disableNotifications') : t('pwa.enableNotifications')}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {buttonContent}
    </Button>
  );
}
