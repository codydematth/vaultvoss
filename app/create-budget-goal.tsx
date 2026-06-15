import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useCreateBudgetGoal} from '@/hooks/use-budget-goals';
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
import type {BudgetPeriod, TransactionType} from '@/lib/api/types';
import {useToast} from '@/components/ui/toast';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
const PERIODS: BudgetPeriod[] = ['weekly', 'monthly', 'yearly'];
type GoalPeriod = BudgetPeriod;

export default function CreateBudgetGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const createMutation = useCreateBudgetGoal();

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [period, setPeriod] = useState<GoalPeriod>('monthly');
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleCreate = () => {
    if (!name.trim()) { setFormError('Goal name is required'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setFormError('Enter a valid amount'); return; }
    setFormError(null);
    createMutation.mutate(
      {name: name.trim(), transaction_type: type, amount: Number(amount), currency, period},
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast({message: `Created budget goal "${name}"`, type: 'success'});
          router.back();
        },
        onError: (err) => setFormError(err.message),
      },
    );
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">New Budget Goal</Text>
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

          <Input label='Goal Name' placeholder='e.g. Monthly Food Budget' value={name} onChangeText={setName} returnKeyType='next' />
          
          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1}}><Input label='Amount' placeholder='0.00' value={amount} onChangeText={setAmount} keyboardType='decimal-pad' /></View>
            <View style={{flex: 1}}>
              <Text variant='label' color='secondary' style={{marginBottom: 6}}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 6}}>
                  {CURRENCIES.map((c) => (
                    <Pressable key={c} onPress={() => { Haptics.selectionAsync(); setCurrency(c); }}
                      style={{paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: currency === c ? C.accentDim : C.bg, borderWidth: 1, borderColor: currency === c ? C.accent : C.border}}>
                      <Text variant='caption' style={{color: currency === c ? C.accent : C.textSecondary}}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Period */}
          <View>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Period</Text>
            <View style={{flexDirection: 'row', gap: 8}}>
              {PERIODS.map((p) => (
                <Pressable key={p} onPress={() => { Haptics.selectionAsync(); setPeriod(p); }}
                  style={{flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: period === p ? C.accentDim : C.bgCardAlt, borderWidth: 1, borderColor: period === p ? C.accent : C.border}}>
                  <Text variant='caption' style={{color: period === p ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {formError ? <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 12, backgroundColor: C.expenseDim}}><Text variant='caption' color='danger'>{formError}</Text></View> : null}
          
          <Button label={createMutation.isPending ? 'Saving…' : 'Create Goal'} variant='primary' size='lg' loading={createMutation.isPending} onPress={handleCreate} />
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
