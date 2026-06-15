import {CategoryIcon} from '@/components/CategoryIcon';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import type {Transaction} from '@/lib/api/types';
import {StyleSheet, TouchableOpacity, View} from 'react-native';

import {useCurrency} from '@/lib/currency-context';

interface TransactionRowProps {
  item: Transaction;
  onPress?: () => void;
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  } catch { return ''; }
}

export function TransactionRow({item, onPress}: TransactionRowProps) {
  const {formatMoney} = useCurrency();
  const isIncome = item.transaction_type === 'income';
  const category = isIncome ? item.income_category : item.expense_category;
  const amount = `${isIncome ? '+' : '-'}${formatMoney(Number(item.amount))}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={s.row}>
      <CategoryIcon category={category ?? null} type={item.transaction_type} size={44} />
      <View style={s.info}>
        <Text variant='subheading' color='primary' numberOfLines={1}>{item.transaction_name}</Text>
        <Text variant='caption' color='secondary'>{category ?? (isIncome ? 'Income' : 'Expense')}</Text>
      </View>
      <View style={s.right}>
        <Text variant='label' style={{color: isIncome ? C.income : C.expense, fontFamily: Fonts.sansSemiBold}}>
          {amount}
        </Text>
        <Text variant='caption' color='muted'>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: C.bgCard,
    borderRadius: 16, marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  info: {flex: 1, gap: 2},
  right: {alignItems: 'flex-end', gap: 2},
});
