import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {useForgotPassword} from '@/hooks/use-auth';
import {zodResolver} from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {z} from 'zod';

const schema = z.object({email: z.string().min(1, 'Email is required').email('Enter a valid email')});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [apiError, setApiError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const forgotMutation = useForgotPassword();

  const {control, handleSubmit, getValues, formState: {errors}} = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {email: ''},
  });

  const onSubmit = (values: FormValues) => {
    setApiError(null);
    forgotMutation.mutate(values, {
      onSuccess: () => setSent(true),
      onError: (err) => setApiError(err.message),
    });
  };

  return (
    <View style={{flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom || 24}}>
      <View style={{paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8}}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}
          style={{width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center'}}>
          <IconSymbol name='chevron.left' size={16} color={C.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 24}}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={{gap: 8}}>
            <View style={{width: 56, height: 56, borderRadius: 16, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
              <IconSymbol name='lock.rotation' size={28} color={C.accent} />
            </View>
            <Text variant='heading' color='primary'>Reset Password</Text>
            <Text variant='body' color='secondary'>Enter your email and we'll send you a reset code.</Text>
          </View>

          {sent ? (
            <View style={{borderRadius: 16, borderWidth: 1, borderColor: C.income, backgroundColor: C.incomeDim, padding: 16, gap: 8}}>
              <Text variant='subheading' color='income'>Code sent!</Text>
              <Text variant='body' color='secondary'>Check your inbox for the OTP code, then enter it below.</Text>
              <Button
                label='Enter OTP Code'
                variant='primary' size='md'
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push({pathname: '/verify-otp', params: {email: getValues('email')}}); }}
              />
            </View>
          ) : null}

          {apiError ? (
            <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 14, backgroundColor: C.expenseDim}}>
              <Text variant='caption' color='danger'>{apiError}</Text>
            </View>
          ) : null}

          <Controller control={control} name='email'
            render={({field: {onChange, onBlur, value}}) => (
              <Input label='Email Address' placeholder='you@example.com' keyboardType='email-address' autoComplete='email' returnKeyType='send'
                value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message}
                onSubmitEditing={handleSubmit(onSubmit)}
                leadingIcon={<IconSymbol name='envelope' size={18} color={C.textSecondary} />}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{paddingHorizontal: 24, paddingVertical: 16}}>
        <Button
          label={forgotMutation.isPending ? 'Sending…' : 'Send Reset Code'}
          variant='primary' size='lg'
          loading={forgotMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </View>
  );
}
