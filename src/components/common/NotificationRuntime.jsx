import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { API_CONFIG } from '../../config/api';
import { apiClient } from '../../lib/apiClient';
import { tokenStore } from '../../lib/tokenStore';
import { notificationModule, startPushSession } from '../../services/nativeNotifications';
import { createRealtimeController } from '../../services/realtimeController.cjs';

export default function NotificationRuntime({ navigationRef }) {
  const { user, role } = useAuth();
  const client = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const controller = createRealtimeController({
      queryClient: client,
      user,
      apiClient,
      tokenStore,
      getAppState: () => AppState.currentState,
      createWebSocket: url => new WebSocket(url),
      apiUrl: API_CONFIG.BASE_URL,
    });

    controller.connect();

    const stateSub = AppState.addEventListener('change', value => {
      controller.onAppStateChange(value);
    });

    const stopPush = startPushSession(user.user_id);
    const native = notificationModule();
    native?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const received = native?.addNotificationReceivedListener(notification => {
      controller.onPushNotificationReceived(notification);
    });

    const open = response => {
      if (!response || !navigationRef.current?.isReady()) return;
      navigationRef.current.navigate(role === 'student' ? 'StudentNotifications' : 'StaffNotifications');
      native.clearLastNotificationResponseAsync().catch(() => {});
    };

    const tapped = native?.addNotificationResponseReceivedListener(open);
    const coldOpen = setTimeout(() => native?.getLastNotificationResponseAsync().then(open).catch(() => {}), 1000);

    return () => {
      clearTimeout(coldOpen);
      stateSub.remove();
      received?.remove();
      tapped?.remove();
      stopPush();
      controller.disconnect();
    };
  }, [user?.user_id, role, client, navigationRef]);

  return null;
}
