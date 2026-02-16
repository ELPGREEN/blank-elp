import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  isLoading: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cache for VAPID key
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidKey) return cachedVapidKey;
  
  const { data, error } = await supabase.functions.invoke('get-vapid-key');
  
  if (error || !data?.publicKey) {
    throw new Error('Failed to get VAPID key');
  }
  
  cachedVapidKey = data.publicKey;
  return cachedVapidKey;
}

export function usePushNotifications() {
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: true,
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(async () => {
    const isSupported = 'serviceWorker' in navigator && 
                        'PushManager' in window && 
                        'Notification' in window;
    
    if (!isSupported) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    const permission = Notification.permission;
    
    // Check if already subscribed
    let isSubscribed = false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      isSubscribed = !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
    }

    setState({
      isSupported: true,
      isSubscribed,
      permission,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (topics: string[] = ['general']) => {
    if (!state.isSupported) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission, isLoading: false }));
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações para receber atualizações.',
          variant: 'destructive',
        });
        return false;
      }

      // Get VAPID public key from edge function
      const vapidPublicKey = await getVapidPublicKey();

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      
      if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
        throw new Error('Invalid subscription');
      }

      // Get current user (optional)
      const { data: { user } } = await supabase.auth.getUser();

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
        user_id: user?.id || null,
        topics,
        language: navigator.language.split('-')[0] || 'pt',
      }, {
        onConflict: 'endpoint',
      });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        isLoading: false,
      }));

      toast({
        title: 'Notificações ativadas!',
        description: 'Você receberá atualizações importantes.',
      });

      return true;
    } catch (error) {
      console.error('Subscription error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar as notificações.',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.isSupported, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();

      if (subscription) {
        // Remove from database
        await supabase.from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        // Unsubscribe from push manager
        await subscription.unsubscribe();
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais atualizações.',
      });

      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [toast]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
