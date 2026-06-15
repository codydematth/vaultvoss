import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useDeleteRecurring, useRecurringTransactions, useTriggerRecurring} from '@/hooks/use-recurring';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useCurrency} from '@/lib/currency-context';

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {formatMoney} = useCurrency();
  const {data: items, isLoading, refetch} = useRecurringTransactions();
  const deleteMutation = useDeleteRecurring();
  const triggerMutation = useTriggerRecurring();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTrigger = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Trigger Now', `Manually trigger "${name}" now?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Trigger', onPress: () => {
        triggerMutation.mutate(id, {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({ message: `Triggered transaction for "${name}"`, type: 'success' });
          },
          onError: (err) => {
            showToast({ message: err.message, type: 'error' });
          },
        });
      }},
    ]);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete', `Delete recurring "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({ message: `Deleted recurring "${name}"`, type: 'success' });
          },
          onError: (err) => {
            showToast({ message: err.message, type: 'error' });
          }
        });
      }},
    ]);
  };

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      {/* Header */}
      <View style={{paddingTop: insets.top + 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}
            style={{width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center'}}>
            <IconSymbol name='chevron.left' size={16} color={C.textPrimary} />
          </TouchableOpacity>
          <Text variant='heading' color='primary'>Recurring</Text>
        </View>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/create-recurring'); }} activeOpacity={0.7}
          style={{width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: C.accent, fontSize: 22, fontFamily: Fonts.sans}}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator color={C.accent} style={{marginTop: 40}} /> : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 12}}>
          {!items?.length ? (
            <View style={{alignItems: 'center', paddingVertical: 48, gap: 12}}>
              <Text variant='body' color='secondary'>No recurring transactions yet</Text>
              <Button label='Create Recurring' variant='primary' size='md' onPress={() => router.push('/create-recurring')} />
            </View>
          ) : items.map((item) => (
            <View key={item.id} style={{backgroundColor: C.bgCard, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, gap: 12}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={{gap: 2}}>
                  <Text variant='subheading' color='primary'>{item.transaction_name}</Text>
                  <Text variant='caption' color='secondary'>{item.frequency} · Starts {item.start_date}</Text>
                </View>
                <Text variant='subheading' style={{color: item.transaction_type === 'income' ? C.income : C.expense, fontFamily: Fonts.sansBold}}>
                  {item.transaction_type === 'income' ? '+' : '-'}{formatMoney(Number(item.amount))}
                </Text>
              </View>
              <View style={{height: 1, backgroundColor: C.border}} />
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text variant='caption' color='secondary'>
                  Last triggered: {item.last_triggered ? new Date(item.last_triggered).toLocaleDateString() : 'Never'}
                </Text>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity onPress={() => handleTrigger(item.id, item.transaction_name)} activeOpacity={0.7}
                    style={{height: 38, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center'}}>
                    <Text variant='caption' style={{color: C.accent, fontFamily: Fonts.sansSemiBold}}>Trigger</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.transaction_name)} activeOpacity={0.7}
                    style={{width: 38, height: 38, borderRadius: 10, backgroundColor: C.expenseDim, borderWidth: 1, borderColor: `${C.expense}55`, alignItems: 'center', justifyContent: 'center'}}>
                    <IconSymbol name='trash' size={16} color={C.expense} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
