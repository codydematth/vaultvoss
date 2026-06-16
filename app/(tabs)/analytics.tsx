import {IconSymbol} from '@/components/ui/icon-symbol';
import {Text} from '@/components/ui/text';
import {C, getCategoryColor} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useAnalyticsByCategory, useAnalyticsMonthly, useAnalyticsSummary} from '@/hooks/use-analytics';
import * as Haptics from 'expo-haptics';
import {useState} from 'react';
import {ActivityIndicator, Dimensions, Pressable, RefreshControl, ScrollView, View, Modal} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQueryClient} from '@tanstack/react-query';
import type {AnalyticsByPeriodParams, CategoryBreakdownItem, TransactionType} from '@/lib/api/types';
import {useCurrency} from '@/lib/currency-context';
import Svg, {Circle, Rect, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Path} from 'react-native-svg';

const {width: SCREEN_W} = Dimensions.get('window');
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
type CategoryFilter = 'all' | 'income' | 'expense';

// ── SVG Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({
  data,
  size = 160,
  strokeWidth = 22,
}: {
  data: {category: string; type: 'income' | 'expense'; total: number; percentage: number; color: string}[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let cumulativePercent = 0;
  const totalAmount = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <Svg width={size} height={size}>
      {/* Background ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="transparent"
        stroke={C.border}
        strokeWidth={strokeWidth}
        opacity={0.5}
      />
      {/* Data segments */}
      {data.map((item, i) => {
        const pct = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0;
        const offset = circumference - (pct / 100) * circumference;
        const rotation = (cumulativePercent / 100) * 360 - 90;
        cumulativePercent += pct;

        return (
          <Circle
            key={`${item.category}-${item.type}-${i}`}
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
    </Svg>
  );
}

// ── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChart({
  data,
  formatMoney,
}: {
  data: {label: string; income: number; expense: number}[];
  formatMoney: (v: number) => string;
}) {
  const chartW = SCREEN_W - 80;
  const chartH = 160;
  const barPadding = 8;
  const bottomPad = 28;
  const topPad = 8;
  const graphH = chartH - bottomPad - topPad;

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const groupW = (chartW - barPadding * 2) / data.length;
  const barW = Math.min(groupW * 0.32, 16);
  const barGap = 3;

  return (
    <Svg width={chartW} height={chartH}>
      <Defs>
        <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.income} stopOpacity="1" />
          <Stop offset="1" stopColor={C.income} stopOpacity="0.5" />
        </LinearGradient>
        <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={C.expense} stopOpacity="1" />
          <Stop offset="1" stopColor={C.expense} stopOpacity="0.5" />
        </LinearGradient>
      </Defs>

      {/* Horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <Line
          key={frac}
          x1={0}
          y1={topPad + graphH * (1 - frac)}
          x2={chartW}
          y2={topPad + graphH * (1 - frac)}
          stroke={C.border}
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const groupX = barPadding + i * groupW;
        const centerX = groupX + groupW / 2;

        const incomeH = Math.max((d.income / maxVal) * graphH, 3);
        const expenseH = Math.max((d.expense / maxVal) * graphH, 3);

        const incomeY = topPad + graphH - incomeH;
        const expenseY = topPad + graphH - expenseH;
        const barRadius = Math.min(barW / 2, 5);

        return (
          <G key={i}>
            {/* Income bar with rounded top */}
            <Path
              d={roundedTopRect(centerX - barW - barGap / 2, incomeY, barW, incomeH, barRadius)}
              fill="url(#incomeGrad)"
            />
            {/* Expense bar with rounded top */}
            <Path
              d={roundedTopRect(centerX + barGap / 2, expenseY, barW, expenseH, barRadius)}
              fill="url(#expenseGrad)"
            />
            {/* Label */}
            <SvgText
              x={centerX}
              y={chartH - 6}
              textAnchor="middle"
              fill={C.textMuted}
              fontSize={10}
              fontFamily={Fonts.sansMedium}
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}

      {/* Bottom axis line */}
      <Line x1={0} y1={topPad + graphH} x2={chartW} y2={topPad + graphH} stroke={C.border} strokeWidth={0.5} />
    </Svg>
  );
}

