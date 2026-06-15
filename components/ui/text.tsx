import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {Text as RNText, type TextProps} from 'react-native';

type Variant = 'display' | 'heading' | 'title' | 'subheading' | 'body' | 'label' | 'caption' | 'overline';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
type Color = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'danger' | 'income' | 'expense';

export type AppTextProps = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: Color;
  className?: string;
};

const variantBase: Record<Variant, {fontSize: number; lineHeight: number; fontFamily: string}> = {
  display:    {fontSize: 40, lineHeight: 46, fontFamily: Fonts.sansBold},
  heading:    {fontSize: 28, lineHeight: 34, fontFamily: Fonts.sansBold},
  title:      {fontSize: 22, lineHeight: 28, fontFamily: Fonts.sansBold},
  subheading: {fontSize: 17, lineHeight: 24, fontFamily: Fonts.sansSemiBold},
  body:       {fontSize: 14, lineHeight: 22, fontFamily: Fonts.sans},
  label:      {fontSize: 13, lineHeight: 18, fontFamily: Fonts.sansSemiBold},
  caption:    {fontSize: 12, lineHeight: 16, fontFamily: Fonts.sans},
  overline:   {fontSize: 11, lineHeight: 14, fontFamily: Fonts.sansMedium},
};

const weightToFamily: Record<Weight, string> = {
  regular: Fonts.sans,
  medium: Fonts.sansMedium,
  semibold: Fonts.sansSemiBold,
  bold: Fonts.sansBold,
  heavy: Fonts.sansBold,
};

const colorMap: Record<Color, string> = {
  primary: C.textPrimary,
  secondary: C.textSecondary,
  muted: C.textMuted,
  inverse: C.textInverse,
  accent: C.accent,
  danger: C.expense,
  income: C.income,
  expense: C.expense,
};

export function Text({variant = 'body', weight, color = 'primary', style, className, ...rest}: AppTextProps) {
  const base = variantBase[variant];
  return (
    <RNText
      className={className}
      style={[
        {
          fontFamily: weight ? weightToFamily[weight] : base.fontFamily,
          fontSize: base.fontSize,
          lineHeight: base.lineHeight,
          color: colorMap[color],
        },
        style,
      ]}
      {...rest}
    />
  );
}
