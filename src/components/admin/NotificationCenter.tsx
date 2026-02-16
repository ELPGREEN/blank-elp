import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Mail,
  Users,
  ShoppingCart,
  FileText,
  AlertCircle,
  Clock,
  X,
  ChevronRight,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'contact' | 'marketplace' | 'email' | 'document' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationCenterProps {
  onNavigate?: (tab: string) => void;
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Simulated notifications from real-time subscriptions
  useEffect(() => {
    // Subscribe to new contacts
    const contactsChannel = supabase
      .channel('notification-contacts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts'
        },
        (payload) => {
          const newContact = payload.new as { name: string; email: string; channel: string; id: string };
          const isOTR = newContact.channel === 'otr-source-indication';
          const notification: Notification = {
            id: `contact-${newContact.id}`,
            type: 'contact',
            title: isOTR ? `🎯 ${t('admin.notifications.newOtrLead')}` : `📬 ${t('admin.notifications.newContact')}`,
            message: `${newContact.name} (${newContact.email})`,
            read: false,
            created_at: new Date().toISOString(),
            link: 'crm-pipeline',
          };
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          if (soundEnabled) {
            playNotificationSound();
          }
          
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to marketplace registrations
    const marketplaceChannel = supabase
      .channel('notification-marketplace')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_registrations'
        },
        (payload) => {
          const newReg = payload.new as { company_name: string; contact_name: string; id: string };
          const notification: Notification = {
            id: `marketplace-${newReg.id}`,
            type: 'marketplace',
            title: `🆕 ${t('admin.notifications.newB2BPreRegister')}`,
            message: `${newReg.company_name} - ${newReg.contact_name}`,
            read: false,
            created_at: new Date().toISOString(),
            link: 'marketplace',
          };
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          if (soundEnabled) {
            playNotificationSound();
          }
          
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    // Subscribe to new emails
    const emailsChannel = supabase
      .channel('notification-emails')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_emails',
          filter: 'direction=eq.inbound'
        },
        (payload) => {
          const newEmail = payload.new as { from_email: string; subject: string; id: string };
          const notification: Notification = {
            id: `email-${newEmail.id}`,
            type: 'email',
            title: `📧 ${t('admin.notifications.newEmail')}`,
            message: `${newEmail.subject || t('admin.notifications.noSubject')} - ${newEmail.from_email}`,
            read: false,
            created_at: new Date().toISOString(),
            link: 'email-inbox',
          };
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          if (soundEnabled) {
            playNotificationSound();
          }
          
          toast({
            title: notification.title,
            description: notification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(marketplaceChannel);
      supabase.removeChannel(emailsChannel);
    };
  }, [soundEnabled, toast]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleF4AAAAAAABGRkZGRkY=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link && onNavigate) {
      onNavigate(notification.link);
      setOpen(false);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'contact':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'marketplace':
        return <ShoppingCart className="h-4 w-4 text-emerald-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 animate-pulse" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h4 className="font-semibold">{t('admin.notifications.title')}</h4>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} {t('admin.notifications.new')}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? t('admin.notifications.disableSound') : t('admin.notifications.enableSound')}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('admin.actions.actions')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  {t('admin.notifications.markAllRead')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearAll} disabled={notifications.length === 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('admin.notifications.clearAll')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">{t('admin.notifications.noNotifications')}</p>
              <p className="text-sm">{t('admin.notifications.willBeNotified')}</p>
            </div>
          ) : (
            <div className="divide-y">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors group relative ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {notification.link && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-2">
                        <span>{t('admin.notifications.viewDetails')}</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('admin.notifications.markAllRead')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