// Helper: SVG path for a rectangle with rounded top corners
function roundedTopRect(x: number, y: number, w: number, h: number, r: number): string {
  r = Math.min(r, h / 2, w / 2);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

// ── Category Row ────────────────────────────────────────────────────────────
function CategoryRow({
  item,
  formatMoney,
  maxTotal,
}: {
  item: CategoryBreakdownItem & {color: string};
  formatMoney: (v: number) => string;
  maxTotal: number;
}) {
  const pct = item.percentage ?? 0;
  const barWidth = maxTotal > 0 ? Math.max((item.total / maxTotal) * 100, 2) : 0;

  return (
    <View style={{gap: 6, marginBottom: 16}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1}}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${item.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: item.color,
              }}
            />
          </View>
          <View style={{flex: 1}}>
            <Text variant="body" weight="semibold" color="primary" numberOfLines={1}>
              {item.category}
            </Text>
            {item.count !== undefined && (
              <Text variant="caption" color="muted">
                {item.count} transaction{item.count !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text variant="body" weight="semibold" style={{color: item.color}}>
            {formatMoney(item.total)}
          </Text>
          <Text variant="caption" color="muted">
            {pct.toFixed(1)}%
          </Text>
        </View>
      </View>
      {/* Progress bar */}
      <View style={{height: 4, backgroundColor: `${item.color}12`, borderRadius: 2, overflow: 'hidden', marginLeft: 42}}>
        <View
          style={{
            height: 4,
            width: `${Math.min(barWidth, 100)}%`,
            backgroundColor: item.color,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>('monthly');
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const {currency, formatMoney} = useCurrency();
  const [showInfo, setShowInfo] = useState(false);

  const params: AnalyticsByPeriodParams = {period, currency};
  const {data: summary, isLoading: sumLoading} = useAnalyticsSummary(params);
  const {data: byCategory, isLoading: catLoading} = useAnalyticsByCategory(params);
  const {data: monthly, isLoading: monthLoading} = useAnalyticsMonthly({months: 6, currency});

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await qc.invalidateQueries({queryKey: ['analytics']});
    setRefreshing(false);
  };

  const totalIncome = summary?.total_income ?? 0;
  const totalExpenses = summary?.total_expenses ?? 0;
  const netSavings = summary?.net_balance ?? summary?.net_savings ?? (totalIncome - totalExpenses);
  const calculatedSavingsRate = totalIncome > 0 ? netSavings / totalIncome : 0;
  const savingsRate = summary?.savings_rate ?? calculatedSavingsRate;
  const txCount = summary?.transaction_count ?? 0;

  // Monthly chart data
  const monthlyChartData = (monthly ?? []).slice(-6).map((m) => ({
    label: m.month?.slice(0, 3) ?? '',
    income: m.total_income,
    expense: m.total_expenses,
  }));

  // Category data processing
  const allCategories: (CategoryBreakdownItem & {color: string; transaction_type: TransactionType})[] = [];
  if (byCategory) {
    if (Array.isArray(byCategory.expenses)) {
      byCategory.expenses.forEach((item) => {
        allCategories.push({
          ...item,
          transaction_type: 'expense',
          color: getCategoryColor(item.category, 'expense'),
        });
      });
    }
    if (Array.isArray(byCategory.income)) {
      byCategory.income.forEach((item) => {
        allCategories.push({
          ...item,
          transaction_type: 'income',
          color: getCategoryColor(item.category, 'income'),
        });
      });
    }
  }

  const filteredCategories =
    categoryFilter === 'all'
      ? allCategories
      : allCategories.filter((c) => c.transaction_type === categoryFilter);

  const sortedCategories = [...filteredCategories].sort((a, b) => b.total - a.total);
  const maxCategoryTotal = sortedCategories.length > 0 ? sortedCategories[0].total : 0;

  // Donut data (top 6)
  const donutData = sortedCategories.slice(0, 6).map((item) => ({
    category: item.category,
    type: item.transaction_type,
    total: item.total,
    percentage: item.percentage ?? 0,
    color: item.color,
  }));

  const isLoading = sumLoading && catLoading && monthLoading;

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        contentContainerStyle={{paddingBottom: 110}}
      >
        {/* ── Header ── */}
        <View style={{paddingTop: insets.top + 16, paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <View style={{flex: 1}}>
            <Text variant="heading" color="primary">
              Analytics
            </Text>
            <Text variant="caption" color="secondary" style={{marginTop: 4}}>
              Track your financial trends
            </Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowInfo(true); }}
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
            <IconSymbol name="info.circle" size={18} color={C.textSecondary} />
          </Pressable>
        </View>

        {/* ── Period tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 20, gap: 8, marginBottom: 24}}
        >
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => {
            const isActive = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPeriod(p);
                }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 24,
                  backgroundColor: isActive ? C.accent : C.bgCard,
                  borderWidth: 1,
                  borderColor: isActive ? C.accent : C.border,
                }}
              >
                <Text
                  variant="label"
                  style={{
                    color: isActive ? C.textInverse : C.textSecondary,
                    fontFamily: Fonts.sansSemiBold,
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Summary Cards ── */}
        {sumLoading ? (
          <ActivityIndicator color={C.accent} style={{marginVertical: 24}} />
        ) : (
          <View style={{paddingHorizontal: 20, marginBottom: 20}}>
            {/* Income & Expense row */}
            <View style={{flexDirection: 'row', gap: 12, marginBottom: 12}}>
              {/* Income card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: C.incomeDim,
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: `${C.income}20`,
                }}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10}}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: `${C.income}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="arrow.up.right" size={14} color={C.income} />
                  </View>
                  <Text variant="caption" style={{color: C.income, fontFamily: Fonts.sansMedium}}>
                    Income
                  </Text>
                </View>
                <Text variant="title" style={{color: C.income, fontFamily: Fonts.sansBold, fontSize: 20}}>
                  {formatMoney(totalIncome)}
                </Text>
              </View>

              {/* Expense card */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: C.expenseDim,
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: `${C.expense}20`,
                }}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10}}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      backgroundColor: `${C.expense}20`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSymbol name="arrow.down.left" size={14} color={C.expense} />
                  </View>
                  <Text variant="caption" style={{color: C.expense, fontFamily: Fonts.sansMedium}}>
                    Expenses
                  </Text>
                </View>
                <Text variant="title" style={{color: C.expense, fontFamily: Fonts.sansBold, fontSize: 20}}>
                  {formatMoney(totalExpenses)}
                </Text>
              </View>
            </View>

            {/* Net savings & Savings rate cards */}
            <View style={{flexDirection: 'row', gap: 12}}>
              {/* Net savings */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: C.bgCard,
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text variant="caption" color="secondary" style={{marginBottom: 8}}>
                  Net Savings
                </Text>
                <Text
                  variant="subheading"
                  style={{
                    color: netSavings >= 0 ? C.income : C.expense,
                    fontFamily: Fonts.sansBold,
                  }}
                >
                  {formatMoney(netSavings)}
                </Text>
              </View>

              {/* Savings rate */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: C.bgCard,
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Text variant="caption" color="secondary" style={{marginBottom: 8}}>
                  Savings Rate
                </Text>
                <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 2}}>
                  <Text
                    variant="subheading"
                    style={{
                      color: savingsRate >= 0.2 ? C.income : savingsRate >= 0 ? C.warning : C.expense,
                      fontFamily: Fonts.sansBold,
                    }}
                  >
                    {(savingsRate * 100).toFixed(1)}
                  </Text>
                  <Text variant="caption" style={{color: C.textMuted}}>
                    %
                  </Text>
                </View>
                {/* Mini progress bar */}
                <View style={{height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginTop: 8}}>
                  <View
                    style={{
                      height: 4,
                      width: `${Math.min(Math.max(savingsRate * 100, 0), 100)}%`,
                      backgroundColor: savingsRate >= 0.2 ? C.income : savingsRate >= 0 ? C.warning : C.expense,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Monthly Trend Chart ── */}
        {!monthLoading && monthlyChartData.length > 0 && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: C.bgCard,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.border,
              padding: 20,
            }}
          >
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <View>
                <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                  Monthly Trend
                </Text>
                <Text variant="caption" color="muted" style={{marginTop: 2}}>
                  Last 6 months overview
                </Text>
              </View>
              {/* Legend */}
              <View style={{flexDirection: 'row', gap: 12}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                  <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: C.income}} />
                  <Text variant="overline" color="muted">
                    Income
                  </Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                  <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: C.expense}} />
                  <Text variant="overline" color="muted">
                    Expense
                  </Text>
                </View>
              </View>
            </View>
            <View style={{alignItems: 'center'}}>
              <BarChart data={monthlyChartData} formatMoney={formatMoney} />
            </View>
          </View>
        )}

        {/* ── Category Breakdown ── */}
        {!catLoading && allCategories.length > 0 && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: C.bgCard,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: C.border,
              padding: 20,
            }}
          >
            <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold, marginBottom: 4}}>
              Spending Breakdown
            </Text>
            <Text variant="caption" color="muted" style={{marginBottom: 20}}>
              Where your money goes
            </Text>

            {/* Category filter tabs */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: C.bgCardAlt,
                borderRadius: 12,
                padding: 3,
                marginBottom: 24,
              }}
            >
              {([
                {id: 'all' as const, label: 'All'},
                {id: 'expense' as const, label: 'Expenses'},
                {id: 'income' as const, label: 'Income'},
              ]).map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategoryFilter(tab.id);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: isActive ? C.white : 'transparent',
                      alignItems: 'center',
                      ...(isActive
                        ? {
                            shadowColor: C.black,
                            shadowOffset: {width: 0, height: 1},
                            shadowOpacity: 0.06,
                            shadowRadius: 3,
                            elevation: 1,
                          }
                        : {}),
                    }}
                  >
                    <Text
                      variant="label"
                      style={{
                        color: isActive ? C.textPrimary : C.textMuted,
                        fontFamily: isActive ? Fonts.sansSemiBold : Fonts.sans,
                        fontSize: 12,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Donut + total center */}
            {donutData.length > 0 && (
              <View style={{alignItems: 'center', marginBottom: 24}}>
                <View style={{position: 'relative', alignItems: 'center', justifyContent: 'center'}}>
                  <DonutChart data={donutData} size={180} strokeWidth={24} />
                  <View style={{position: 'absolute', alignItems: 'center'}}>
                    <Text variant="caption" color="muted" style={{marginBottom: 2}}>
                      Total
                    </Text>
                    <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold, fontSize: 18}}>
                      {formatMoney(sortedCategories.reduce((s, c) => s + c.total, 0))}
                    </Text>
                    {sortedCategories.some((c) => c.count !== undefined) && (
                      <Text variant="overline" color="muted">
                        {sortedCategories.reduce((s, c) => s + (c.count ?? 0), 0)} txn
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Category list */}
            {sortedCategories.length > 0 ? (
              sortedCategories.map((item, i) => (
                <CategoryRow
                  key={`${item.category}-${item.transaction_type}-${i}`}
                  item={item}
                  formatMoney={formatMoney}
                  maxTotal={maxCategoryTotal}
                />
              ))
            ) : (
              <View style={{alignItems: 'center', paddingVertical: 20}}>
                <Text variant="body" color="muted">
                  No {categoryFilter === 'all' ? '' : categoryFilter} categories found
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Transaction Count Card ── */}
        {summary && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: C.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: C.border,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: C.accentDim,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSymbol name="list.bullet" size={20} color={C.accent} />
            </View>
            <View style={{flex: 1}}>
              <Text variant="caption" color="secondary">
                Total Transactions
              </Text>
              <Text variant="subheading" color="primary" style={{fontFamily: Fonts.sansBold}}>
                {txCount}
              </Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text variant="caption" color="muted">
                this {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'yearly' ? 'year' : 'month'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

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
                  Financial Analytics
                </Text>
              </View>
              <Pressable onPress={() => setShowInfo(false)} hitSlop={10}>
                <IconSymbol name="xmark.circle.fill" size={24} color={C.textSecondary} />
              </Pressable>
            </View>

            <Text variant="body" color="secondary" style={{fontSize: 14, lineHeight: 22, fontFamily: Fonts.sans}}>
              {"Analytics provides a visual breakdown of your cash flow. Understand where your money goes by categories, view your monthly income vs. expenses, and track your overall savings rate over time."}
            </Text>

            <View style={{height: 1, backgroundColor: C.border}} />

            <View style={{gap: 8}}>
              <Text variant="caption" color="primary" style={{fontFamily: Fonts.sansSemiBold, fontSize: 13}}>
                Quick Tips:
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Switch between Expense and Income tabs to filter the donut chart breakdown."}
              </Text>
              <Text variant="caption" color="secondary" style={{lineHeight: 18}}>
                {"• Change your currency preference in Settings to dynamically convert totals."}
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
    </View>
  );
}
