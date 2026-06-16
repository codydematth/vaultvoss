import {TransactionRow} from '@/components/TransactionRow';
import {Text} from '@/components/ui/text';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useTransactions} from '@/hooks/use-transactions';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useQueryClient} from '@tanstack/react-query';
import {useCurrency} from '@/lib/currency-context';
import type {TransactionType, Transaction, ExpenseCategory, IncomeCategory, TransactionListParams} from '@/lib/api/types';

type Filter = 'all' | TransactionType;

const EXPENSE_CATS: ExpenseCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];
const INCOME_CATS: IncomeCategory[] = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];

function groupByDate(txns: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const t of txns) {
    const dateKey = t.date ?? t.created_at?.split('T')[0] ?? 'Unknown';
    const label = formatDateLabel(dateKey);
    if (!groups[label]) groups[label] = [];
    groups[label].push(t);
  }
  return Object.entries(groups).map(([title, data]) => ({title, data}));
}

function formatDateLabel(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {day: 'numeric', month: 'long', year: 'numeric'});
  } catch { return dateStr; }
}

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const {showToast} = useToast();
  const {formatMoney} = useCurrency();

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Advanced query parameters passed directly to API hook
  const [apiFilters, setApiFilters] = useState<TransactionListParams>({
    limit: 100,
  });

  // Fetch transactions using react-query hook, auto-refetching whenever apiFilters changes
  const {data: transactions, isLoading} = useTransactions(apiFilters);

  // Local temporary states for filtering modal
  const [tempType, setTempType] = useState<Filter>('all');
  const [tempExpenseCat, setTempExpenseCat] = useState<ExpenseCategory | 'all'>('all');
  const [tempIncomeCat, setTempIncomeCat] = useState<IncomeCategory | 'all'>('all');
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [tempMinAmount, setTempMinAmount] = useState('');
  const [tempMaxAmount, setTempMaxAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeChips = useMemo(() => {
    const chips: { key: keyof TransactionListParams; label: string }[] = [];
    if (apiFilters.expense_category) {
      chips.push({ key: 'expense_category', label: `Category: ${apiFilters.expense_category}` });
    }
    if (apiFilters.income_category) {
      chips.push({ key: 'income_category', label: `Category: ${apiFilters.income_category}` });
    }
    if (apiFilters.date_from) {
      chips.push({ key: 'date_from', label: `From: ${apiFilters.date_from}` });
    }
    if (apiFilters.date_to) {
      chips.push({ key: 'date_to', label: `To: ${apiFilters.date_to}` });
    }
    if (apiFilters.min_amount !== undefined) {
      chips.push({ key: 'min_amount', label: `Min: ${formatMoney(apiFilters.min_amount)}` });
    }
    if (apiFilters.max_amount !== undefined) {
      chips.push({ key: 'max_amount', label: `Max: ${formatMoney(apiFilters.max_amount)}` });
    }
    return chips;
  }, [apiFilters, formatMoney]);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.transaction_name.toLowerCase().includes(q) ||
        (t.expense_category ?? '').toLowerCase().includes(q) ||
        (t.income_category ?? '').toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await qc.invalidateQueries({queryKey: ['transactions']});
    setRefreshing(false);
  };

  const handleTabPress = (typeFilter: Filter) => {
    setApiFilters((prev) => ({
      ...prev,
      transaction_type: typeFilter === 'all' ? undefined : typeFilter,
      expense_category: undefined,
      income_category: undefined,
    }));
  };

  const openFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempType(apiFilters.transaction_type ?? 'all');
    setTempExpenseCat(apiFilters.expense_category ?? 'all');
    setTempIncomeCat(apiFilters.income_category ?? 'all');
    setTempDateFrom(apiFilters.date_from ?? '');
    setTempDateTo(apiFilters.date_to ?? '');
    setTempMinAmount(apiFilters.min_amount !== undefined ? String(apiFilters.min_amount) : '');
    setTempMaxAmount(apiFilters.max_amount !== undefined ? String(apiFilters.max_amount) : '');
    setValidationError(null);
    setShowFilterModal(true);
  };

  const handleClearChip = (key: keyof TransactionListParams) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setApiFilters((prev) => {
      const next = {...prev};
      delete next[key];
      return next;
    });
  };

  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setApiFilters({limit: 100});
    setShowFilterModal(false);
  };

  const handleApplyFilters = () => {
    setValidationError(null);

    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (tempDateFrom.trim() && !dateRegex.test(tempDateFrom.trim())) {
      setValidationError('From Date must be in YYYY-MM-DD format');
      return;
    }
    if (tempDateTo.trim() && !dateRegex.test(tempDateTo.trim())) {
      setValidationError('To Date must be in YYYY-MM-DD format');
      return;
    }

    // Validate amounts
    if (tempMinAmount.trim() && (isNaN(Number(tempMinAmount)) || Number(tempMinAmount) < 0)) {
      setValidationError('Minimum amount must be a positive number');
      return;
    }
    if (tempMaxAmount.trim() && (isNaN(Number(tempMaxAmount)) || Number(tempMaxAmount) < 0)) {
      setValidationError('Maximum amount must be a positive number');
      return;
    }

    const minAmt = tempMinAmount.trim() ? Number(tempMinAmount) : undefined;
    const maxAmt = tempMaxAmount.trim() ? Number(tempMaxAmount) : undefined;

    if (minAmt !== undefined && maxAmt !== undefined && minAmt > maxAmt) {
      setValidationError('Minimum amount cannot exceed maximum amount');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApiFilters({
      limit: 100,
      transaction_type: tempType === 'all' ? undefined : tempType,
      expense_category: tempType === 'expense' && tempExpenseCat !== 'all' ? tempExpenseCat : undefined,
      income_category: tempType === 'income' && tempIncomeCat !== 'all' ? tempIncomeCat : undefined,
      date_from: tempDateFrom.trim() || undefined,
      date_to: tempDateTo.trim() || undefined,
      min_amount: minAmt,
      max_amount: maxAmt,
    });
    setShowFilterModal(false);
  };

  const cats = tempType === 'expense' ? EXPENSE_CATS : tempType === 'income' ? INCOME_CATS : [];
  const selectedCat = tempType === 'expense' ? tempExpenseCat : tempIncomeCat;
  const handleSelectCat = (cat: string) => {
    if (tempType === 'expense') {
      setTempExpenseCat(cat as ExpenseCategory | 'all');
    } else if (tempType === 'income') {
      setTempIncomeCat(cat as IncomeCategory | 'all');
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      {/* Header */}
      <View style={{paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12}}>
        <Text variant='heading' color='primary' style={{marginBottom: 16}}>Transactions</Text>

        {/* Search Row */}
        <View style={{flexDirection: 'row', gap: 10, marginBottom: 14}}>
          <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 48, gap: 10}}>
            <IconSymbol name='magnifyingglass' size={18} color={C.textSecondary} />
            <TextInput
              style={{flex: 1, fontFamily: Fonts.sans, fontSize: 15, color: C.textPrimary}}
              placeholder='Search transactions…'
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType='search'
            />
            {search ? (
              <Pressable onPress={() => { Haptics.selectionAsync(); setSearch(''); }} hitSlop={8}>
                <IconSymbol name='xmark.circle.fill' size={18} color={C.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable 
            onPress={openFilters}
            style={{
              width: 48, height: 48, borderRadius: 14, borderWidth: 1,
              borderColor: activeChips.length > 0 ? C.accent : C.border,
              backgroundColor: activeChips.length > 0 ? C.accentDim : C.bgCard,
              alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}
          >
            <IconSymbol name='slider.horizontal.3' size={20} color={activeChips.length > 0 ? C.accent : C.textSecondary} />
            {activeChips.length > 0 && (
              <View style={{position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent}} />
            )}
          </Pressable>
        </View>

        {/* Filter tabs */}
        <View style={{flexDirection: 'row', gap: 8}}>
          {(['all', 'income', 'expense'] as Filter[]).map((f) => {
            const isSelected = (f === 'all' && !apiFilters.transaction_type) || apiFilters.transaction_type === f;
            return (
              <Pressable
                key={f}
                onPress={() => { Haptics.selectionAsync(); handleTabPress(f); }}
                style={{
                  paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: isSelected ? C.accentDim : C.bgCard,
                  borderWidth: 1, borderColor: isSelected ? C.accent : C.border,
                }}>
                <Text variant='label' style={{color: isSelected ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Filter Chips */}
        {activeChips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 12}} contentContainerStyle={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
            {activeChips.map((chip) => (
              <Pressable
                key={chip.key}
                onPress={() => handleClearChip(chip.key)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                  backgroundColor: C.bgCardAlt, borderWidth: 1, borderColor: C.border,
                }}
              >
                <Text variant='caption' color='secondary'>{chip.label}</Text>
                <IconSymbol name='xmark.circle.fill' size={14} color={C.textSecondary} />
              </Pressable>
            ))}
            <TouchableOpacity
              onPress={handleResetFilters}
              style={{paddingHorizontal: 8, paddingVertical: 4}}
            >
              <Text variant='caption' style={{color: C.expense, fontFamily: Fonts.sansSemiBold}}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} style={{marginTop: 40}} />
      ) : filtered.length === 0 ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8}}>
          <Text variant='body' color='secondary'>No transactions found</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 110}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          renderSectionHeader={({section: {title}}) => (
            <View style={{paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <Text variant='caption' color='secondary' style={{fontFamily: Fonts.sansSemiBold}}>{title}</Text>
              <View style={{flex: 1, height: 1, backgroundColor: C.border}} />
            </View>
          )}
          renderItem={({item}) => (
            <TransactionRow
              item={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/transaction/${item.id}`);
              }}
            />
          )}
        />
      )}

      {/* Advanced Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterModal}
        animationType='slide'
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={{flex: 1}} onPress={() => setShowFilterModal(false)} />
          <View style={[styles.modalContent, {paddingBottom: insets.bottom + 16}]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.headerBtn}>
                <Text variant='body' color='secondary'>Cancel</Text>
              </TouchableOpacity>
              <Text variant='subheading' color='primary' style={{fontFamily: Fonts.sansSemiBold}}>Filter Transactions</Text>
              <TouchableOpacity onPress={handleResetFilters} style={styles.headerBtn}>
                <Text variant='body' style={{color: C.expense, fontFamily: Fonts.sansSemiBold}}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps='handled'
            >
              {/* Type Toggle */}
              <View style={{gap: 8}}>
                <Text variant='label' color='secondary'>Transaction Type</Text>
                <View style={{flexDirection: 'row', gap: 8, backgroundColor: C.bgCardAlt, borderRadius: 14, padding: 4}}>
                  {(['all', 'expense', 'income'] as Filter[]).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => { Haptics.selectionAsync(); setTempType(t); }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                        backgroundColor: tempType === t ? (t === 'all' ? C.accentDim : t === 'income' ? C.incomeDim : C.expenseDim) : 'transparent',
                      }}>
                      <Text variant='label' style={{
                        color: tempType === t ? (t === 'all' ? C.accent : t === 'income' ? C.income : C.expense) : C.textMuted,
                        fontFamily: Fonts.sansSemiBold
                      }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Context-aware Category Selection */}
              {tempType !== 'all' && (
                <View style={{gap: 8}}>
                  <Text variant='label' color='secondary'>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <Pressable
                        onPress={() => { Haptics.selectionAsync(); handleSelectCat('all'); }}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                          backgroundColor: selectedCat === 'all' ? C.accentDim : C.bgCard,
                          borderWidth: 1, borderColor: selectedCat === 'all' ? C.accent : C.border,
                        }}>
                        <Text variant='caption' style={{color: selectedCat === 'all' ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>All Categories</Text>
                      </Pressable>
                      {cats.map((cat) => (
                        <Pressable
                          key={cat}
                          onPress={() => { Haptics.selectionAsync(); handleSelectCat(cat); }}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                            backgroundColor: selectedCat === cat ? C.accentDim : C.bgCard,
                            borderWidth: 1, borderColor: selectedCat === cat ? C.accent : C.border,
                          }}>
                          <Text variant='caption' style={{color: selectedCat === cat ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{cat}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Amount Range */}
              <View style={{gap: 8}}>
                <Text variant='label' color='secondary'>Amount Range</Text>
                <View style={{flexDirection: 'row', gap: 12}}>
                  <View style={{flex: 1}}>
                    <Input
                      placeholder='Min Amount'
                      value={tempMinAmount}
                      onChangeText={setTempMinAmount}
                      keyboardType='decimal-pad'
                      returnKeyType='done'
                      leadingIcon={<IconSymbol name='dollarsign' size={16} color={C.textSecondary} />}
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Input
                      placeholder='Max Amount'
                      value={tempMaxAmount}
                      onChangeText={setTempMaxAmount}
                      keyboardType='decimal-pad'
                      returnKeyType='done'
                      leadingIcon={<IconSymbol name='dollarsign' size={16} color={C.textSecondary} />}
                    />
                  </View>
                </View>
              </View>

              {/* Date range */}
              <View style={{gap: 8}}>
                <Text variant='label' color='secondary'>Date Range (YYYY-MM-DD)</Text>
                <View style={{flexDirection: 'row', gap: 12}}>
                  <View style={{flex: 1}}>
                    <Input
                      placeholder='YYYY-MM-DD'
                      value={tempDateFrom}
                      onChangeText={setTempDateFrom}
                      keyboardType='numbers-and-punctuation'
                      returnKeyType='done'
                      label='From Date'
                      leadingIcon={<IconSymbol name='calendar' size={16} color={C.textSecondary} />}
                    />
                  </View>
                  <View style={{flex: 1}}>
                    <Input
                      placeholder='YYYY-MM-DD'
                      value={tempDateTo}
                      onChangeText={setTempDateTo}
                      keyboardType='numbers-and-punctuation'
                      returnKeyType='done'
                      label='To Date'
                      leadingIcon={<IconSymbol name='calendar' size={16} color={C.textSecondary} />}
                    />
                  </View>
                </View>
              </View>

              {validationError && (
                <View style={styles.errorContainer}>
                  <Text variant='caption' color='danger'>{validationError}</Text>
                </View>
              )}

              <Button
                label='Apply Filters'
                variant='primary'
                size='lg'
                onPress={handleApplyFilters}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalScroll: {
    padding: 24,
    gap: 24,
  },
  errorContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.expense,
    padding: 12,
    backgroundColor: C.expenseDim,
  },
});

