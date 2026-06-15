import React from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';

import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {Text} from '@/components/ui/text';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useCurrency, CURRENCIES, CURRENCY_SYMBOLS} from '@/lib/currency-context';
import {useToast} from '@/components/ui/toast';

export default function CurrencyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {currency, setCurrency} = useCurrency();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelect = async (code: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setCurrency(code);
    showToast({message: `Currency preference set to ${code} (${CURRENCY_SYMBOLS[code]})`, type: 'success'});
    router.back();
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">Select Currency</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeButton}>
          <IconSymbol name="xmark.circle.fill" size={28} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, {paddingBottom: (insets.bottom || 16) + 32}]}
      >
        <Text variant="body" color="secondary" style={styles.subtitle}>
          Choose your default system currency. All financial figures, analytics, and budgets will display with this currency sign.
        </Text>

        <View style={styles.list}>
          {CURRENCIES.map((code) => {
            const isSelected = currency === code;
            const symbol = CURRENCY_SYMBOLS[code];
            
            return (
              <TouchableOpacity
                key={code}
                onPress={() => handleSelect(code)}
                style={[
                  styles.item,
                  isSelected && styles.itemSelected
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.symbolBg, isSelected && styles.symbolBgSelected]}>
                    <Text variant="subheading" style={[styles.symbolText, isSelected && styles.symbolTextSelected]}>
                      {symbol}
                    </Text>
                  </View>
                  <View style={styles.itemText}>
                    <Text variant="subheading" color={isSelected ? 'accent' : 'primary'} style={styles.codeText}>
                      {code}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {code === 'USD' && 'United States Dollar'}
                      {code === 'EUR' && 'Euro'}
                      {code === 'GBP' && 'British Pound Sterling'}
                      {code === 'NGN' && 'Nigerian Naira'}
                      {code === 'CAD' && 'Canadian Dollar'}
                      {code === 'AUD' && 'Australian Dollar'}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <IconSymbol name="checkmark" size={20} color={C.income} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  itemSelected: {
    borderColor: C.accent,
    backgroundColor: C.bgCardAlt,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  symbolBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  symbolBgSelected: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  symbolText: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
    color: C.accent,
  },
  symbolTextSelected: {
    color: C.white,
  },
  itemText: {
    gap: 2,
  },
  codeText: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
  },
});
