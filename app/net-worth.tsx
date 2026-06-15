import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useDeleteNetWorthItem, useNetWorth, useSnapshotNetWorth} from '@/hooks/use-net-worth';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useCurrency} from '@/lib/currency-context';

export default function NetWorthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {data: summary, isLoading, refetch} = useNetWorth();
  const deleteMutation = useDeleteNetWorthItem();
  const snapshotMutation = useSnapshotNetWorth();
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const {formatMoney} = useCurrency();

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSnapshot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Take Snapshot', 'This will save a point-in-time record of your net worth. Continue?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Snapshot', onPress: () => {
        snapshotMutation.mutate(undefined, {
          onSuccess: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); showToast({message: 'Snapshot saved successfully', type: 'success'}); },
          onError: (err) => showToast({message: err.message, type: 'error'}),
        });
      }},
    ]);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete', `Delete "${name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `Deleted "${name}"`, type: 'success'});
          },
          onError: (err) => {
            showToast({message: err.message, type: 'error'});
          }
        });
      }},
    ]);
  };

  const assets = summary?.items?.filter((i) => i.item_type === 'asset') ?? [];
  const liabilities = summary?.items?.filter((i) => i.item_type === 'liability') ?? [];

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      {/* Header */}
      <View style={{paddingTop: insets.top + 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}
            style={{width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center'}}>
            <IconSymbol name='chevron.left' size={16} color={C.textPrimary} />
          </Pressable>
          <Text variant='heading' color='primary'>Net Worth</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity onPress={handleSnapshot} activeOpacity={0.7}
            style={{height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center'}}>
            <Text variant='label' style={{color: C.accent, fontFamily: Fonts.sansSemiBold}}>📸 Snap</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/create-net-worth'); }} activeOpacity={0.7}
            style={{width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{color: C.accent, fontSize: 22, fontFamily: Fonts.sans}}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? <ActivityIndicator color={C.accent} style={{marginTop: 40}} /> : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 16}}>

          {/* Net worth total card */}
          {summary && (
            <View style={{backgroundColor: C.bgCard, borderRadius: 24, borderWidth: 1, borderColor: C.border, padding: 24, gap: 16, alignItems: 'center'}}>
              <Text variant='caption' color='secondary'>Total Net Worth</Text>
              <Text variant='display' style={{color: summary.net_worth >= 0 ? C.accent : C.expense, fontFamily: Fonts.sansBold, textAlign: 'center'}}>
                {summary.net_worth >= 0 ? '+' : '-'}{formatMoney(summary.net_worth)}
              </Text>
              <View style={{flexDirection: 'row', gap: 24}}>
                <View style={{alignItems: 'center', gap: 4}}>
                  <Text variant='caption' style={{color: C.income}}>Assets</Text>
                  <Text variant='subheading' style={{color: C.income, fontFamily: Fonts.sansBold}}>{formatMoney(summary.total_assets)}</Text>
                </View>
                <View style={{width: 1, backgroundColor: C.border}} />
                <View style={{alignItems: 'center', gap: 4}}>
                  <Text variant='caption' style={{color: C.expense}}>Liabilities</Text>
                  <Text variant='subheading' style={{color: C.expense, fontFamily: Fonts.sansBold}}>{formatMoney(summary.total_liabilities)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Assets */}
          <View style={{gap: 10}}>
            <Text variant='subheading' style={{color: C.income}}>Assets ({assets.length})</Text>
            {assets.length === 0 ? <Text variant='body' color='secondary' style={{paddingLeft: 4}}>No assets added yet</Text> : assets.map((item) => (
              <Pressable key={item.id} onLongPress={() => handleDelete(item.id, item.name)}
                style={{backgroundColor: C.bgCard, borderRadius: 16, borderWidth: 1, borderColor: `${C.income}33`, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={{gap: 2}}>
                  <Text variant='subheading' color='primary'>{item.name}</Text>
                  {item.note ? <Text variant='caption' color='secondary'>{item.note}</Text> : null}
                </View>
                <Text variant='subheading' style={{color: C.income, fontFamily: Fonts.sansBold}}>{formatMoney(item.value)}</Text>
              </Pressable>
            ))}
          </View>

          {/* Liabilities */}
          <View style={{gap: 10}}>
            <Text variant='subheading' style={{color: C.expense}}>Liabilities ({liabilities.length})</Text>
            {liabilities.length === 0 ? <Text variant='body' color='secondary' style={{paddingLeft: 4}}>No liabilities added yet</Text> : liabilities.map((item) => (
              <Pressable key={item.id} onLongPress={() => handleDelete(item.id, item.name)}
                style={{backgroundColor: C.bgCard, borderRadius: 16, borderWidth: 1, borderColor: `${C.expense}33`, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={{gap: 2}}>
                  <Text variant='subheading' color='primary'>{item.name}</Text>
                  {item.note ? <Text variant='caption' color='secondary'>{item.note}</Text> : null}
                </View>
                <Text variant='subheading' style={{color: C.expense, fontFamily: Fonts.sansBold}}>{formatMoney(item.value)}</Text>
              </Pressable>
            ))}
          </View>

          {!summary?.items?.length && (
            <View style={{alignItems: 'center', paddingVertical: 48, gap: 12}}>
              <Text variant='body' color='secondary'>Add assets & liabilities to track your net worth</Text>
              <Button label='Add Item' variant='primary' size='md' onPress={() => router.push('/create-net-worth')} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
