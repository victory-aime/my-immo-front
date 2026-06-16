import { StorageKey } from '_constants/StorageKeys';

export const shouldShowPushBanner = () => {
  if (typeof window === 'undefined') return false;
  if (Notification.permission === 'granted') return false;
  if (Notification.permission === 'denied') return false;

  const lastDismiss = localStorage.getItem(StorageKey.PUSH_NOTIFICATION_BANNER_DISMISS_DATE);
  if (!lastDismiss) return true;

  const diff = Date.now() - Number(lastDismiss);
  const COOLDOWN_MS = 3 * 60 * 1000; //3 * 24 * 60 * 60 * 1000;

  return diff > COOLDOWN_MS;
};
