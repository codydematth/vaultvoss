import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = TouchableOpacityProps & {
  variant?: Variant;
  size?: Size;
  label: string;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  className?: string;
  haptic?: Haptics.ImpactFeedbackStyle;
};

// ─── Style tables ────────────────────────────────────────────────────────────
type VariantTokens = {bg: string; textColor: string; borderColor?: string; borderWidth?: number};

const variantTokens: Record<Variant, VariantTokens> = {
  primary: {bg: C.accent, textColor: C.textInverse},
  accent: {bg: C.accent, textColor: C.textInverse},
  secondary: {bg: C.bgCardAlt, textColor: C.textPrimary},
  ghost: {bg: C.transparent, textColor: C.accent},
  destructive: {bg: C.expenseDim, textColor: C.expense, borderWidth: 1, borderColor: C.expense + '22'},
};

type SizeTokens = {height: number; borderRadius: number; fontSize: number; paddingHorizontal: number; iconGap: number};

const sizeTokens: Record<Size, SizeTokens> = {
  sm: {height: 36, borderRadius: 10, fontSize: 13, paddingHorizontal: 14, iconGap: 5},
  md: {height: 48, borderRadius: 14, fontSize: 15, paddingHorizontal: 18, iconGap: 6},
  lg: {height: 58, borderRadius: 18, fontSize: 17, paddingHorizontal: 24, iconGap: 8},
};

// ─── Component ───────────────────────────────────────────────────────────────
export function Button({
  variant = 'secondary',
  size = 'lg',
  label,
  loading = false,
  leadingIcon,
  trailingIcon,
  disabled,
  haptic = Haptics.ImpactFeedbackStyle.Medium,
  onPress,
  ...rest
}: ButtonProps) {
  const vt = variantTokens[variant];
  const st = sizeTokens[size];
  const isDisabled = disabled || loading;

  const handlePress = (e: any) => {
    Haptics.impactAsync(haptic);
    onPress?.(e);
  };

  return (
    <View
      style={{
        height: st.height,
        borderRadius: st.borderRadius,
        backgroundColor: vt.bg,
        borderWidth: vt.borderWidth ?? 0,
        borderColor: vt.borderColor ?? C.transparent,
        overflow: 'hidden',
      }}>
      <TouchableOpacity
        disabled={isDisabled}
        activeOpacity={0.75}
        onPress={handlePress}
        {...rest}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: st.paddingHorizontal,
        }}>
        {loading ? (
          <ActivityIndicator size='small' color={vt.textColor} />
        ) : (
          <>
            {leadingIcon && <View style={{marginRight: st.iconGap}}>{leadingIcon}</View>}
            <Text style={[styles.label, {fontSize: st.fontSize, color: vt.textColor}]}>
              {label}
            </Text>
            {trailingIcon && <View style={{marginLeft: st.iconGap}}>{trailingIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
