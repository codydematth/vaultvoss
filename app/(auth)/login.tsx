import {Button} from '@/components/ui/button';
import {GoogleIcon} from '@/components/ui/google-icon';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {LoadingOverlay} from '@/components/ui/loading-overlay';
import {ConfirmDialog} from '@/components/ui/confirm-dialog';
import {Fonts} from '@/constants/theme';
import {useGoogleAuth, useLogin} from '@/hooks/use-auth';
import {zodResolver} from '@hookform/resolvers/zod';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useCallback, useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {z} from 'zod';
import * as LocalAuthentication from 'expo-local-authentication';
import {storage} from '@/lib/storage';
import * as Haptics from 'expo-haptics';
import {useFocusEffect, useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [apiError, setApiError] = useState<string | null>(null);
  const loginMutation = useLogin();
  const googleAuthMutation = useGoogleAuth();
  const [showBiometricConfirm, setShowBiometricConfirm] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<FormValues | null>(null);

  const {control, handleSubmit, formState: {errors}} = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {email: '', password: ''},
  });

  const signInWithGoogle = async () => {
    try {
      setApiError(null);
      await GoogleSignin.hasPlayServices();
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore signout error if already signed out
      }
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        setApiError('Google sign-in failed. No token received.');
        return;
      }
      googleAuthMutation.mutate({id_token: idToken}, {onError: (err) => setApiError(err.message)});
    } catch (error: any) {
      console.log('Google Sign-in error:', error);
      setApiError(error?.message || 'Google sign-in failed.');
    }
  };

  const onSubmit = (values: FormValues) => {
    setApiError(null);
    loginMutation.mutate(values, {
      onSuccess: async () => {
        try {
          const isEnabled = await storage.getBiometricEnabled();
          if (!isEnabled) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) {
              setTempCredentials(values);
              setShowBiometricConfirm(true);
            }
          }
        } catch (err) {
          console.log('Biometric opt-in dialog error:', err);
        }
      },
      onError: (err) => setApiError(err.message),
    });
  };

  const isLoading = loginMutation.isPending || googleAuthMutation.isPending;

  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState('Face ID');

  const triggerBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Log in with ${biometricTypeLabel}`,
        fallbackLabel: 'Use password',
      });

      if (result.success) {
        const creds = await storage.getBiometricCredentials();
        if (creds) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setApiError(null);
          loginMutation.mutate({
            email: creds.email,
            password: creds.pass,
          }, {
            onError: (err) => setApiError(err.message),
          });
        } else {
          setApiError('Biometric credentials not found in storage. Re-enable in settings.');
        }
      }
    } catch (err: any) {
      console.log('Biometric login error:', err);
      setApiError(err?.message || 'Biometric authentication failed.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          const isEnabled = await storage.getBiometricEnabled();
          if (!isEnabled) return;

          const hasHardware = await LocalAuthentication.hasHardwareAsync();
          const isEnrolled = await LocalAuthentication.isEnrolledAsync();
          if (hasHardware && isEnrolled) {
            setHasBiometric(true);

            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
              setBiometricTypeLabel('Face ID');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
              setBiometricTypeLabel('Touch ID');
            } else {
              setBiometricTypeLabel('Biometrics');
            }

            // Small delay to let the screen fully render before showing the prompt
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!cancelled) {
              triggerBiometricLogin();
            }
          }
        } catch (err) {
          console.log('Failed to check biometrics:', err);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={{flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom || 24}}>
      <View style={{height: insets.top + 16}} />

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 16}}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={{alignItems: 'center', marginVertical: 8}}>
            <View style={{width: 80, height: 80, borderRadius: 22, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center'}}>
              <Image source={require('@/assets/images/vaultvoss.png')} style={{width: 52, height: 52}} resizeMode='contain' />
            </View>
          </View>

          {/* Title */}
          <View style={{alignItems: 'center', gap: 4}}>
            <Text variant='heading' color='primary' style={{textAlign: 'center'}}>Welcome Back</Text>
            <Text variant='body' color='secondary' style={{textAlign: 'center'}}>Securely access your financial vault</Text>
          </View>

          {/* Error */}
          {apiError ? (
            <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.expenseDim}}>
              <Text variant='caption' color='danger'>{apiError}</Text>
            </View>
          ) : null}

          {/* Email */}
          <Controller
            control={control}
            name='email'
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                label='Email Address'
                placeholder='you@example.com'
                keyboardType='email-address'
                returnKeyType='next'
                autoComplete='email'
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leadingIcon={<IconSymbol name='envelope' size={18} color={C.textSecondary} />}
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name='password'
            render={({field: {onChange, onBlur, value}}) => (
              <Input
                label='Password'
                placeholder='Enter your password'
                password
                returnKeyType='done'
                autoComplete='current-password'
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                onSubmitEditing={handleSubmit(onSubmit)}
                leadingIcon={<IconSymbol name='lock' size={18} color={C.textSecondary} />}
              />
            )}
          />

          {/* Forgot / Face ID */}
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4}}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/forgot-password'); }} hitSlop={8}>
              <Text variant='caption' color='secondary'>Forgot Password?</Text>
            </Pressable>
            {Platform.OS === 'ios' ? (
              <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} style={{flexDirection: 'row', alignItems: 'center', gap: 4}} hitSlop={8}>
                <IconSymbol name='faceid' size={18} color={C.textSecondary} />
                <Text variant='caption' color='secondary'>Face ID</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Primary Action: Login & Biometrics trigger */}
          <View style={{marginTop: 12, flexDirection: 'row', gap: 10, alignItems: 'center'}}>
            <View style={{flex: 1}}>
              <Button
                label={loginMutation.isPending ? 'Signing in…' : 'Login'}
                variant='primary'
                size='lg'
                loading={loginMutation.isPending}
                onPress={handleSubmit(onSubmit)}
              />
            </View>
            {hasBiometric && (
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); triggerBiometricLogin(); }}
                activeOpacity={0.7}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.border,
                  backgroundColor: C.bgCard,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <IconSymbol name={biometricTypeLabel === 'Face ID' ? 'faceid' : 'lock.shield'} size={28} color={C.accent} />
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8}}>
            <View style={{flex: 1, height: 1, backgroundColor: C.border}} />
            <Text variant='caption' color='muted'>or</Text>
            <View style={{flex: 1, height: 1, backgroundColor: C.border}} />
          </View>

          {/* Google */}
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); signInWithGoogle(); }}
            disabled={isLoading}
            activeOpacity={0.7}
            style={{
              height: 56,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.bgCard,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.6 : 1,
            }}>
            {googleAuthMutation.isPending ? (
              <ActivityIndicator size='small' color={C.textPrimary} />
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <GoogleIcon size={24} />
                <Text variant='label' color='primary' style={{marginLeft: 10, fontFamily: Fonts.sansSemiBold}}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/sign-up'); }}
            activeOpacity={0.7}
            style={{
              alignItems: 'center',
              paddingVertical: 12,
              marginTop: 12,
            }}>
            <Text variant='body' color='secondary'>
              {"Don't have an account? "}
              <Text variant='body' style={{color: C.accent, fontFamily: Fonts.sansSemiBold}}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay visible={isLoading} message="Signing in..." />
      <ConfirmDialog
        visible={showBiometricConfirm}
        title="Enable Biometrics"
        message="Would you like to enable Face ID / Biometrics for faster logins next time?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={async () => {
          setShowBiometricConfirm(false);
          if (tempCredentials) {
            try {
              const scanResult = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm Face ID / Biometrics',
              });
              if (scanResult.success) {
                await storage.saveBiometricCredentials(tempCredentials.email, tempCredentials.password);
                await storage.setBiometricEnabled(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (err) {
              console.log('Biometric opt-in scan error:', err);
            }
          }
        }}
        onCancel={() => setShowBiometricConfirm(false)}
      />
    </View>
  );
}
