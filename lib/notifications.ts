import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Android channel (required for Android 8+)
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vaultvoss-general', {
      name: 'VaultVoss',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0088FF',
    });
  }
}

// Request permissions
export async function requestPermissions(): Promise<boolean> {
  await ensureAndroidChannel();

  const settings = (await Notifications.getPermissionsAsync()) as any;
  if (settings.status === 'granted' || settings.granted) return true;

  const request = (await Notifications.requestPermissionsAsync()) as any;
  return request.status === 'granted' || request.granted;
}

// Fetch Expo Push Token and register it to the backend along with timezone
export async function registerPushNotifications(): Promise<string | null> {
  try {
    const granted = await requestPermissions();
    if (!granted) {
      console.log('[Push] Notification permissions not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '2c15d7e6-e24e-40c7-bc3e-70d8c828cef2';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    let timezone = 'UTC';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (tzErr) {
      console.log('[Push] Error detecting timezone, using UTC:', tzErr);
    }

    // Upload to server
    const { usersApi } = await import('@/lib/api/auth');
    await usersApi.updateNotifications({
      expo_push_token: token,
      timezone,
    });

    console.log('[Push] Registered push token and timezone successfully:', token, timezone);
    return token;
  } catch (error) {
    console.error('[Push] Failed to register push notifications on backend:', error);
    return null;
  }
}
