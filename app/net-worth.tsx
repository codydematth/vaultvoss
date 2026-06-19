import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useDeleteNetWorthItem, useNetWorth, useSnapshotNetWorth} from '@/hooks/use-net-worth';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {IconSymbol, IconSymbolName} from '@/components/ui/icon-symbol';
import {ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View, Modal, Pressable} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToast} from '@/components/ui/toast';
import {useCurrency} from '@/lib/currency-context';
import {ConfirmDialog} from '@/components/ui/confirm-dialog';

function getNetWorthIcon(name: string, type: 'asset' | 'liability'): IconSymbolName {
  const n = name.toLowerCase();
  if (type === 'liability') {
    if (n.includes('card') || n.includes('credit')) return 'credit-card';
    return 'activity';
  }
  if (n.includes('savings') || n.includes('bank') || n.includes('cash') || n.includes('vault')) {
    return 'lock.shield';
  }
  if (n.includes('gift') || n.includes('bonus')) {
    return 'gift';
  }
  if (n.includes('investment') || n.includes('stock') || n.includes('crypto') || n.includes('shares')) {
    return 'chart.bar.xaxis';
  }
  if (n.includes('property') || n.includes('house') || n.includes('home') || n.includes('land')) {
    return 'house.fill';
  }
  return 'dollarsign';
}

