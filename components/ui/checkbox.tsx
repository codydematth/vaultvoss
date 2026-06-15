import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import {IconSymbol} from './icon-symbol';
import {Platform, Pressable, StyleSheet, Text, View, type ViewProps} from 'react-native';

export type CheckboxProps = ViewProps & {
  checked: boolean;
  onToggle: () => void;
  label?: React.ReactNode;
  error?: string;
  disabled?: boolean;
};

export function Checkbox({checked, onToggle, label, error, disabled = false, style, ...rest}: CheckboxProps) {
  const handleToggle = () => {
    if (disabled) return;
    Haptics.selectionAsync();
    onToggle();
  };

  return (
    <View style={style} {...rest}>
      <Pressable onPress={handleToggle} style={s.row} hitSlop={6} accessibilityRole='checkbox' accessibilityState={{checked, disabled}}>
        <View style={[s.box, checked && s.boxChecked, !!error && s.boxError]}>
          {checked ? <CheckMark /> : null}
        </View>
        {label ? (
          typeof label === 'string' ? (
            <Text style={[s.label, disabled && s.labelDisabled]}>{label}</Text>
          ) : (
            <View style={s.labelWrapper}>{label}</View>
          )
        ) : null}
      </Pressable>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

function CheckMark() {
  return <IconSymbol name='checkmark' size={12} color={C.black} />;
}

const s = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  box: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  boxChecked: {backgroundColor: C.accent, borderColor: C.accent},
  boxError: {borderColor: C.borderError},
  checkText: {color: C.black, fontSize: 12, fontWeight: '700', lineHeight: 14},
  label: {fontFamily: Fonts.sans, fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20},
  labelWrapper: {flex: 1},
  labelDisabled: {opacity: 0.4},
  error: {fontFamily: Fonts.sans, fontSize: 12, color: C.expense, marginTop: 6, marginLeft: 30},
});
