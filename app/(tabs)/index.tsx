import { TransactionRow } from "@/components/TransactionRow";
import { IconSymbol, IconSymbolName } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";
import { useAnalyticsSummary } from "@/hooks/use-analytics";
import { useMe } from "@/hooks/use-auth";
import { useBudgetGoals } from "@/hooks/use-budget-goals";
import { useNetWorth } from "@/hooks/use-net-worth";
import { useRecurringTransactions } from "@/hooks/use-recurring";
import { useTransactions } from "@/hooks/use-transactions";
import { useCurrency } from "@/lib/currency-context";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { checkBudgetWarnings } from "@/lib/notifications";
import { useAllBudgetGoalsStatus } from "@/hooks/use-budget-goals";

const { width } = Dimensions.get("window");

// ── Donut Chart Component ───────────────────────────────────────────────────
interface DonutProgressProps {
  percentage: number;
  amount: string;
  label: string;
}

function DonutProgress({ percentage, amount, label }: DonutProgressProps) {
  const radius = 24;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <View style={styles.donutContainer}>
      <Svg width={64} height={64}>
        {/* Background Circle */}
        <Circle
          cx="32"
          cy="32"
          r={radius}
          stroke={C.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Foreground Circle */}
        <Circle
          cx="32"
          cy="32"
          r={radius}
          stroke={C.brandBlue}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
        />
      </Svg>
      <View style={styles.donutTextContainer}>
        <Text style={[styles.donutAmount, { fontFamily: Fonts.sansBold }]}>
          {amount}
        </Text>
        <Text style={styles.donutLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { formatMoney, getCurrencySymbol } = useCurrency();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "expense" | "income">(
    "all",
  );

  const displayMoney = (v: number | undefined) =>
    v === undefined || v === null ? "—" : formatMoney(v);

  const { data: me } = useMe();
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
  const { data: netWorth } = useNetWorth();
  const { data: budgetGoals } = useBudgetGoals();
  const { data: recurringItems } = useRecurringTransactions();

  const { data: budgetStatuses } = useAllBudgetGoalsStatus();

  // Check budget warnings when statuses load
  const budgetCheckedRef = useRef(false);
  useEffect(() => {
    if (!budgetStatuses || budgetStatuses.length === 0 || budgetCheckedRef.current) return;
    checkBudgetWarnings(budgetStatuses);
    budgetCheckedRef.current = true;
  }, [budgetStatuses]);

  // Load transactions based on active tab filtering
  const params =
    activeTab === "all"
      ? { limit: 5 }
      : { limit: 5, transaction_type: activeTab };
  const { data: transactions, isLoading: txLoading } = useTransactions(params);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  };

  const totalIncome = summary?.total_income ?? 0;
  const totalExpenses = summary?.total_expenses ?? 0;
  const net =
    summary?.net_balance ?? summary?.net_savings ?? totalIncome - totalExpenses;

  // ── Module quick-access cards ──
  const nwCount = netWorth?.items?.length ?? 0;
  const bgCount = (budgetGoals ?? []).filter((g: any) => g.is_active).length;
  const rcCount = (recurringItems ?? []).filter((r: any) => r.is_active).length;

  const moduleCards: {
    id: string;
    title: string;
    subtitle: string;
    icon: IconSymbolName;
    iconBg: string;
    iconColor: string;
    route: string;
  }[] = [
    {
      id: "nw",
      title: "Net Worth",
      subtitle:
        nwCount > 0
          ? `${nwCount} item${nwCount !== 1 ? "s" : ""}`
          : "Add assets",
      icon: "lock.shield",
      iconBg: C.incomeDim,
      iconColor: C.income,
      route: nwCount > 0 ? "/net-worth" : "/create-net-worth",
    },
    {
      id: "bg",
      title: "Budgets",
      subtitle: bgCount > 0 ? `${bgCount} active` : "Set a goal",
      icon: "chart.pie.fill",
      iconBg: C.warningDim,
      iconColor: C.warning,
      route: bgCount > 0 ? "/budget-goals" : "/create-budget-goal",
    },
    {
      id: "rc",
      title: "Recurring",
      subtitle: rcCount > 0 ? `${rcCount} scheduled` : "Add a bill",
      icon: "repeat",
      iconBg: "rgba(14,165,233,0.08)",
      iconColor: "#0EA5E9",
      route: rcCount > 0 ? "/recurring" : "/create-recurring",
    },
  ];

  const calculatedSavingsRate = totalIncome > 0 ? net / totalIncome : 0;
  const savingsRatePct = (summary?.savings_rate ?? calculatedSavingsRate) * 100;
  const displaySavingsRate = Math.round(savingsRatePct || 75);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Header ── */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/profile");
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: C.accentDim,
                borderWidth: 1.5,
                borderColor: C.accent,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {me?.profile_image_url ? (
                <Image
                  source={{ uri: me.profile_image_url }}
                  style={{ width: 38, height: 38 }}
                  resizeMode="cover"
                />
              ) : (
                <Text
                  variant="heading"
                  color="accent"
                  style={{ fontSize: 14, fontFamily: Fonts.sansBold }}
                >
                  {me?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </Text>
              )}
            </Pressable>
            <Text
              variant="label"
              color="primary"
              style={{ fontFamily: Fonts.sansSemiBold, fontSize: 15 }}
            >
              {me?.full_name ?? "Matthias Amire"}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            {/* <Pressable
              hitSlop={8}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <IconSymbol name='moon' size={20} color={C.textSecondary} />
            </Pressable> */}
            <Pressable
              hitSlop={8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/notifications' as any);
              }}
            >
              <View style={{ position: "relative" }}>
                <IconSymbol name="bell" size={20} color={C.textSecondary} />
                <View
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -1,
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: C.expense,
                  }}
                />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── Balance ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20, gap: 2 }}>
          <Text variant="caption" color="secondary" style={{ fontSize: 15 }}>
            Balance
          </Text>
          {summaryLoading ? (
            <ActivityIndicator
              color={C.accent}
              style={{ alignSelf: "flex-start", marginTop: 4 }}
            />
          ) : (
            <Text
              variant="heading"
              style={{
                color: C.textPrimary,
                fontFamily: Fonts.sansBold,
              }}
            >
              {displayMoney(net)}
            </Text>
          )}
        </View>

        {/* ── Savings card (Well Done!) ── */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View
            style={{
              backgroundColor: C.bgCard,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.border,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, gap: 6, paddingRight: 12 }}>
              <Text
                variant="subheading"
                color="primary"
                style={{ fontFamily: Fonts.sansBold }}
              >
                Well done!
              </Text>
              <Text
                variant="caption"
                color="secondary"
                style={{ fontSize: 13, lineHeight: 18 }}
              >
                {summary?.savings_rate
                  ? `Your savings rate is at ${displaySavingsRate}% this period.`
                  : "Your spending is stable compared to last month."}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/analytics");
                }}
                style={{ marginTop: 4 }}
              >
                <Text
                  style={{
                    color: C.brandBlue,
                    fontFamily: Fonts.sansSemiBold,
                    fontSize: 13,
                  }}
                >
                  View Details
                </Text>
              </Pressable>
            </View>
            <DonutProgress
              percentage={displaySavingsRate}
              amount={`${getCurrencySymbol()}${Math.round(net ?? 0).toLocaleString()}`}
              label="Saved"
            />
          </View>
        </View>

        {/* ── Module Quick-Access Cards ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={(width - 44) / 2.7 + 12}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          className="mb-5"
        >
          {moduleCards.map((card) => (
            <View
              key={card.id}
              className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
              style={{
                width: (width - 44) / 2.7,
                height: (width - 44) / 2.7,
              }}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(card.route as any);
                }}
                className="flex-1 p-4 justify-between"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View className="w-[38px] h-[38px] bg-white  items-center justify-center">
                  <IconSymbol
                    name={card.icon}
                    size={24}
                    color={card.iconColor}
                  />
                </View>
                <View className="gap-[6px]">
                  <Text variant="caption" color="secondary" numberOfLines={1}>
                    {card.subtitle}
                  </Text>
                  <Text
                    variant="label"
                    weight="semibold"
                    color="primary"
                    numberOfLines={1}
                  >
                    {card.title}
                  </Text>
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* ── Horizontal Pill Quick Actions ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              height: 64,
              borderRadius: 32,
              backgroundColor: C.bgCardAlt,
              borderWidth: 1,
              borderColor: C.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
            }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/recurring");
              }}
              style={styles.actionBtn}
            >
              <IconSymbol name="repeat" size={20} color={C.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/analytics");
              }}
              style={styles.actionBtn}
            >
              <IconSymbol name="trending-up" size={20} color={C.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/transactions");
              }}
              style={styles.actionBtn}
            >
              <IconSymbol name="list" size={20} color={C.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/net-worth");
              }}
              style={styles.actionBtn}
            >
              <IconSymbol name="activity" size={20} color={C.textPrimary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/create-transaction");
              }}
              style={[styles.actionBtn, styles.actionPlus]}
            >
              <Text
                style={{
                  color: C.brandBlue,
                  fontSize: 22,
                  fontFamily: Fonts.sansBold,
                  lineHeight: 26,
                }}
              >
                +
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Transaction History ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              variant="subheading"
              style={{ fontFamily: Fonts.sansBold, fontSize: 18 }}
            >
              Transaction History
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/transactions");
              }}
              hitSlop={8}
            >
              <Text
                variant="caption"
                color="secondary"
                style={{ fontSize: 13 }}
              >
                See All
              </Text>
            </Pressable>
          </View>

          {/* Filter Tabs */}
          <View
            style={{
              flexDirection: "row",
              gap: 24,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              paddingBottom: 10,
              marginBottom: 16,
            }}
          >
            {(
              [
                { id: "all", label: "All" },
                { id: "expense", label: "Spending" },
                { id: "income", label: "Income" },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab.id);
                  }}
                  style={{ position: "relative" }}
                >
                  <Text
                    style={{
                      fontFamily: isActive ? Fonts.sansBold : Fonts.sans,
                      fontSize: 14,
                      color: isActive ? C.textPrimary : C.textSecondary,
                    }}
                  >
                    {tab.label}
                  </Text>
                  {isActive && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: -11,
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: C.accent,
                        borderRadius: 1.5,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>

          {txLoading ? (
            <ActivityIndicator color={C.accent} />
          ) : transactions?.length ? (
            transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                item={tx}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  (router as any).push(`/transaction/${tx.id}`);
                }}
              />
            ))
          ) : (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 32,
                backgroundColor: C.bgCard,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Text variant="body" color="secondary">
                No transactions found
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/create-transaction");
                }}
                style={{ marginTop: 12 }}
              >
                <Text variant="label" color="accent">
                  + Add transaction
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  donutContainer: {
    position: "relative",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  donutTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutAmount: {
    fontSize: 12,
    color: C.textPrimary,
  },
  donutLabel: {
    fontSize: 8,
    color: C.textSecondary,
    marginTop: -2,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionPlus: {
    backgroundColor: C.white,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
