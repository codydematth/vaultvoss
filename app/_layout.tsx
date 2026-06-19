import {AuthProvider, useAuthContext} from '@/lib/auth/auth-context';
import {queryClient} from '@/lib/query-client';
import {
  Lato_300Light,
  Lato_400Regular,
  Lato_700Bold,
  Lato_900Black,
  useFonts,
} from '@expo-google-fonts/lato';
import {QueryClientProvider} from '@tanstack/react-query';
import {Stack, useRouter, useSegments} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, View, AppState, StyleSheet, Image, useColorScheme} from 'react-native';
import 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';
import {ToastProvider} from '@/components/ui/toast';
import {CurrencyProvider} from '@/lib/currency-context';
import {storage} from '@/lib/storage';
import {requestPermissions} from '@/lib/notifications';
import * as Updates from 'expo-updates';
import { usePreventScreenCapture } from 'expo-screen-capture';
import '../global.css';

// Prevent the splash screen from auto-hiding before assets are loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});


// ─── InitialLayout ────────────────────────────────────────────────────────────
function InitialLayout() {
  usePreventScreenCapture();
  const {isAuthenticated, isLoading, clearSession} = useAuthContext();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [showPrivacyShield, setShowPrivacyShield] = useState(false);
  const appState = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<number | null>(null);
  const hasClearedOnLaunch = useRef(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const splashBgColor = isDark ? '#000000' : '#ffffff';
  const splashImage = isDark 
    ? require('@/assets/images/vaultvoss-white.png') 
    : require('@/assets/images/vaultvoss.png');

  // Track whether user *was* authenticated to detect logout transitions
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const completed = await storage.getOnboardingCompleted();
        setOnboardingCompleted(completed);
      } catch {
        setOnboardingCompleted(false);
      }
    })();
  }, []);

  // Re-check onboarding status if segments change and it's marked false
  useEffect(() => {
    (async () => {
      if (onboardingCompleted === false) {
        const completed = await storage.getOnboardingCompleted().catch(() => false);
        if (completed) {
          setOnboardingCompleted(true);
        }
      }
    })();
  }, [segments, onboardingCompleted]);

  // Request notification permissions on first launch
  useEffect(() => {
    requestPermissions().catch(() => {});
  }, []);

  // Logout user on fresh launch if they were cached/authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasClearedOnLaunch.current) {
      hasClearedOnLaunch.current = true;
      clearSession().catch(err => console.log('Fresh launch logout failed:', err));
    }
  }, [isLoading, isAuthenticated, clearSession]);

  // AppState Listener to logout on background transition threshold and trigger switcher protection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        // Enable App Switcher Protection instantly
        setShowPrivacyShield(true);
        if (appState.current === 'active') {
          backgroundTimeRef.current = Date.now();
        }
      } else if (nextAppState === 'active') {
        // Disable App Switcher Protection when active
        setShowPrivacyShield(false);
        if (backgroundTimeRef.current !== null) {
          const elapsedMin = (Date.now() - backgroundTimeRef.current) / (1000 * 60);
          if (elapsedMin >= 5) {
            if (isAuthenticated) {
              clearSession().catch(err => console.log('Timeout logout failed:', err));
            }
          }
          backgroundTimeRef.current = null;
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, clearSession]);

  // Run weekly email check when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      import('@/lib/weekly-summary-email').then(({ checkAndSendWeeklySummaryEmail }) => {
        checkAndSendWeeklySummaryEmail().catch(err => console.log('Weekly summary email check failed:', err));
      });
    }
  }, [isAuthenticated]);

  // Check for OTA updates on launch (production only)
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (err) {
        console.log('OTA update check failed:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoading || !fontsLoaded || onboardingCompleted === null) return;

    const firstSeg = segments[0] as string | undefined;

    // Ignore terms and privacy routes from auth redirects so modals can open
    if (firstSeg === 'terms' || firstSeg === 'privacy') return;

    const inAuthGroup = firstSeg === '(auth)';
    const atRoot = !firstSeg || firstSeg === 'index';

    if (isAuthenticated) {
      // User is logged in — redirect away from auth/onboarding screens
      wasAuthenticated.current = true;
      if (inAuthGroup || atRoot) {
        router.replace('/(tabs)');
      }
    } else {
      // User is NOT authenticated
      if (wasAuthenticated.current) {
        // Was previously authenticated → this is a logout transition
        wasAuthenticated.current = false;
        router.replace('/login');
      } else if (onboardingCompleted) {
        // First load, onboarding done → go to login (if not already there)
        if (!inAuthGroup) {
          router.replace('/login');
        }
      } else {
        // Onboarding not done → show onboarding at root
        if (!atRoot) {
          router.replace('/');
        }
      }
    }
  }, [isAuthenticated, isLoading, fontsLoaded, onboardingCompleted, router, segments]);

  useEffect(() => {
    if (!isLoading && fontsLoaded && onboardingCompleted !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, fontsLoaded, onboardingCompleted]);

  if (isLoading || !fontsLoaded || onboardingCompleted === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color='#000000' size='large' />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{headerShown: false}}>
        <Stack.Screen name="terms" options={{presentation: 'modal'}} />
        <Stack.Screen name="privacy" options={{presentation: 'modal'}} />
        <Stack.Screen name="currency" options={{presentation: 'modal'}} />
        <Stack.Screen name="create-transaction" options={{presentation: 'modal'}} />
        <Stack.Screen name="create-net-worth" options={{presentation: 'modal'}} />
        <Stack.Screen name="create-budget-goal" options={{presentation: 'modal'}} />
        <Stack.Screen name="create-recurring" options={{presentation: 'modal'}} />
        <Stack.Screen name="notifications" options={{presentation: 'modal'}} />
        <Stack.Screen name="transaction/[id]" options={{presentation: 'card'}} />
      </Stack>
      {showPrivacyShield && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: splashBgColor, justifyContent: 'center', alignItems: 'center', zIndex: 99999 }]}>
          <Image 
            source={splashImage} 
            style={{ width: 200, height: 200 }} 
            resizeMode="contain" 
          />
        </View>
      )}
    </>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <CurrencyProvider>
          <AuthProvider>
            <InitialLayout />
            <StatusBar style='dark' backgroundColor='#FFFFFF' />
          </AuthProvider>
        </CurrencyProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
