// src/lib/push.ts
const DEVICE_ID_KEY = 'chat_device_id';

/** Identifiant stable de l'appareil (persiste dans localStorage) */
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** Convertit la clé VAPID base64url → Uint8Array (requis par l'API navigator) */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function registerWebPush(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Not supported in this browser');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  // 1. Enregistre le Service Worker
  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
  });
  await navigator.serviceWorker.ready;

  // 2. Souscrit aux push VAPID
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    }));

  const json = subscription.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  // 3. Envoie la subscription au backend
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/push-subscriptions/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        platform: 'WEB',
        deviceId: getDeviceId(),
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        authKey: json.keys.auth,
      }),
    },
  );
  console.log('data subs', data);
  return data;
}
