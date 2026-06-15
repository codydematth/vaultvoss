import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {StyleSheet, Text, View} from 'react-native';

type BadgeVariant = 'income' | 'expense' | 'accent' | 'neutral' | 'warning';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, {bg: string; text: string}> = {
  income:  {bg: C.incomeDim, text: C.income},
  expense: {bg: C.expenseDim, text: C.expense},
  accent:  {bg: C.accentDim, text: C.accent},
  neutral: {bg: C.bgCardAlt, text: C.textSecondary},
  warning: {bg: C.warningDim, text: C.warning},
};

export function Badge({label, variant = 'neutral'}: BadgeProps) {
  const v = VARIANT_STYLES[variant];
  return (
    <View style={[s.badge, {backgroundColor: v.bg}]}>
      <Text style={[s.label, {color: v.text}]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3},
  label: {fontFamily: Fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.3},
});
