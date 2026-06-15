import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useVerifyOtp, useForgotPassword} from '@/hooks/use-auth';
import * as Haptics from 'expo-haptics';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {showToast} = useToast();
  const {email = ''} = useLocalSearchParams<{email: string}>();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [apiError, setApiError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const verifyMutation = useVerifyOtp();
  const forgotMutation = useForgotPassword();
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    Haptics.selectionAsync();
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (resendCountdown > 0 || forgotMutation.isPending) return;
    setApiError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    forgotMutation.mutate(
      {email: email as string},
      {
        onSuccess: () => {
          showToast({message: 'OTP code resent successfully!', type: 'success'});
          setResendCountdown(30);
        },
        onError: (err) => {
          setApiError(err.message);
        },
      }
    );
  };

  const handleSubmit = () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) return;
    setApiError(null);
    verifyMutation.mutate(
      {email: email as string, otp},
      {
        onSuccess: (res) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.push({pathname: '/reset-password', params: {email, reset_token: res?.reset_token}});
        },
        onError: (err) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setApiError(err.message);
        },
      }
    );
  };

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  return (
    <View style={{flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom || 24}}>
      {/* Header */}
      <View style={{paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8}}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}
          style={{width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center'}}>
          <IconSymbol name='chevron.left' size={16} color={C.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 32}}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={{gap: 8}}>
            <View style={{width: 56, height: 56, borderRadius: 16, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
              <IconSymbol name='key.fill' size={28} color={C.accent} />
            </View>
            <Text variant='heading' color='primary'>Enter OTP</Text>
            <Text variant='body' color='secondary'>
              We sent a 6-digit code to{'\n'}
              <Text variant='body' style={{color: C.accent, fontFamily: Fonts.sansSemiBold}}>{email}</Text>
            </Text>
          </View>

          {/* OTP inputs */}
          <View style={{flexDirection: 'row', gap: 10, justifyContent: 'center'}}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={[
                  s.otpBox,
                  d ? s.otpBoxFilled : {},
                  i === digits.findIndex((v) => v === '') ? s.otpBoxActive : {},
                ]}
                value={d}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType='number-pad'
                maxLength={1}
                textAlign='center'
                caretHidden
                selectionColor={C.accent}
              />
            ))}
          </View>

          {/* Resend Code Option */}
          <View style={{alignItems: 'center', marginTop: 8}}>
            {resendCountdown > 0 ? (
              <Text variant='body' color='secondary'>
                Resend code in <Text style={{color: C.accent, fontFamily: Fonts.sansSemiBold}}>{resendCountdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={forgotMutation.isPending}>
                <Text variant='body' style={{color: C.accent, fontFamily: Fonts.sansSemiBold, textDecorationLine: 'underline'}}>
                  {forgotMutation.isPending ? 'Resending…' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {apiError ? (
            <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 14, backgroundColor: C.expenseDim}}>
              <Text variant='caption' color='danger'>{apiError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{paddingHorizontal: 24, paddingVertical: 16}}>
        <Button
          label={verifyMutation.isPending ? 'Verifying…' : 'Verify Code'}
          variant='primary' size='lg'
          loading={verifyMutation.isPending}
          disabled={!isComplete}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  otpBox: {
    width: 50, height: 60,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.bgCard,
    fontFamily: Fonts.sansBold,
    fontSize: 24, color: C.textPrimary,
    textAlign: 'center',
  },
  otpBoxFilled: {borderColor: C.accent, backgroundColor: C.accentDim},
  otpBoxActive: {borderColor: C.borderFocus},
});
