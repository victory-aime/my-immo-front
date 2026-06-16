import { useEffect, useRef } from 'react';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { firebaseMessaging } from '../lib/firebase';
import { BaseToast } from '_components/custom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsePushNotificationsOptions {
  userId?: string;
  /** Appel vers ton backend pour persister le token */
  onTokenReady: (fcmToken: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isBrowserSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

async function requestPermissionIfNeeded(): Promise<NotificationPermission> {
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

async function resolveFcmToken(messaging: Messaging): Promise<string | null> {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[Push] NEXT_PUBLIC_FIREBASE_VAPID_KEY manquant');
    return null;
  }
  const token = await getToken(messaging, { vapidKey });
  return token || null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications({ userId, onTokenReady }: UsePushNotificationsOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const enableNotifications = async () => {
    if (!userId) return;
    if (!isBrowserSupported()) return;
    if (!firebaseMessaging) return;

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        return;
      }

      const fcmToken = await resolveFcmToken(firebaseMessaging);

      if (!fcmToken) return;

      await onTokenReady(fcmToken);

      unsubscribeRef.current?.();

      unsubscribeRef.current = onMessage(firebaseMessaging, (payload) => {
        BaseToast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });
    } catch (error) {
      console.error('[Push] Erreur initialisation:', error);
    }
  };

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  return {
    enableNotifications,
  };
}
