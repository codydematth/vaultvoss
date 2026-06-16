import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useCreateTransaction} from '@/hooks/use-transactions';
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
import {useToast} from '@/components/ui/toast';
import {useCurrency, CURRENCY_SYMBOLS, formatAmountWithCommas} from '@/lib/currency-context';
import type {ExpenseCategory, IncomeCategory, TransactionType} from '@/lib/api/types';

const EXPENSE_CATS: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];
const INCOME_CATS: IncomeCategory[] = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY', 'CHF', 'INR'];

export default function CreateTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {currency: activeCurrency} = useCurrency();
  const createMutation = useCreateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(activeCurrency);
  const [expenseCat, setExpenseCat] = useState<ExpenseCategory>('Food');
  const [incomeCat, setIncomeCat] = useState<IncomeCategory>('Salary');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSubmit = () => {
    if (!name.trim()) { setError('Transaction name is required'); return; }
    const parsedAmount = Number(amount.replace(/,/g, ''));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError('Enter a valid amount'); return; }
    setError(null);

    const payload = {
      transaction_name: name.trim(),
      transaction_type: type,
      amount: parsedAmount,
      currency,
      note: note.trim() || undefined,
      expense_category: type === 'expense' ? expenseCat : undefined,
      income_category: type === 'income' ? incomeCat : undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast({message: `Added transaction "${payload.transaction_name}"`, type: 'success'});
        router.back();
      },
      onError: (err) => setError(err.message),
    });
  };

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const selectedCat = type === 'expense' ? expenseCat : incomeCat;

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">Create Transaction</Text>
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
              <Pressable
                key={t}
                onPress={() => { Haptics.selectionAsync(); setType(t); }}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                  backgroundColor: type === t ? (t === 'income' ? C.incomeDim : C.expenseDim) : 'transparent',
                }}>
                <Text variant='label' style={{color: type === t ? (t === 'income' ? C.income : C.expense) : C.textMuted, fontFamily: Fonts.sansSemiBold}}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Name */}
          <Input
            label='Transaction Name'
            placeholder={type === 'expense' ? 'e.g. Netflix, Grocery' : 'e.g. Monthly Salary'}
            value={name}
            onChangeText={setName}
            returnKeyType='next'
            leadingIcon={<IconSymbol name='text.alignleft' size={18} color={C.textSecondary} />}
          />

          {/* Amount + Currency row */}
          <View style={{flexDirection: 'row', gap: 10}}>
            <View style={{flex: 1}}>
              <Input
                label='Amount'
                placeholder='0.00'
                value={amount}
                onChangeText={(val) => setAmount(formatAmountWithCommas(val))}
                keyboardType='decimal-pad'
                returnKeyType='done'
                leadingIcon={
                  <Text style={{fontSize: 16, color: C.textSecondary, fontFamily: Fonts.sansSemiBold}}>
                    {CURRENCY_SYMBOLS[currency] ?? currency}
                  </Text>
                }
              />
            </View>
            {/* Selected currency indicator */}
            <View style={{width: 90}}>
              <Text variant='label' color='secondary' style={{marginBottom: 6}}>Currency</Text>
              <View style={{height: 56, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.bgInput, alignItems: 'center', justifyContent: 'center'}}>
                <Text variant='subheading' color='primary'>{currency}</Text>
              </View>
            </View>
          </View>

          {/* Currency selector row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection: 'row', gap: 8}}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { Haptics.selectionAsync(); setCurrency(c); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                    backgroundColor: currency === c ? C.accentDim : C.bg,
                    borderWidth: 1, borderColor: currency === c ? C.accent : C.border,
                  }}>
                  <Text variant='caption' style={{color: currency === c ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Category */}
          <View>
            <Text variant='label' color='secondary' style={{marginBottom: 8}}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{flexDirection: 'row', gap: 8}}>
                {(cats as string[]).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { Haptics.selectionAsync(); type === 'expense' ? setExpenseCat(cat as ExpenseCategory) : setIncomeCat(cat as IncomeCategory); }}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                      backgroundColor: selectedCat === cat ? C.accentDim : C.bg,
                      borderWidth: 1, borderColor: selectedCat === cat ? C.accent : C.border,
                    }}>
                    <Text variant='caption' style={{color: selectedCat === cat ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Note */}
          <Input
            label='Note (optional)'
            placeholder='Add a description…'
            value={note}
            onChangeText={setNote}
            returnKeyType='done'
            leadingIcon={<IconSymbol name='note.text' size={18} color={C.textSecondary} />}
          />

          {error ? (
            <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 12, backgroundColor: C.expenseDim}}>
              <Text variant='caption' color='danger'>{error}</Text>
            </View>
          ) : null}

          <Button
            label={createMutation.isPending ? 'Saving…' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            variant='primary' size='lg'
            loading={createMutation.isPending}
            onPress={handleSubmit}
          />
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
