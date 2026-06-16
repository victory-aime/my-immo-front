import { useEffect, useRef } from 'react';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { firebaseMessaging } from '../lib/firebase';
import { BaseToast } from '_components/custom';
import { StorageKey } from '_constants/StorageKeys';
import { getDeviceKey } from '_utils/get-deviceKey';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsePushNotificationsOptions {
  userId?: string;
  /** Appel vers ton backend pour persister le token */
  onTokenReady: (fcmToken: string, deviceKey: string) => Promise<void>;
}

function isBrowserSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/** Vide toutes les clés push du localStorage — à appeler au remote */
export function clearPushStorage(): void {
  localStorage.removeItem(StorageKey.FCM_TOKEN_STORAGE_KEY);
  localStorage.removeItem(StorageKey.DEVICE_STORAGE_KEY);
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

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
      const [fcmToken, deviceKey] = await Promise.all([
        resolveFcmToken(firebaseMessaging!),
        getDeviceKey(),
      ]);

      console.log('deviceKey', deviceKey);

      if (!fcmToken || !deviceKey) return;

      await onTokenReady(fcmToken, deviceKey);
      localStorage.setItem(StorageKey.FCM_TOKEN_STORAGE_KEY, fcmToken);
      localStorage.setItem(StorageKey.DEVICE_STORAGE_KEY, deviceKey);
    } catch (error) {
      console.error('[Push] Erreur initialisation:', error);
    }
  };

  useEffect(() => {
    const syncToken = async () => {
      if (!userId || !firebaseMessaging) return;

      if (Notification.permission !== 'granted') {
        return;
      }
      const storedToken = localStorage.getItem(StorageKey.FCM_TOKEN_STORAGE_KEY);
      const storedDeviceKey = localStorage.getItem(StorageKey.DEVICE_STORAGE_KEY);

      if (!storedToken || !storedDeviceKey) return;

      try {
        const fcmToken = await resolveFcmToken(firebaseMessaging);
        if (!fcmToken) return;

        if (storedToken === fcmToken) return;

        await onTokenReady(fcmToken, storedDeviceKey);
        localStorage.setItem(StorageKey.FCM_TOKEN_STORAGE_KEY, fcmToken);
      } catch (e) {
        console.error('[Push] Erreur syncToken:', e);
      }
    };

    syncToken();
  }, [userId, onTokenReady]);

  useEffect(() => {
    if (!firebaseMessaging) return;

    unsubscribeRef.current?.();

    unsubscribeRef.current = onMessage(firebaseMessaging, (payload) => {
      BaseToast({
        title: payload.data?.title,
        description: payload.data?.body,
      });
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  return {
    enableNotifications,
  };
}
