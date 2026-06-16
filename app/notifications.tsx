import {useState, useEffect, useCallback} from 'react';
import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {IconSymbol} from '@/components/ui/icon-symbol';
import {storage} from '@/lib/storage';
import {useToast} from '@/components/ui/toast';
import * as Haptics from 'expo-haptics';
import {useRouter} from 'expo-router';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  requestPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
  scheduleWeeklySummary,
  cancelWeeklySummary,
  syncAllRecurringReminders,
} from '@/lib/notifications';
import {useRecurringTransactions} from '@/hooks/use-recurring';

const HOURS = Array.from({length: 24}, (_, i) => i);

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {showToast} = useToast();
  const {data: recurringItems} = useRecurringTransactions();

  const [dailyEnabled, setDailyEnabled] = useState(false);
  const [dailyHour, setDailyHour] = useState(20);
  const [dailyMinute, setDailyMinute] = useState(0);
  const [billsEnabled, setBillsEnabled] = useState(false);
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    (async () => {
      const [daily, time, bills, budget, weekly] = await Promise.all([
        storage.getNotifDailyEnabled(),
        storage.getNotifDailyTime(),
        storage.getNotifBillsEnabled(),
        storage.getNotifBudgetEnabled(),
        storage.getNotifWeeklyEnabled(),
      ]);
      setDailyEnabled(daily);
      setDailyHour(time.hour);
      setDailyMinute(time.minute);
      setBillsEnabled(bills);
      setBudgetEnabled(budget);
      setWeeklyEnabled(weekly);
      setLoaded(true);
    })();
  }, []);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications in your device settings to use this feature.',
      );
      return false;
    }
    return true;
  }, []);

  // ── Daily Reminder Toggle ─────────────────────────────────────────────────
  const handleDailyToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
      await scheduleDailyReminder(dailyHour, dailyMinute);
      showToast({message: `Daily reminder set for ${formatTime(dailyHour, dailyMinute)}`, type: 'success'});
    } else {
      await cancelDailyReminder();
      showToast({message: 'Daily reminder disabled', type: 'success'});
    }
    setDailyEnabled(value);
    await storage.setNotifDailyEnabled(value);
  };

  const handleTimeChange = async (hour: number) => {
    Haptics.selectionAsync();
    setDailyHour(hour);
    await storage.setNotifDailyTime(hour, dailyMinute);
    if (dailyEnabled) {
      await scheduleDailyReminder(hour, dailyMinute);
    }
  };

  // ── Bill Reminders Toggle ─────────────────────────────────────────────────
  const handleBillsToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
      if (recurringItems) {
        await syncAllRecurringReminders(recurringItems);
      }
      showToast({message: 'Bill reminders enabled', type: 'success'});
    } else {
      // Cancel all recurring reminders
      if (recurringItems) {
        const Notifications = await import('expo-notifications');
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
          if (n.identifier.startsWith('vv_recurring_')) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
          }
        }
      }
      showToast({message: 'Bill reminders disabled', type: 'success'});
    }
    setBillsEnabled(value);
    await storage.setNotifBillsEnabled(value);
  };

  // ── Budget Warnings Toggle ────────────────────────────────────────────────
  const handleBudgetToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
      showToast({message: 'Budget warnings enabled', type: 'success'});
    } else {
      showToast({message: 'Budget warnings disabled', type: 'success'});
    }
    setBudgetEnabled(value);
    await storage.setNotifBudgetEnabled(value);
  };

  // ── Weekly Summary Toggle ─────────────────────────────────────────────────
  const handleWeeklyToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return;
      await scheduleWeeklySummary();
      showToast({message: 'Weekly summary scheduled for Sundays at 6 PM', type: 'success'});
    } else {
      await cancelWeeklySummary();
      showToast({message: 'Weekly summary disabled', type: 'success'});
    }
    setWeeklyEnabled(value);
    await storage.setNotifWeeklyEnabled(value);
  };

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  if (!loaded) return null;

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}
      >
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
        <View>
          <Text variant="heading" color="primary">
            Notifications
          </Text>
          <Text variant="caption" color="secondary">
            Manage your alerts
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 40, gap: 16}}
      >
        {/* Daily Reminder */}
        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 18,
            gap: 14,
          }}
        >
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: C.warningDim,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="bell" size={20} color={C.warning} />
              </View>
              <View style={{flex: 1, gap: 2}}>
                <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                  Daily Reminder
                </Text>
                <Text variant="caption" color="secondary">
                  Reminds you to log expenses
                </Text>
              </View>
            </View>
            <Switch
              value={dailyEnabled}
              onValueChange={handleDailyToggle}
              trackColor={{true: C.income, false: C.border}}
              thumbColor={Platform.OS === 'android' ? C.white : undefined}
            />
          </View>

          {dailyEnabled && (
            <>
              <View style={{height: 1, backgroundColor: C.border}} />
              <View style={{gap: 8}}>
                <Text variant="caption" color="secondary">
                  Reminder Time: {formatTime(dailyHour, dailyMinute)}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection: 'row', gap: 6}}>
                    {HOURS.map((h) => {
                      const isSelected = h === dailyHour;
                      return (
                        <Pressable
                          key={h}
                          onPress={() => handleTimeChange(h)}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: isSelected ? C.accentDim : C.bg,
                            borderWidth: 1,
                            borderColor: isSelected ? C.accent : C.border,
                          }}
                        >
                          <Text
                            variant="caption"
                            style={{
                              color: isSelected ? C.accent : C.textSecondary,
                              fontFamily: Fonts.sansSemiBold,
                            }}
                          >
                            {formatTime(h, 0)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </View>

        {/* Bill Reminders */}
        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 18,
          }}
        >
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: C.expenseDim,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="repeat" size={20} color={C.expense} />
              </View>
              <View style={{flex: 1, gap: 2}}>
                <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                  Bill Reminders
                </Text>
                <Text variant="caption" color="secondary">
                  Alerts on recurring due dates
                </Text>
              </View>
            </View>
            <Switch
              value={billsEnabled}
              onValueChange={handleBillsToggle}
              trackColor={{true: C.income, false: C.border}}
              thumbColor={Platform.OS === 'android' ? C.white : undefined}
            />
          </View>
        </View>

        {/* Budget Warnings */}
        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 18,
          }}
        >
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${C.warning}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="chart.pie.fill" size={20} color={C.warning} />
              </View>
              <View style={{flex: 1, gap: 2}}>
                <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                  Budget Warnings
                </Text>
                <Text variant="caption" color="secondary">
                  Alert at 85%+ of spending limit
                </Text>
              </View>
            </View>
            <Switch
              value={budgetEnabled}
              onValueChange={handleBudgetToggle}
              trackColor={{true: C.income, false: C.border}}
              thumbColor={Platform.OS === 'android' ? C.white : undefined}
            />
          </View>
        </View>

        {/* Weekly Summary */}
        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 18,
          }}
        >
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: C.incomeDim,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSymbol name="chart.bar.fill" size={20} color={C.income} />
              </View>
              <View style={{flex: 1, gap: 2}}>
                <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                  Weekly Summary
                </Text>
                <Text variant="caption" color="secondary">
                  Sundays at 6 PM
                </Text>
              </View>
            </View>
            <Switch
              value={weeklyEnabled}
              onValueChange={handleWeeklyToggle}
              trackColor={{true: C.income, false: C.border}}
              thumbColor={Platform.OS === 'android' ? C.white : undefined}
            />
          </View>
        </View>

        {/* Info note */}
        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            padding: 16,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <IconSymbol name="info.circle" size={16} color={C.textSecondary} />
          <Text variant="caption" color="secondary" style={{flex: 1, lineHeight: 18}}>
            All notifications are scheduled locally on your device. No data is sent to external servers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
