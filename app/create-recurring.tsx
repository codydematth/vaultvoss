import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useCreateRecurring} from '@/hooks/use-recurring';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {TransactionType} from '@/lib/api/types';
import {useToast} from '@/components/ui/toast';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

export default function CreateRecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const createMutation = useCreateRecurring();

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    if (!name.trim()) { setFormError('Name is required'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setFormError('Enter a valid amount'); return; }
    if (!startDate.trim()) { setFormError('Start date is required'); return; }
    setFormError(null);
    createMutation.mutate(
      {
        transaction_name: name.trim(),
        transaction_type: type,
        amount: Number(amount),
        currency,
        frequency: frequency as any,
        start_date: startDate.trim(),
        note: note.trim() || undefined
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast({message: `Created recurring transaction "${name}"`, type: 'success'});
          router.back();
        },
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">New Recurring Transaction</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeButton}>
          <IconSymbol name="xmark.circle.fill" size={28} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {/* Type toggle */}
          <View style={{flexDirection: 'row', gap: 8, backgroundColor: C.bgCardAlt, borderRadius: 14, padding: 4}}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <Pressable key={t} onPress={() => { Haptics.selectionAsync(); setType(t); }}
                style={{flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: type === t ? (t === 'income' ? C.incomeDim : C.expenseDim) : 'transparent'}}>
                <Text variant='label' style={{color: type === t ? (t === 'income' ? C.income : C.expense) : C.textMuted, fontFamily: Fonts.sansSemiBold}}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </Pressable>
            ))}
          </View>

          <Input label='Name' placeholder='e.g. Netflix, Rent' value={name} onChangeText={setName} returnKeyType='next' />
          
          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1}}><Input label='Amount' placeholder='0.00' value={amount} onChangeText={setAmount} keyboardType='decimal-pad' /></View>
          </View>
          
          <View>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{flexDirection: 'row', gap: 6}}>
                {CURRENCIES.map((c) => (
                  <Pressable key={c} onPress={() => { Haptics.selectionAsync(); setCurrency(c); }}
                    style={{paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: currency === c ? C.accentDim : C.bg, borderWidth: 1, borderColor: currency === c ? C.accent : C.border}}>
                    <Text variant='caption' style={{color: currency === c ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{flexDirection: 'row', gap: 8}}>
                {FREQUENCIES.map((f) => (
                  <Pressable key={f} onPress={() => { Haptics.selectionAsync(); setFrequency(f); }}
                    style={{paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: frequency === f ? C.accentDim : C.bgCardAlt, borderWidth: 1, borderColor: frequency === f ? C.accent : C.border}}>
                    <Text variant='caption' style={{color: frequency === f ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <Input label='Start Date (YYYY-MM-DD)' placeholder={new Date().toISOString().split('T')[0]} value={startDate} onChangeText={setStartDate} keyboardType='numbers-and-punctuation' />
          
          <Input label='Note (optional)' placeholder='Description…' value={note} onChangeText={setNote} />
          
          {formError ? <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 12, backgroundColor: C.expenseDim}}><Text variant='caption' color='danger'>{formError}</Text></View> : null}
          
          <Button label={createMutation.isPending ? 'Saving…' : 'Create Recurring'} variant='primary' size='lg' loading={createMutation.isPending} onPress={handleCreate} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
    paddingBottom: 40,
  },
});
