import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C, getCategoryColor} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useDeleteRecurring, useRecurringTransactions, useTriggerRecurring} from '@/hooks/use-recurring';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {ConfirmDialog} from '@/components/ui/confirm-dialog';
import {ActivityIndicator, Alert, RefreshControl, ScrollView, TouchableOpacity, View, Modal, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useCurrency} from '@/lib/currency-context';

export default function RecurringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const {showToast} = useToast();
  const {formatMoney, convert, currency: preferredCurrency} = useCurrency();
  const {data: items, isLoading, refetch} = useRecurringTransactions();
  const deleteMutation = useDeleteRecurring();
  const triggerMutation = useTriggerRecurring();
  const [refreshing, setRefreshing] = useState(false);
  const [triggerItem, setTriggerItem] = useState<{id: string, name: string} | null>(null);
  const [deleteItem, setDeleteItem] = useState<{id: string, name: string} | null>(null);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTrigger = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTriggerItem({id, name});
  };

  const handleEdit = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/create-recurring?id=${id}`);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteItem({id, name});
  };

  // Calculate monthly projection of all recurring items
  const calculateMonthlyRecurringTotal = () => {
    if (!items) return 0;
    return items.reduce((sum, item) => {
      if (!item.is_active) return sum;
      let monthlyContribution = 0;
      const convertedAmt = convert(Number(item.amount), item.currency || 'USD', preferredCurrency);
      switch (item.frequency) {
        case 'daily':
          monthlyContribution = convertedAmt * 30;
          break;
        case 'weekly':
          monthlyContribution = convertedAmt * 4.33;
          break;
        case 'biweekly':
          monthlyContribution = convertedAmt * 2.16;
          break;
        case 'monthly':
          monthlyContribution = convertedAmt;
          break;
        case 'yearly':
          monthlyContribution = convertedAmt / 12;
          break;
        default:
          monthlyContribution = convertedAmt;
      }
      // Sum up expense as negative, income as positive (or keep absolute depending on visual preferences, let's keep net)
      if (item.transaction_type === 'expense') {
        return sum - monthlyContribution;
      } else {
        return sum + monthlyContribution;
      }
    }, 0);
  };

  const netMonthlyRecurring = calculateMonthlyRecurringTotal();
  const activeCount = items?.filter((i) => i.is_active).length ?? 0;

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
                Recurring
              </Text>
              <Text variant="caption" color="secondary">
                Manage automatic templates
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
            router.push('/create-recurring');
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
          {/* Projection Summary Card */}
          {items && items.length > 0 && (
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
                Net Monthly Recurring Commitment
              </Text>
              <Text
                variant="title"
                style={{
                  color: netMonthlyRecurring >= 0 ? C.income : C.expense,
                  fontFamily: Fonts.sansBold,
                }}
              >
                {netMonthlyRecurring >= 0 ? '+' : ''}
                {formatMoney(netMonthlyRecurring)}
              </Text>
              <Text variant="caption" color="muted">
                {activeCount} of {items.length} templates are currently active
              </Text>
            </View>
          )}

          {!items?.length ? (
            <View style={{alignItems: 'center', paddingVertical: 48, gap: 12}}>
              <Text variant="body" color="secondary">
                No recurring templates yet
              </Text>
              <Button label="Create Recurring Template" variant="primary" size="md" onPress={() => router.push('/create-recurring')} />
            </View>
          ) : (
            items.map((item) => {
              const category = item.expense_category ?? item.income_category ?? 'Other';
              const color = getCategoryColor(category, item.transaction_type);

              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 18,
                    gap: 12,
                    opacity: item.is_active ? 1 : 0.6,
                  }}
                >
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: `${color}15`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconSymbol name="repeat" size={18} color={color} />
                      </View>
                      <View style={{flex: 1, gap: 2}}>
                        <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                          {item.transaction_name}
                        </Text>
                        <Text variant="caption" color="secondary">
                          {item.frequency.toUpperCase()} · {category}
                        </Text>
                      </View>
                    </View>
                    <Text
                      variant="subheading"
                      style={{
                        color: item.transaction_type === 'income' ? C.income : C.expense,
                        fontFamily: Fonts.sansBold,
                      }}
                    >
                      {item.transaction_type === 'income' ? '+' : '-'}
                      {formatMoney(convert(Number(item.amount), item.currency || 'USD', preferredCurrency))}
                    </Text>
                  </View>

                  <View style={{height: 1, backgroundColor: C.border}} />

                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Text variant="caption" color="muted">
                      Last: {item.last_triggered ? new Date(item.last_triggered).toLocaleDateString() : 'Never'}
                    </Text>

                    <View style={{flexDirection: 'row', gap: 8}}>
                      {/* Trigger manually button */}
                      <TouchableOpacity
                        onPress={() => handleTrigger(item.id, item.transaction_name)}
                        activeOpacity={0.7}
                        disabled={!item.is_active}
                        style={{
                          height: 36,
                          paddingHorizontal: 12,
                          borderRadius: 10,
                          backgroundColor: item.is_active ? `${C.income}15` : C.border,
                          borderWidth: 1,
                          borderColor: item.is_active ? `${C.income}55` : C.border,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <IconSymbol name="checkmark" size={13} color={item.is_active ? C.income : C.textMuted} />
                        <Text
                          variant="caption"
                          style={{
                            color: item.is_active ? C.income : C.textMuted,
                            fontFamily: Fonts.sansSemiBold,
                          }}
                        >
                          Trigger
                        </Text>
                      </TouchableOpacity>

                      {/* Edit button */}
                      <TouchableOpacity
                        onPress={() => handleEdit(item.id)}
                        activeOpacity={0.7}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: C.accentDim,
                          borderWidth: 1,
                          borderColor: C.accent,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconSymbol name="gearshape.fill" size={14} color={C.accent} />
                      </TouchableOpacity>

                      {/* Delete button */}
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id, item.transaction_name)}
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
                </View>
              );
            })
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
                  Recurring Templates
                </Text>
              </View>
              <Pressable onPress={() => setShowInfo(false)} hitSlop={10}>
                <IconSymbol name="xmark.circle.fill" size={24} color={C.textSecondary} />
              </Pressable>
            </View>

            <Text variant="body" color="secondary" style={{fontSize: 14, lineHeight: 22, fontFamily: Fonts.sans}}>
              {"Recurring Transactions automate tracking your scheduled bills, subscriptions, or salaries. Instead of manual logging every time, create a template that can be automatically or manually triggered into a real transaction."}
            </Text>

            <View style={{height: 1, backgroundColor: C.border}} />

            <View style={{gap: 8}}>
              <Text variant="caption" color="primary" style={{fontFamily: Fonts.sansSemiBold, fontSize: 13}}>
                Quick Tips:
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Tap the ⚡ trigger icon on any active template to instantly log a transaction from its schedule."}
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Active templates represent ongoing obligations, while inactive ones are paused."}
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
        visible={!!triggerItem}
        title="Trigger Now"
        message={triggerItem ? `Do you want to manually create a transaction from "${triggerItem.name}" right now?` : ''}
        confirmLabel="Trigger"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (triggerItem) {
            const {id, name} = triggerItem;
            setTriggerItem(null);
            triggerMutation.mutate(id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast({message: `Triggered transaction for "${name}"`, type: 'success'});
              },
              onError: (err) => {
                showToast({message: err.message, type: 'error'});
              },
            });
          }
        }}
        onCancel={() => setTriggerItem(null)}
      />

      <ConfirmDialog
        visible={!!deleteItem}
        title="Delete Template"
        message={deleteItem ? `Are you sure you want to delete recurring template "${deleteItem.name}"?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (deleteItem) {
            const {id, name} = deleteItem;
            setDeleteItem(null);
            deleteMutation.mutate(id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast({message: `Deleted recurring "${name}"`, type: 'success'});
              },
              onError: (err) => {
                showToast({message: err.message, type: 'error'});
              },
            });
          }
        }}
        onCancel={() => setDeleteItem(null)}
      />
    </View>
  );
}
