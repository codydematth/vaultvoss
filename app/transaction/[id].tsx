import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useTransaction, useUpdateTransaction, useDeleteTransaction} from '@/hooks/use-transactions';
import * as Haptics from 'expo-haptics';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useState, useEffect} from 'react';
import {ConfirmDialog} from '@/components/ui/confirm-dialog';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useCurrency, CURRENCY_SYMBOLS} from '@/lib/currency-context';
import type {ExpenseCategory, IncomeCategory, TransactionType} from '@/lib/api/types';

const EXPENSE_CATS: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];
const INCOME_CATS: IncomeCategory[] = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY', 'CHF', 'INR'];

export default function EditTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const {showToast} = useToast();
  
  const {data: transaction, isLoading, error: fetchError} = useTransaction(id);
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expenseCat, setExpenseCat] = useState<ExpenseCategory>('Food');
  const [incomeCat, setIncomeCat] = useState<IncomeCategory>('Salary');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction && !hasInitialized) {
      setType(transaction.transaction_type);
      setName(transaction.transaction_name);
      setAmount(String(transaction.amount));
      setCurrency(transaction.currency);
      if (transaction.transaction_type === 'expense') {
        setExpenseCat((transaction.expense_category as ExpenseCategory) ?? 'Food');
      } else {
        setIncomeCat((transaction.income_category as IncomeCategory) ?? 'Salary');
      }
      setNote(transaction.note ?? '');
      setHasInitialized(true);
    }
  }, [transaction, hasInitialized]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowDeleteConfirm(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) { setFormError('Transaction name is required'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setFormError('Enter a valid amount'); return; }
    setFormError(null);

    const payload = {
      transaction_name: name.trim(),
      transaction_type: type,
      amount: Number(amount),
      currency,
      note: note.trim() || null,
      expense_category: type === 'expense' ? expenseCat : null,
      income_category: type === 'income' ? incomeCat : null,
    };

    updateMutation.mutate({id, payload}, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast({message: `Updated transaction "${payload.transaction_name}"`, type: 'success'});
        router.back();
      },
      onError: (err) => setFormError(err.message),
    });
  };

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const selectedCat = type === 'expense' ? expenseCat : incomeCat;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {paddingTop: insets.top}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansSemiBold}}>Loading Transaction...</Text>
          <View style={{width: 36}} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </View>
    );
  }

  if (fetchError || !transaction) {
    return (
      <View style={[styles.loadingContainer, {paddingTop: insets.top}]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansSemiBold}}>Error</Text>
          <View style={{width: 36}} />
        </View>
        <View style={[styles.center, {paddingHorizontal: 24, gap: 16}]}>
          <Text variant="body" color="danger" style={{textAlign: 'center'}}>
            {fetchError?.message || 'Transaction not found'}
          </Text>
          <Button label="Go Back" onPress={handleBack} variant="secondary" size="md" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={12} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansSemiBold}}>Edit Transaction</Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={12} style={styles.deleteButton}>
          <IconSymbol name="trash" size={20} color={C.expense} />
        </TouchableOpacity>
      </View>

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
                onChangeText={setAmount}
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

          {formError ? (
            <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.expense, padding: 12, backgroundColor: C.expenseDim}}>
              <Text variant='caption' color='danger'>{formError}</Text>
            </View>
          ) : null}

          <Button
            label={updateMutation.isPending ? 'Saving Changes…' : 'Save Changes'}
            variant='primary' size='lg'
            loading={updateMutation.isPending}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteMutation.mutate(id, {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast({message: `Deleted transaction "${name}"`, type: 'success'});
              router.back();
            },
            onError: (err) => {
              showToast({message: err.message, type: 'error'});
            }
          });
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.expenseDim,
    borderWidth: 1,
    borderColor: C.expense + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
    paddingBottom: 40,
  },
});
