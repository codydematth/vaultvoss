import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useBudgetGoalStatus, useBudgetGoals, useDeleteBudgetGoal} from '@/hooks/use-budget-goals';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {ConfirmDialog} from '@/components/ui/confirm-dialog';
import {ActivityIndicator, Alert, RefreshControl, ScrollView, TouchableOpacity, View, Modal, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useCurrency} from '@/lib/currency-context';
import type {BudgetGoal, BudgetGoalStatus} from '@/lib/api/types';

function GoalCard({
  status,
  onEdit,
  onDelete,
}: {
  status: BudgetGoalStatus;
  onEdit: (goal: BudgetGoal) => void;
  onDelete: (goal: BudgetGoal) => void;
}) {
  const goal = status.goal;
  const {formatMoney, convert, currency: preferredCurrency} = useCurrency();

  const goalCurrency = goal.currency || 'USD';
  const convertedLimit = convert(Number(goal.amount), goalCurrency, preferredCurrency);
  const spent = status.spent ?? 0;
  const convertedSpent = convert(spent, goalCurrency, preferredCurrency);
  const percentage = status.percentage_used ?? 0;
  const isOverBudget = status.is_over_budget ?? false;
  const convertedRemaining = convertedLimit - convertedSpent;

  const pct = Math.min(percentage, 100);

  // Dynamic colors based on progress
  const getProgressColor = () => {
    if (isOverBudget) return C.expense;
    if (pct >= 85) return C.warning;
    return C.income;
  };

  const getProgressBg = () => {
    if (isOverBudget) return C.expenseDim;
    if (pct >= 85) return C.warningDim;
    return C.incomeDim;
  };

  return (
    <View style={{backgroundColor: C.bgCard, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, gap: 12}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <View style={{flex: 1, gap: 2}}>
          <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
            {goal.name}
          </Text>
          <Text variant="caption" color="secondary">
            {goal.period.toUpperCase()} · {goal.expense_category ?? goal.income_category ?? goal.transaction_type}
          </Text>
        </View>
        <View style={{alignItems: 'flex-end', gap: 4}}>
          <Text variant="subheading" style={{color: C.accent, fontFamily: Fonts.sansBold}}>
            {formatMoney(convertedLimit)}
          </Text>
          <View style={{paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: goal.is_active ? C.incomeDim : C.expenseDim}}>
            <Text variant="overline" style={{color: goal.is_active ? C.income : C.expense, fontFamily: Fonts.sansSemiBold}}>
              {goal.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar & Status Info */}
      <View style={{gap: 6}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text variant="caption" color="secondary">
            {formatMoney(convertedSpent)} spent
          </Text>
          <Text variant="caption" weight="semibold" style={{color: getProgressColor()}}>
            {percentage.toFixed(0)}%
          </Text>
        </View>
        <View style={{height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden'}}>
          <View style={{height: 6, width: `${pct}%`, backgroundColor: getProgressColor(), borderRadius: 3}} />
        </View>
        
        {isOverBudget ? (
          <Text variant="caption" color="danger" weight="medium">
            Over budget by {formatMoney(Math.abs(convertedRemaining))}
          </Text>
        ) : (
          <Text variant="caption" color="secondary">
            {formatMoney(convertedRemaining)} remaining
          </Text>
        )}
      </View>

      {/* Divider */}
      <View style={{height: 1, backgroundColor: C.border}} />

      {/* Actions */}
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', gap: 8}}>
        <TouchableOpacity
          onPress={() => onEdit(goal)}
          activeOpacity={0.7}
          style={{
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: C.accentDim,
            borderWidth: 1,
            borderColor: C.accent,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IconSymbol name="gearshape.fill" size={13} color={C.accent} />
          <Text variant="caption" style={{color: C.accent, fontFamily: Fonts.sansSemiBold}}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(goal)}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: C.expenseDim,
            borderWidth: 1,
            borderColor: `${C.expense}33`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSymbol name="trash" size={14} color={C.expense} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BudgetGoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const {showToast} = useToast();
  const {formatMoney, convert, currency: preferredCurrency} = useCurrency();
  const {data: goals, isLoading, refetch} = useBudgetGoals();
  const deleteMutation = useDeleteBudgetGoal();
  const [refreshing, setRefreshing] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<BudgetGoal | null>(null);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEdit = (goal: BudgetGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/create-budget-goal?id=${goal.id}`);
  };

  const handleDelete = (goal: BudgetGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteGoal(goal);
  };

  const activeStatuses = goals?.filter((status) => status.goal.is_active) ?? [];
  const totalBudgeted = activeStatuses.reduce((sum, status) => {
    const g = status.goal;
    return sum + convert(Number(g.amount), g.currency || 'USD', preferredCurrency);
  }, 0);

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.bgCard,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol name="chevron.left" size={16} color={C.textPrimary} />
          </TouchableOpacity>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <View>
              <Text variant="heading" color="primary">
                Budget Goals
              </Text>
              <Text variant="caption" color="secondary">
                Control your monthly limits
              </Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowInfo(true); }}
              hitSlop={8}
              style={{marginTop: -4}}
            >
              <IconSymbol name="info.circle" size={16} color={C.textSecondary} />
            </Pressable>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/create-budget-goal');
          }}
          activeOpacity={0.7}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: C.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{color: C.white, fontSize: 22, fontFamily: Fonts.sansBold, lineHeight: 24}}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} style={{marginTop: 40}} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 16}}
        >
          {/* Summary Card */}
          {goals && goals.length > 0 && (
            <View
              style={{
                backgroundColor: C.bgCard,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: C.border,
                padding: 20,
                gap: 12,
              }}
            >
              <Text variant="caption" color="secondary">
                Total Budgeted Limit (Active)
              </Text>
              <Text variant="title" color="accent" style={{fontFamily: Fonts.sansBold}}>
                {formatMoney(totalBudgeted)}
              </Text>
              <Text variant="caption" color="muted">
                Based on your {activeStatuses.length} active budget goals
              </Text>
            </View>
          )}

          {!goals?.length ? (
            <View style={{alignItems: 'center', paddingVertical: 48, gap: 12}}>
              <Text variant="body" color="secondary">
                No budget goals yet
              </Text>
              <Button label="Create Your First Goal" variant="primary" size="md" onPress={() => router.push('/create-budget-goal')} />
            </View>
          ) : (
            goals.map((status) => (
              <GoalCard key={status.goal.id} status={status} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          )}
        </ScrollView>
      )}

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable 
          style={{
            flex: 1,
            backgroundColor: C.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }} 
          onPress={() => setShowInfo(false)}
        >
          <Pressable 
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: C.bgCard,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.border,
              padding: 24,
              gap: 16,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <IconSymbol name="info.circle" size={20} color={C.accent} />
                <Text variant="subheading" style={{fontFamily: Fonts.sansBold, fontSize: 18, color: C.textPrimary}}>
                  Budget Goals
                </Text>
              </View>
              <Pressable onPress={() => setShowInfo(false)} hitSlop={10}>
                <IconSymbol name="xmark.circle.fill" size={24} color={C.textSecondary} />
              </Pressable>
            </View>

            <Text variant="body" color="secondary" style={{fontSize: 14, lineHeight: 22, fontFamily: Fonts.sans}}>
              {"Budget Goals help you control your spending or monitor your income targets. Set up active limit envelopes for specific categories and keep track of how much you've spent or earned compared to your limit."}
            </Text>

            <View style={{height: 1, backgroundColor: C.border}} />

            <View style={{gap: 8}}>
              <Text variant="caption" color="primary" style={{fontFamily: Fonts.sansSemiBold, fontSize: 13}}>
                Quick Tips:
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Budget goals for expenses represent spending limits."}
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Budget goals for income represent earnings targets."}
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Envelopes are color-coded: Green (under 70%), Orange (70-90%), Red (over budget)."}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowInfo(false)}
              style={{
                marginTop: 8,
                backgroundColor: C.accent,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text variant="label" style={{color: C.white, fontFamily: Fonts.sansBold}}>Got it</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={!!deleteGoal}
        title="Delete Goal"
        message={deleteGoal ? `Are you sure you want to delete "${deleteGoal.name}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteGoal) {
            const {id, name} = deleteGoal;
            deleteMutation.mutate(id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast({message: `Deleted budget goal "${name}"`, type: 'success'});
                setDeleteGoal(null);
              },
              onError: (err) => {
                showToast({message: err.message, type: 'error'});
                setDeleteGoal(null);
              },
            });
          }
        }}
        onCancel={() => !deleteMutation.isPending && setDeleteGoal(null)}
      />
    </View>
  );
}
