import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useCreateNetWorthItem, useUpdateNetWorthItem, useNetWorthItem} from '@/hooks/use-net-worth';
import * as Haptics from 'expo-haptics';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {useState, useEffect} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NetWorthItemType} from '@/lib/api/types';
import {useToast} from '@/components/ui/toast';
import {formatAmountWithCommas, useCurrency} from '@/lib/currency-context';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];

export default function CreateNetWorthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {currency: activeCurrency} = useCurrency();
  const {id} = useLocalSearchParams<{id?: string}>();

  const createMutation = useCreateNetWorthItem();
  const updateMutation = useUpdateNetWorthItem();
  const {data: detail, isLoading: isDetailLoading} = useNetWorthItem(id ?? '');

  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<NetWorthItemType>('asset');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState(activeCurrency);
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (detail) {
      setItemName(detail.name);
      setItemType(detail.item_type);
      setValue(formatAmountWithCommas(String(detail.value)));
      setCurrency(detail.currency);
      setNote(detail.note ?? '');
    }
  }, [detail]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSave = () => {
    if (!itemName.trim()) { setFormError('Name is required'); return; }
    const parsedValue = Number(value.replace(/,/g, ''));
    if (!value || isNaN(parsedValue) || parsedValue <= 0) { setFormError('Enter a valid value'); return; }
    setFormError(null);

    const valNum = parsedValue;

    if (id) {
      updateMutation.mutate(
        {
          id,
          payload: {
            name: itemName.trim(),
            value: valNum,
            currency,
            note: note.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `Updated net worth item "${itemName}"`, type: 'success'});
            router.back();
          },
          onError: (err) => setFormError(err.message),
        },
      );
    } else {
      createMutation.mutate(
        {name: itemName.trim(), item_type: itemType, value: valNum, currency, note: note.trim() || undefined},
        {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `${itemType === 'asset' ? 'Asset' : 'Liability'} added successfully`, type: 'success'});
            router.back();
          },
          onError: (err) => setFormError(err.message),
        },
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, {paddingTop: insets.top || 16, paddingBottom: insets.bottom || 16}]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">{id ? 'Edit Net Worth Item' : 'Add Net Worth Item'}</Text>
        <TouchableOpacity onPress={handleClose} hitSlop={12} style={styles.closeButton}>
          <IconSymbol name="xmark.circle.fill" size={28} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {id && isDetailLoading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView 
          style={{flex: 1}} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* Type toggle */}
            <View style={{opacity: id ? 0.6 : 1}}>
              <Text variant='label' color='secondary' style={{marginBottom: 8}}>Item Type</Text>
              <View style={{flexDirection: 'row', gap: 8, backgroundColor: C.bgCardAlt, borderRadius: 14, padding: 4}}>
                {(['asset', 'liability'] as NetWorthItemType[]).map((t) => {
                  const isActive = itemType === t;
                  return (
                    <Pressable 
                      key={t} 
                      disabled={!!id}
                      onPress={() => { Haptics.selectionAsync(); setItemType(t); }}
                      style={{
                        flex: 1, 
                        paddingVertical: 10, 
                        borderRadius: 10, 
                        alignItems: 'center', 
                        backgroundColor: isActive ? (t === 'asset' ? C.incomeDim : C.expenseDim) : 'transparent'
                      }}
                    >
                      <Text variant='label' style={{color: isActive ? (t === 'asset' ? C.income : C.expense) : C.textMuted, fontFamily: Fonts.sansSemiBold}}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input label='Name' placeholder={itemType === 'asset' ? 'e.g. House, Savings' : 'e.g. Mortgage, Loan'} value={itemName} onChangeText={setItemName} returnKeyType='next' />
            
            <Input label='Value' placeholder='0.00' value={value} onChangeText={(val) => setValue(formatAmountWithCommas(val))} keyboardType='decimal-pad' returnKeyType='done' />
            
            <View>
              <Text variant='label' color='secondary' style={{marginBottom: 8}}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection: 'row', gap: 6}}>
                  {CURRENCIES.map((c) => {
                    const isSelected = currency === c;
                    return (
                      <Pressable 
                        key={c} 
                        onPress={() => { Haptics.selectionAsync(); setCurrency(c); }}
                        style={{
                          paddingHorizontal: 12, 
                          paddingVertical: 8, 
                          borderRadius: 10, 
                          backgroundColor: isSelected ? C.accentDim : C.bg, 
                          borderWidth: 1, 
                          borderColor: isSelected ? C.accent : C.border
                        }}
                      >
                        <Text variant='caption' style={{color: isSelected ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <Input label='Note (optional)' placeholder='Description…' value={note} onChangeText={setNote} />
            
            {formError ? <View style={{borderRadius: 12, borderWidth: 1, borderColor: C.borderError, padding: 12, backgroundColor: C.expenseDim}}><Text variant='caption' color='danger'>{formError}</Text></View> : null}
            
            <Button label={isPending ? 'Saving…' : (id ? 'Save Changes' : `Add ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`)} variant='primary' size='lg' loading={isPending} onPress={handleSave} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
    gap: 20,
    paddingBottom: 40,
  },
});