export default function NetWorthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [snapshotConfirmVisible, setSnapshotConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string; name: string} | null>(null);
  const {data: summary, isLoading, refetch} = useNetWorth();
  const deleteMutation = useDeleteNetWorthItem();
  const snapshotMutation = useSnapshotNetWorth();
  const [refreshing, setRefreshing] = useState(false);
  const {showToast} = useToast();
  const {formatMoney, convert, currency: preferredCurrency} = useCurrency();

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSnapshot = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSnapshotConfirmVisible(true);
  };

  const handleEdit = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/create-net-worth?id=${id}`);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setItemToDelete({id, name});
  };

  const assets = summary?.items?.filter((i) => i.item_type === 'asset') ?? [];
  const liabilities = summary?.items?.filter((i) => i.item_type === 'liability') ?? [];

  const totalAssets = summary?.total_assets ?? 0;
  const totalLiabilities = summary?.total_liabilities ?? 0;
  const totalSum = totalAssets + totalLiabilities;
  const assetRatio = totalSum > 0 ? (totalAssets / totalSum) * 100 : 100;
  const liabilityRatio = totalSum > 0 ? (totalLiabilities / totalSum) * 100 : 0;

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
                Net Worth
              </Text>
              <Text variant="caption" color="secondary">
                Assets & Liabilities breakdown
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
        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity
            onPress={handleSnapshot}
            activeOpacity={0.7}
            style={{
              height: 36,
              paddingHorizontal: 12,
              borderRadius: 18,
              backgroundColor: C.accentDim,
              borderWidth: 1,
              borderColor: C.accent,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <IconSymbol name="bell" size={13} color={C.accent} />
            <Text variant="label" style={{color: C.accent, fontFamily: Fonts.sansSemiBold, fontSize: 12}}>
              Snap
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/create-net-worth');
            }}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{color: C.white, fontSize: 22, fontFamily: Fonts.sansBold, lineHeight: 24}}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={C.accent} style={{marginTop: 40}} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
          contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 20}}
        >
          {/* Net worth total card */}
          {summary && (
            <View
              style={{
                backgroundColor: C.bgCard,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: C.border,
                padding: 24,
                gap: 16,
              }}
            >
              <View style={{alignItems: 'center'}}>
                <Text variant="caption" color="secondary" style={{marginBottom: 4}}>
                  Total Net Worth
                </Text>
                <Text
                  variant="display"
                  style={{
                    color: summary.net_worth >= 0 ? C.income : C.expense,
                    fontFamily: Fonts.sansBold,
                    textAlign: 'center',
                    fontSize: 34,
                  }}
                >
                  {summary.net_worth >= 0 ? '+' : ''}
                  {formatMoney(summary.net_worth)}
                </Text>
              </View>

              {/* Dynamic Assets vs Liabilities Ratio Bar */}
              {totalSum > 0 && (
                <View style={{gap: 6, marginVertical: 4}}>
                  <View style={{height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'hidden'}}>
                    <View style={{width: `${assetRatio}%`, backgroundColor: C.income}} />
                    <View style={{width: `${liabilityRatio}%`, backgroundColor: C.expense}} />
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                    <Text variant="overline" color="muted">
                      Assets ({assetRatio.toFixed(0)}%)
                    </Text>
                    <Text variant="overline" color="muted">
                      Liabilities ({liabilityRatio.toFixed(0)}%)
                    </Text>
                  </View>
                </View>
              )}

              <View style={{height: 1, backgroundColor: C.border}} />

              <View style={{flexDirection: 'row', gap: 24}}>
                <View style={{flex: 1, alignItems: 'center', gap: 4}}>
                  <Text variant="caption" style={{color: C.income}}>
                    Assets
                  </Text>
                  <Text variant="subheading" style={{color: C.income, fontFamily: Fonts.sansBold}}>
                    {formatMoney(totalAssets)}
                  </Text>
                </View>
                <View style={{width: 1, backgroundColor: C.border}} />
                <View style={{flex: 1, alignItems: 'center', gap: 4}}>
                  <Text variant="caption" style={{color: C.expense}}>
                    Liabilities
                  </Text>
                  <Text variant="subheading" style={{color: C.expense, fontFamily: Fonts.sansBold}}>
                    {formatMoney(totalLiabilities)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Assets Section */}
          <View style={{gap: 12}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: C.income}} />
              <Text variant="subheading" style={{color: C.income, fontFamily: Fonts.sansBold}}>
                Assets ({assets.length})
              </Text>
            </View>
            {assets.length === 0 ? (
              <Text variant="body" color="secondary" style={{paddingLeft: 4, fontFamily: Fonts.sans}}>
                No assets added yet
              </Text>
            ) : (
              assets.map((item) => {
                const iconName = getNetWorthIcon(item.name, 'asset');
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: C.bgCard,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: `${C.income}30`,
                      padding: 16,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: `${C.income}12`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconSymbol name={iconName} size={18} color={C.income} />
                      </View>
                      <View style={{flex: 1, gap: 2}}>
                        <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansSemiBold}}>
                          {item.name}
                        </Text>
                        {item.note ? (
                          <Text variant="caption" color="secondary" numberOfLines={1}>
                            {item.note}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={{alignItems: 'flex-end', gap: 6}}>
                      <Text variant="subheading" style={{color: C.income, fontFamily: Fonts.sansBold}}>
                        {formatMoney(convert(item.value, item.currency || 'USD', preferredCurrency))}
                      </Text>
                      <View style={{flexDirection: 'row', gap: 4}}>
                        <TouchableOpacity
                          onPress={() => handleEdit(item.id)}
                          activeOpacity={0.7}
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: C.accentDim,
                          }}
                        >
                          <IconSymbol name="gearshape.fill" size={12} color={C.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id, item.name)}
                          activeOpacity={0.7}
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: C.expenseDim,
                          }}
                        >
                          <IconSymbol name="trash" size={12} color={C.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Liabilities Section */}
          <View style={{gap: 12}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: C.expense}} />
              <Text variant="subheading" style={{color: C.expense, fontFamily: Fonts.sansBold}}>
                Liabilities ({liabilities.length})
              </Text>
            </View>
            {liabilities.length === 0 ? (
              <Text variant="body" color="secondary" style={{paddingLeft: 4, fontFamily: Fonts.sans}}>
                No liabilities added yet
              </Text>
            ) : (
              liabilities.map((item) => {
                const iconName = getNetWorthIcon(item.name, 'liability');
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: C.bgCard,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: `${C.expense}30`,
                      padding: 16,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: `${C.expense}12`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconSymbol name={iconName} size={18} color={C.expense} />
                      </View>
                      <View style={{flex: 1, gap: 2}}>
                        <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansSemiBold}}>
                          {item.name}
                        </Text>
                        {item.note ? (
                          <Text variant="caption" color="secondary" numberOfLines={1}>
                            {item.note}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                     <View style={{alignItems: 'flex-end', gap: 6}}>
                       <Text variant="subheading" style={{color: C.expense, fontFamily: Fonts.sansBold}}>
                         {formatMoney(convert(item.value, item.currency || 'USD', preferredCurrency))}
                       </Text>
                      <View style={{flexDirection: 'row', gap: 4}}>
                        <TouchableOpacity
                          onPress={() => handleEdit(item.id)}
                          activeOpacity={0.7}
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: C.accentDim,
                          }}
                        >
                          <IconSymbol name="gearshape.fill" size={12} color={C.accent} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id, item.name)}
                          activeOpacity={0.7}
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: C.expenseDim,
                          }}
                        >
                          <IconSymbol name="trash" size={12} color={C.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {!summary?.items?.length && (
            <View style={{alignItems: 'center', paddingVertical: 48, gap: 12}}>
              <Text variant="body" color="secondary">
                Add assets & liabilities to track your net worth
              </Text>
              <Button label="Add Item" variant="primary" size="md" onPress={() => router.push('/create-net-worth')} />
            </View>
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
                  Net Worth Tracker
                </Text>
              </View>
              <Pressable onPress={() => setShowInfo(false)} hitSlop={10}>
                <IconSymbol name="xmark.circle.fill" size={24} color={C.textSecondary} />
              </Pressable>
            </View>

            <Text variant="body" color="secondary" style={{fontSize: 14, lineHeight: 22, fontFamily: Fonts.sans}}>
              {"Net Worth is the ultimate measure of your financial health. By tracking your assets (what you own, like cash or property) and liabilities (what you owe, like loans or mortgages), you get a clear view of your wealth."}
            </Text>

            <View style={{height: 1, backgroundColor: C.border}} />

            <View style={{gap: 8}}>
              <Text variant="caption" color="primary" style={{fontFamily: Fonts.sansSemiBold, fontSize: 13}}>
                Quick Tips:
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Tap \"Take Snapshot\" to save a historical point-in-time record of your net worth."}
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Watch your assets-to-liabilities ratio bar to ensure you are building positive wealth."}
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
        visible={snapshotConfirmVisible}
        title="Take Snapshot"
        message="This will save a point-in-time record of your net worth. Continue?"
        confirmLabel="Snapshot"
        onConfirm={() => {
          setSnapshotConfirmVisible(false);
          snapshotMutation.mutate(undefined, {
            onSuccess: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showToast({message: 'Snapshot saved successfully', type: 'success'});
            },
            onError: (err) => showToast({message: err.message, type: 'error'}),
          });
        }}
        onCancel={() => setSnapshotConfirmVisible(false)}
      />

      <ConfirmDialog
        visible={itemToDelete !== null}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmLabel="Delete"
        isDestructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (itemToDelete) {
            const {id, name} = itemToDelete;
            deleteMutation.mutate(id, {
              onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                showToast({message: `Deleted "${name}"`, type: 'success'});
                setItemToDelete(null);
              },
              onError: (err) => {
                showToast({message: err.message, type: 'error'});
                setItemToDelete(null);
              },
            });
          }
        }}
        onCancel={() => !deleteMutation.isPending && setItemToDelete(null)}
      />
    </View>
  );
}
