import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {IconSymbol} from './icon-symbol';
import {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, type TextInputProps, View} from 'react-native';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  password?: boolean;
};

export function Input({
  label,
  error,
  hint,
  leadingIcon,
  trailingIcon,
  password = false,
  secureTextEntry,
  style,
  ...rest
}: InputProps) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  const isPassword = password || secureTextEntry;
  const actualHidden = isPassword ? hidden : false;

  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.container, focused && s.containerFocused, !!error && s.containerError]}>
        {leadingIcon ? <View style={s.iconLeft}>{leadingIcon}</View> : null}
        <TextInput
          style={[s.input, leadingIcon ? s.inputPadLeft : null, isPassword || trailingIcon ? s.inputPadRight : null, style]}
          secureTextEntry={actualHidden}
          placeholderTextColor={C.textMuted}
          cursorColor={C.accent}
          selectionColor={C.accentDim}
          autoCapitalize='none'
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} style={s.iconRight} hitSlop={10}>
            <EyeIcon hidden={hidden} />
          </Pressable>
        ) : trailingIcon ? (
          <View style={s.iconRight}>{trailingIcon}</View>
        ) : null}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

function EyeIcon({hidden}: {hidden: boolean}) {
  return (
    <IconSymbol
      name={hidden ? 'eye.slash' : 'eye'}
      size={20}
      color={C.textSecondary}
    />
  );
}

const s = StyleSheet.create({
  wrapper: {gap: 6},
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    letterSpacing: 0.2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: C.bgInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  containerFocused: {borderColor: C.borderFocus},
  containerError: {borderColor: C.borderError},
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: C.textPrimary,
    paddingHorizontal: 16,
  },
  inputPadLeft: {paddingLeft: 8},
  inputPadRight: {paddingRight: 8},
  iconLeft: {paddingLeft: 14, alignItems: 'center', justifyContent: 'center'},
  iconRight: {paddingRight: 14, height: '100%', alignItems: 'center', justifyContent: 'center'},
  error: {fontFamily: Fonts.sans, fontSize: 12, color: C.expense, marginTop: 2},
  hint: {fontFamily: Fonts.sans, fontSize: 12, color: C.textMuted, marginTop: 2},
});
