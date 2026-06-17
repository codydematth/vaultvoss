import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {getApiError} from '@/lib/api/client';
import {authApi} from '@/lib/api/auth';
import * as Haptics from 'expo-haptics';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {z} from 'zod';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

const schema = z
  .object({
    new_password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain uppercase'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm, {path: ['confirm'], message: 'Passwords do not match'});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {email = '', reset_token = ''} = useLocalSearchParams<{email: string; reset_token: string}>();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {control, handleSubmit, formState: {errors}} = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {new_password: '', confirm: ''},
  });

  const onSubmit = async ({new_password}: FormValues) => {
    setApiError(null);
    setLoading(true);
    try {
      const {data} = await authApi.resetPassword({reset_token: reset_token as string, new_password});
      if (data.hasError) throw new Error(data.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/login');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setApiError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: C.bg, paddingBottom: insets.bottom || 24}}>
      <View style={{paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 8}}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}
          style={{width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center'}}>
          <IconSymbol name='chevron.left' size={16} color={C.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 24}}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={{gap: 8}}>
            <View style={{width: 56, height: 56, borderRadius: 16, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
              <IconSymbol name='lock.open.fill' size={28} color={C.accent} />
            </View>
            <Text variant='heading' color='primary'>New Password</Text>
            <Text variant='body' color='secondary'>Create a strong new password for your account.</Text>
          </View>

          {apiError ? (
            <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 14, backgroundColor: C.expenseDim}}>
              <Text variant='caption' color='danger'>{apiError}</Text>
            </View>
          ) : null}

          <Controller control={control} name='new_password'
            render={({field: {onChange, onBlur, value}}) => (
              <Input label='New Password' placeholder='At least 8 characters' password returnKeyType='next' autoComplete='new-password'
                value={value} onChangeText={onChange} onBlur={onBlur} error={errors.new_password?.message}
                leadingIcon={<IconSymbol name='lock' size={18} color={C.textSecondary} />}
              />
            )}
          />

          <Controller control={control} name='confirm'
            render={({field: {onChange, onBlur, value}}) => (
              <Input label='Confirm Password' placeholder='Repeat new password' password returnKeyType='done' autoComplete='new-password'
                value={value} onChangeText={onChange} onBlur={onBlur} error={errors.confirm?.message}
                onSubmitEditing={handleSubmit(onSubmit)}
                leadingIcon={<IconSymbol name='lock.shield' size={18} color={C.textSecondary} />}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{paddingHorizontal: 24, paddingVertical: 16}}>
        <Button
          label={loading ? 'Updating…' : 'Update Password'}
          variant='primary' size='lg'
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </View>
  );
}
