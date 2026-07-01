import {C, EXPENSE_CATEGORY_COLOR, INCOME_CATEGORY_COLOR} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import type {TransactionType} from '@/lib/api/types';
import {StyleSheet, Text, View} from 'react-native';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️', Entertainment: '🎬',
  Bills: '📄', Health: '💊', Other: '•',
  Salary: '💼', Freelance: '💻', Gift: '🎁', Investment: '📈',
  Miscellaneous: '📦', Betting: '🎲',
};

interface CategoryIconProps {
  category: string | null | undefined;
  type: TransactionType;
  size?: number;
}

export function CategoryIcon({category, type, size = 44}: CategoryIconProps) {
  const colorMap = type === 'income' ? INCOME_CATEGORY_COLOR : EXPENSE_CATEGORY_COLOR;
  const color = category ? (colorMap[category] ?? C.catOther) : (type === 'income' ? C.income : C.expense);
  const emoji = category ? (CATEGORY_EMOJI[category] ?? '•') : '•';

  return (
    <View
      style={[
        s.wrap,
        {
          width: size, height: size, borderRadius: size * 0.28,
          backgroundColor: `${color}22`,
          borderColor: `${color}55`,
        },
      ]}>
      <Text style={{fontSize: size * 0.44, lineHeight: size * 0.54}}>{emoji}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});
