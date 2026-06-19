import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {storage} from '@/lib/storage';
import type {RecurringTransaction, BudgetGoalStatus} from '@/lib/api/types';

// ── Notification identifiers ────────────────────────────────────────────────
const IDS = {
  DAILY_REMINDER: 'vv_daily_reminder',
  WEEKLY_SUMMARY: 'vv_weekly_summary',
  MONTHLY_BUDGET_REMINDER: 'vv_monthly_budget_reminder',
  recurringPrefix: 'vv_recurring_',
  budgetPrefix: 'vv_budget_',
} as const;

// ── Configure how notifications are displayed when app is in foreground ─────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Android channel (required for Android 8+) ──────────────────────────────
async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('vaultvoss-general', {
      name: 'VaultVoss',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0088FF',
    });
  }
}

// ── Permissions ─────────────────────────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  await ensureAndroidChannel();

  const settings = (await Notifications.getPermissionsAsync()) as any;
  if (settings.status === 'granted' || settings.granted) return true;

  const request = (await Notifications.requestPermissionsAsync()) as any;
  return request.status === 'granted' || request.granted;
}

// ── Daily Reminder ──────────────────────────────────────────────────────────
export async function scheduleDailyReminder(hour: number, minute: number) {
  await cancelDailyReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.DAILY_REMINDER,
    content: {
      title: '💰 Log your expenses',
      body: "Don't forget to track your spending today!",
      sound: true,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'vaultvoss-general',
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(IDS.DAILY_REMINDER).catch(() => {});
}

// ── Weekly Summary ──────────────────────────────────────────────────────────
export async function scheduleWeeklySummary() {
  await cancelWeeklySummary();

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.WEEKLY_SUMMARY,
    content: {
      title: '📊 Weekly Summary',
      body: 'Check your spending and savings for this week!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 18,
      minute: 0,
      channelId: 'vaultvoss-general',
    },
  });
}

export async function cancelWeeklySummary() {
  await Notifications.cancelScheduledNotificationAsync(IDS.WEEKLY_SUMMARY).catch(() => {});
}

// ── Monthly Budget Goals Reminder ───────────────────────────────────────────
export async function scheduleMonthlyBudgetReminder() {
  await cancelMonthlyBudgetReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.MONTHLY_BUDGET_REMINDER,
    content: {
      title: '📅 New Month, New Budgets!',
      body: 'Today is the first day of the month. Review your budget goals and plan your spending!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 1,
      hour: 9,
      minute: 0,
      channelId: 'vaultvoss-general',
    },
  });
}

export async function cancelMonthlyBudgetReminder() {
  await Notifications.cancelScheduledNotificationAsync(IDS.MONTHLY_BUDGET_REMINDER).catch(() => {});
}

// ── Recurring Bill Reminders ────────────────────────────────────────────────
function getNextDueDate(item: RecurringTransaction): Date | null {
  const now = new Date();
  const start = new Date(item.start_date);
  if (isNaN(start.getTime())) return null;

  // If last triggered, calculate next from that; otherwise use start date
  let base = item.last_triggered ? new Date(item.last_triggered) : start;
  if (isNaN(base.getTime())) base = start;

  let next = new Date(base);

  // Advance until we get a future date
  const maxIterations = 1000;
  let i = 0;
  while (next <= now && i < maxIterations) {
    switch (item.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    i++;
  }

  // Only schedule if the next date is within 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (next > thirtyDaysFromNow) return null;

  return next;
}

export async function scheduleRecurringBillReminder(item: RecurringTransaction) {
  const id = `${IDS.recurringPrefix}${item.id}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  if (!item.is_active) return;

  const nextDue = getNextDueDate(item);
  if (!nextDue) return;

  // Schedule for 9 AM on the due date
  const triggerDate = new Date(nextDue);
  triggerDate.setHours(9, 0, 0, 0);

  // Don't schedule if it's in the past
  if (triggerDate <= new Date()) return;

  const label = item.transaction_type === 'expense' ? 'payment' : 'income';

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `🔔 ${item.transaction_name} due`,
      body: `Your ${item.frequency} ${label} of ${item.amount} ${item.currency} is due today.`,
      sound: true,
      interruptionLevel: 'timeSensitive',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: 'vaultvoss-general',
    },
  });
}

export async function cancelRecurringReminder(id: string) {
  await Notifications.cancelScheduledNotificationAsync(`${IDS.recurringPrefix}${id}`).catch(() => {});
}

export async function syncAllRecurringReminders(items: RecurringTransaction[]) {
  const billsEnabled = await storage.getNotifBillsEnabled();
  if (!billsEnabled) return;

  // Cancel all existing recurring reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(IDS.recurringPrefix)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }

  // Re-schedule all active items
  for (const item of items) {
    if (item.is_active) {
      await scheduleRecurringBillReminder(item);
    }
  }
}

// ── Budget Warnings ─────────────────────────────────────────────────────────
export async function checkBudgetWarnings(statusList: BudgetGoalStatus[]) {
  const enabled = await storage.getNotifBudgetEnabled();
  if (!enabled) return;

  const now = new Date();

  // Load previously warned budgets to avoid duplicates
  const warnedRaw = await storage.getWarnedBudgets().catch(() => null);
  const warnedList: string[] = warnedRaw ? (JSON.parse(warnedRaw) as string[]) : [];
  const newWarnedList = [...warnedList];

  for (const status of statusList) {
    const goal = status.goal;
    const gNow = new Date(now);
    
    // Compute current period start date to use as part of the unique key
    let start = new Date();
    if (goal.period === 'weekly') {
      const day = gNow.getDay();
      const diff = gNow.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(gNow.setDate(diff));
      start.setHours(0, 0, 0, 0);
    } else if (goal.period === 'monthly') {
      start = new Date(gNow.getFullYear(), gNow.getMonth(), 1);
    } else if (goal.period === 'yearly') {
      start = new Date(gNow.getFullYear(), 0, 1);
    }

    const periodKey = start.toISOString().split('T')[0];

    // Unique keys for the warning levels
    const warnKey = `warn_${goal.id}_${periodKey}`;
    const overKey = `over_${goal.id}_${periodKey}`;

    if (status.percentage_used >= 85 && !status.is_over_budget) {
      if (!newWarnedList.includes(warnKey)) {
        const id = `${IDS.budgetPrefix}${goal.id}`;
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: '⚠️ Budget Warning',
            body: `"${goal.name}" is at ${Math.round(status.percentage_used)}% of its limit.`,
            sound: true,
            interruptionLevel: 'timeSensitive',
          },
          trigger: null, // Immediate
        });
        newWarnedList.push(warnKey);
      }
    } else if (status.is_over_budget) {
      if (!newWarnedList.includes(overKey)) {
        const id = `${IDS.budgetPrefix}${goal.id}`;
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: {
            title: '🚨 Over Budget!',
            body: `"${goal.name}" has exceeded its limit at ${Math.round(status.percentage_used)}%.`,
            sound: true,
            interruptionLevel: 'timeSensitive',
          },
          trigger: null, // Immediate
        });
        newWarnedList.push(overKey);
      }
    }
  }

  // Persist updated warning list
  await storage.setWarnedBudgets(JSON.stringify(newWarnedList)).catch(() => {});
}

// ── Cancel All ──────────────────────────────────────────────────────────────
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
