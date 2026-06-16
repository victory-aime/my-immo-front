'use client';

import React, { createContext, useCallback, useContext } from 'react';
import { usePushNotifications } from '_hooks/usePushNotifications';
import { useUserContext } from '_context/user-context';
import { NotificationsModule } from '_store/state-management';

type PushNotificationsContextType = {
  enableNotifications: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushNotificationsContextType | null>(null);

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserContext();

  const { mutateAsync: registerPushToken } = NotificationsModule.registerFcmTokenMutation({});

  const handleTokenReady = useCallback(
    async (fcmToken: string) => {
      if (!user?.id) return;

      await registerPushToken({
        payload: { token: fcmToken },
        params: { userId: user.id },
      });
    },
    [user?.id, registerPushToken],
  );

  const { enableNotifications } = usePushNotifications({
    userId: user?.id,
    onTokenReady: handleTokenReady,
  });

  return (
    <PushNotificationsContext.Provider value={{ enableNotifications }}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotificationsContext() {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error('usePushNotificationsContext must be used within PushNotificationsProvider');
  }

  return context;
}
