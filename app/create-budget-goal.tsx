import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useCreateBudgetGoal, useUpdateBudgetGoal, useBudgetGoals} from '@/hooks/use-budget-goals';
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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BudgetPeriod, TransactionType, ExpenseCategory, IncomeCategory} from '@/lib/api/types';
import {useToast} from '@/components/ui/toast';
import {formatAmountWithCommas, useCurrency} from '@/lib/currency-context';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
const PERIODS: BudgetPeriod[] = ['weekly', 'monthly', 'yearly'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];
const INCOME_CATEGORIES: IncomeCategory[] = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];
type GoalPeriod = BudgetPeriod;

export default function CreateBudgetGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {currency: activeCurrency} = useCurrency();
  const {id} = useLocalSearchParams<{id?: string}>();
  
  const createMutation = useCreateBudgetGoal();
  const updateMutation = useUpdateBudgetGoal();
  const {data: goals} = useBudgetGoals();

  const editGoal = goals?.find((g) => g.id === id);

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(activeCurrency);
  const [period, setPeriod] = useState<GoalPeriod>('monthly');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | null>('Food');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory | null>('Salary');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editGoal) {
      setType(editGoal.transaction_type);
      setName(editGoal.name);
      setAmount(String(editGoal.amount));
      setCurrency(editGoal.currency);
      setPeriod(editGoal.period);
      if (editGoal.transaction_type === 'expense') {
        setExpenseCategory(editGoal.expense_category ?? 'Food');
      } else {
        setIncomeCategory(editGoal.income_category ?? 'Salary');
      }
    }
  }, [editGoal]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = () => {
    if (!name.trim()) { setFormError('Goal name is required'); return; }
    const parsedAmount = Number(amount.replace(/,/g, ''));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setFormError('Enter a valid amount'); return; }
    setFormError(null);

    const amountNum = parsedAmount;

    if (id) {
      updateMutation.mutate(
        {
          id,
          payload: {
            name: name.trim(),
            amount: amountNum,
            currency,
            period,
          },
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `Updated budget goal "${name}"`, type: 'success'});
            router.back();
          },
          onError: (err) => setFormError(err.message),
        },
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          transaction_type: type,
          amount: amountNum,
          currency,
          period,
          expense_category: type === 'expense' ? expenseCategory : null,
          income_category: type === 'income' ? incomeCategory : null,
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `Created budget goal "${name}"`, type: 'success'});
            router.back();
          },
          onError: (err) => setFormError(err.message),
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">{id ? 'Edit Budget Goal' : 'New Budget Goal'}</Text>
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
          {/* Type toggle (Disabled when editing to maintain target consistency) */}
          <View style={{opacity: id ? 0.6 : 1}}>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Goal Type</Text>
            <View style={{flexDirection: 'row', gap: 8, backgroundColor: C.bgCardAlt, borderRadius: 14, padding: 4}}>
              {(['expense', 'income'] as TransactionType[]).map((t) => {
                const isActive = type === t;
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
                      backgroundColor: isActive ? (t === 'income' ? C.incomeDim : C.expenseDim) : 'transparent'
                    }}
                  >
                    <Text variant='label' style={{color: isActive ? (t === 'income' ? C.income : C.expense) : C.textMuted, fontFamily: Fonts.sansSemiBold}}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Category Selector (Disabled/read-only when editing to maintain endpoint consistency) */}
          <View style={{opacity: id ? 0.6 : 1}}>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{flexDirection: 'row', gap: 6}}>
                {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                  const isSelected = type === 'expense' ? expenseCategory === cat : incomeCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      disabled={!!id}
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

          <Input label='Goal Name' placeholder='e.g. Monthly Food Budget' value={name} onChangeText={setName} returnKeyType='next' />
          
          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1}}><Input label='Amount' placeholder='0.00' value={amount} onChangeText={(val) => setAmount(formatAmountWithCommas(val))} keyboardType='decimal-pad' /></View>
            <View style={{flex: 1}}>
              <Text variant='label' color='secondary' style={{marginBottom: 6}}>Currency</Text>
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
          </View>

          {/* Period */}
          <View>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Period</Text>
            <View style={{flexDirection: 'row', gap: 8}}>
              {PERIODS.map((p) => {
                const isSelected = period === p;
                return (
                  <Pressable 
                    key={p} 
                    onPress={() => { Haptics.selectionAsync(); setPeriod(p); }}
                    style={{
                      flex: 1, 
                      paddingVertical: 12, 
                      borderRadius: 12, 
                      alignItems: 'center', 
                      backgroundColor: isSelected ? C.accent : C.bgCardAlt, 
                      borderWidth: 1, 
                      borderColor: isSelected ? C.accent : C.border
                    }}
                  >
                    <Text variant='caption' style={{color: isSelected ? C.textInverse : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {formError ? <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.borderError, padding: 12, backgroundColor: C.expenseDim}}><Text variant='caption' color='danger'>{formError}</Text></View> : null}
          
          <Button label={isPending ? 'Saving…' : (id ? 'Save Changes' : 'Create Goal')} variant='primary' size='lg' loading={isPending} onPress={handleSave} />
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
    gap: 20,
    paddingBottom: 40,
  },
});
