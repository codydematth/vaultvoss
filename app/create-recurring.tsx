import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useCreateRecurring, useUpdateRecurring, useRecurringTransaction} from '@/hooks/use-recurring';
import * as Haptics from 'expo-haptics';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useState, useEffect} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {TransactionType, ExpenseCategory, IncomeCategory} from '@/lib/api/types';
import {useToast} from '@/components/ui/toast';
import {formatAmountWithCommas, useCurrency} from '@/lib/currency-context';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];
const INCOME_CATEGORIES: IncomeCategory[] = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];

export default function CreateRecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {currency: activeCurrency} = useCurrency();
  const {id} = useLocalSearchParams<{id?: string}>();

  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const {data: detail, isLoading: isDetailLoading} = useRecurringTransaction(id ?? '');

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(activeCurrency);
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | null>('Food');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory | null>('Salary');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setType(detail.transaction_type);
      setName(detail.transaction_name);
      setAmount(String(detail.amount));
      setCurrency(detail.currency);
      setFrequency(detail.frequency);
      setStartDate(detail.start_date);
      setNote(detail.note ?? '');
      setIsActive(detail.is_active);
      if (detail.transaction_type === 'expense') {
        setExpenseCategory(detail.expense_category ?? 'Food');
      } else {
        setIncomeCategory(detail.income_category ?? 'Salary');
      }
    }
  }, [detail]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = () => {
    if (!name.trim()) { setFormError('Name is required'); return; }
    const parsedAmount = Number(amount.replace(/,/g, ''));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setFormError('Enter a valid amount'); return; }
    if (!startDate.trim()) { setFormError('Start date is required'); return; }
    setFormError(null);

    const amountNum = parsedAmount;

    if (id) {
      updateMutation.mutate(
        {
          id,
          payload: {
            transaction_name: name.trim(),
            amount: amountNum,
            currency,
            frequency: frequency as any,
            note: note.trim() || undefined,
            is_active: isActive,
            expense_category: type === 'expense' ? expenseCategory : null,
            income_category: type === 'income' ? incomeCategory : null,
          },
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `Updated recurring transaction "${name}"`, type: 'success'});
            router.back();
          },
          onError: (err: any) => setFormError(err.message),
        },
      );
    } else {
      createMutation.mutate(
        {
          transaction_name: name.trim(),
          transaction_type: type,
          amount: amountNum,
          currency,
          frequency: frequency as any,
          start_date: startDate.trim(),
          note: note.trim() || undefined,
          expense_category: type === 'expense' ? expenseCategory : null,
          income_category: type === 'income' ? incomeCategory : null,
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
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">{id ? 'Edit Recurring' : 'New Recurring'}</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeButton}>
          <IconSymbol name="xmark.circle.fill" size={28} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {id && isDetailLoading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={{flex: 1}} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* Type toggle */}
            <View style={{opacity: id ? 0.6 : 1}}>
              <Text variant='label' color='secondary' style={{marginBottom: 8}}>Transaction Type</Text>
              <View style={{flexDirection: 'row', gap: 8, backgroundColor: C.bgCardAlt, borderRadius: 14, padding: 4}}>
                {(['expense', 'income'] as TransactionType[]).map((t) => {
                  const isActiveType = type === t;
                  return (
                    <Pressable 
                      key={t} 
                      disabled={!!id}
                      onPress={() => { Haptics.selectionAsync(); setType(t); }}
                      style={{
                        flex: 1, 
                        paddingVertical: 10, 
                        borderRadius: 10, 
                        alignItems: 'center', 
                        backgroundColor: isActiveType ? (t === 'income' ? C.incomeDim : C.expenseDim) : 'transparent'
                      }}
                    >
                      <Text variant='label' style={{color: isActiveType ? (t === 'income' ? C.income : C.expense) : C.textMuted, fontFamily: Fonts.sansSemiBold}}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Selector */}
            <View>
              <Text variant='label' color='secondary' style={{marginBottom: 8}}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 6}}>
                  {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                    const isSelected = type === 'expense' ? expenseCategory === cat : incomeCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => {
                          Haptics.selectionAsync();
                          if (type === 'expense') {
                            setExpenseCategory(cat as ExpenseCategory);
                          } else {
                            setIncomeCategory(cat as IncomeCategory);
                          }
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: isSelected ? C.accentDim : C.bg,
                          borderWidth: 1,
                          borderColor: isSelected ? C.accent : C.border,
                        }}
                      >
                        <Text variant='caption' style={{color: isSelected ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <Input label='Name' placeholder='e.g. Netflix, Rent' value={name} onChangeText={setName} returnKeyType='next' />
            
            <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}><Input label='Amount' placeholder='0.00' value={amount} onChangeText={(val) => setAmount(formatAmountWithCommas(val))} keyboardType='decimal-pad' /></View>
            </View>
            
            <View>
              <Text variant='label' color='secondary' style={{marginBottom: 8}}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 6}}>
                  {CURRENCIES.map((c) => {
                    const isSelected = currency === c;
                    return (
                      <Pressable 
                        key={c} 
                        onPress={() => { Haptics.selectionAsync(); setCurrency(c); }}
                        style={{
                          paddingHorizontal: 12, 
                          paddingVertical: 8, 
                          borderRadius: 10, 
                          backgroundColor: isSelected ? C.accentDim : C.bg, 
                          borderWidth: 1, 
                          borderColor: isSelected ? C.accent : C.border
                        }}
                      >
                        <Text variant='caption' style={{color: isSelected ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View>
              <Text variant='label' color='secondary' style={{marginBottom: 8}}>Frequency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 8}}>
                  {FREQUENCIES.map((f) => {
                    const isSelected = frequency === f;
                    return (
                      <Pressable 
                        key={f} 
                        onPress={() => { Haptics.selectionAsync(); setFrequency(f); }}
                        style={{
                          paddingHorizontal: 14, 
                          paddingVertical: 8, 
                          borderRadius: 12, 
                          backgroundColor: isSelected ? C.accent : C.bgCardAlt, 
                          borderWidth: 1, 
                          borderColor: isSelected ? C.accent : C.border
                        }}
                      >
                        <Text variant='caption' style={{color: isSelected ? C.textInverse : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Start Date is set only on creation */}
            {!id && (
              <Input label='Start Date (YYYY-MM-DD)' placeholder={new Date().toISOString().split('T')[0]} value={startDate} onChangeText={setStartDate} keyboardType='numbers-and-punctuation' />
            )}

            <Input label='Note (optional)' placeholder='Description…' value={note} onChangeText={setNote} />

            {id && (
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.bgCard, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border}}>
                <View style={{gap: 2}}>
                  <Text variant="body" weight="semibold">Template Active</Text>
                  <Text variant="caption" color="secondary">Whether this recurring transaction should trigger</Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsActive(v); }}
                  trackColor={{true: C.income, false: C.border}}
                  thumbColor={Platform.OS === 'android' ? C.white : undefined}
                />
              </View>
            )}
            
            {formError ? <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.borderError, padding: 12, backgroundColor: C.expenseDim}}><Text variant='caption' color='danger'>{formError}</Text></View> : null}
            
            <Button label={isPending ? 'Saving…' : (id ? 'Save Changes' : 'Create Recurring')} variant='primary' size='lg' loading={isPending} onPress={handleSave} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
    gap: 20,
    paddingBottom: 40,
  },
});
