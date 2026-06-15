import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useBudgetGoalStatus, useBudgetGoals, useDeleteBudgetGoal} from '@/hooks/use-budget-goals';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQueryClient} from '@tanstack/react-query';
import {useToast} from '@/components/ui/toast';
import {useCurrency} from '@/lib/currency-context';
import type {BudgetGoal} from '@/lib/api/types';

function GoalStatusBar({goalId}: {goalId: string}) {
  const {data: status} = useBudgetGoalStatus(goalId);
  const {formatMoney} = useCurrency();
  if (!status) return null;
  const pct = Math.min(status.percentage_used, 100);
  return (
    <View style={{gap: 6, marginTop: 8}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text variant='caption' color='secondary'>{formatMoney(status.spent)} spent</Text>
        <Text variant='caption' style={{color: status.is_over_budget ? C.expense : C.income}}>{pct.toFixed(0)}%</Text>
      </View>
      <View style={{height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden'}}>
        <View style={{height: 6, width: `${pct}%`, backgroundColor: status.is_over_budget ? C.expense : C.accent, borderRadius: 3}} />
      </View>
      {status.is_over_budget && <Text variant='caption' color='danger'>Over budget by {formatMoney(Math.abs(status.remaining))}</Text>}
    </View>
  );
}

export default function BudgetGoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const {showToast} = useToast();
  const {formatMoney} = useCurrency();
  const {data: goals, isLoading, refetch} = useBudgetGoals();
  const deleteMutation = useDeleteBudgetGoal();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (goal: BudgetGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        deleteMutation.mutate(goal.id, {
          onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({message: `Deleted budget goal "${goal.name}"`, type: 'success'});
          },
          onError: (err) => {
            showToast({message: err.message, type: 'error'});
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
          <Text variant='heading' color='primary'>Budget Goals</Text>
        </View>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/create-budget-goal'); }} activeOpacity={0.7}
          style={{width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accent, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{color: C.accent, fontSize: 22, fontFamily: Fonts.sans}}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? <ActivityIndicator color={C.accent} style={{marginTop: 40}} /> : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />} contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 12}}>
          {!goals?.length ? (
            <View style={{alignItems: 'center', paddingVertical: 48, gap: 12}}>
              <Text variant='body' color='secondary'>No budget goals yet</Text>
              <Button label='Create Your First Goal' variant='primary' size='md' onPress={() => router.push('/create-budget-goal')} />
            </View>
          ) : goals.map((goal) => (
            <TouchableOpacity key={goal.id} onLongPress={() => handleDelete(goal)} activeOpacity={0.85}
              style={{backgroundColor: C.bgCard, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, gap: 4}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <View style={{flex: 1, gap: 2}}>
                  <Text variant='subheading' color='primary'>{goal.name}</Text>
                  <Text variant='caption' color='secondary'>{goal.period} · {goal.expense_category ?? goal.income_category ?? goal.transaction_type}</Text>
                </View>
                <View style={{alignItems: 'flex-end', gap: 2}}>
                  <Text variant='subheading' style={{color: C.accent, fontFamily: Fonts.sansBold}}>{formatMoney(Number(goal.amount))}</Text>
                  <View style={{paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: goal.is_active ? C.incomeDim : C.expenseDim}}>
                    <Text variant='overline' style={{color: goal.is_active ? C.income : C.expense}}>{goal.is_active ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
              </View>
              <GoalStatusBar goalId={goal.id} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
