import {Text} from '@/components/ui/text';
import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import {useAnalyticsByCategory, useAnalyticsMonthly, useAnalyticsSummary} from '@/hooks/use-analytics';
import * as Haptics from 'expo-haptics';
import {useState} from 'react';
import {ActivityIndicator, Dimensions, Platform, Pressable, RefreshControl, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQueryClient} from '@tanstack/react-query';
import {getCategoryColor} from '@/constants/colors';
import type {AnalyticsByPeriodParams} from '@/lib/api/types';
import {useCurrency} from '@/lib/currency-context';

const {width} = Dimensions.get('window');
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ── Mini bar chart ──────────────────────────────────────────────────────────
function BarChart({data}: {data: {label: string; income: number; expense: number}[]}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const barH = 100;
  return (
    <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: barH + 24}}>
      {data.map((d, i) => (
        <View key={i} style={{flex: 1, alignItems: 'center', gap: 4}}>
          <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: barH}}>
            <View style={{flex: 1, backgroundColor: C.income, borderRadius: 4, height: Math.max((d.income / maxVal) * barH, 4), opacity: 0.8}} />
            <View style={{flex: 1, backgroundColor: C.expense, borderRadius: 4, height: Math.max((d.expense / maxVal) * barH, 4), opacity: 0.8}} />
          </View>
          <Text variant='overline' style={{color: C.textMuted, fontSize: 9}}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Donut chart ─────────────────────────────────────────────────────────────
function DonutLegend({data}: {data: {category: string; type?: 'income' | 'expense'; transaction_type?: 'income' | 'expense'; total: number; percentage?: number}[]}) {
  return (
    <View style={{gap: 12}}>
      {data.slice(0, 8).map((item) => {
        const txType = item.type ?? item.transaction_type ?? 'expense';
        const color = getCategoryColor(item.category, txType);
        const pct = item.percentage ?? 0;
        return (
          <View key={item.category + txType} style={{gap: 6}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <View style={{width: 10, height: 10, borderRadius: 5, backgroundColor: color}} />
                <Text variant='body' color='primary'>{item.category}</Text>
              </View>
              <Text variant='label' style={{color, fontFamily: Fonts.sansSemiBold}}>{pct.toFixed(1)}%</Text>
            </View>
            <View style={{height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden'}}>
              <View style={{height: 4, width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: 2}} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>('monthly');
  const [refreshing, setRefreshing] = useState(false);
  const {formatMoney} = useCurrency();

  const params: AnalyticsByPeriodParams = {period};
  const {data: summary, isLoading: sumLoading} = useAnalyticsSummary(params);
  const {data: byCategory, isLoading: catLoading} = useAnalyticsByCategory(params);
  const {data: monthly, isLoading: monthLoading} = useAnalyticsMonthly({months: 6});

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await qc.invalidateQueries({queryKey: ['analytics']});
    setRefreshing(false);
  };

  const totalIncome = summary?.total_income ?? 0;
  const totalExpenses = summary?.total_expenses ?? 0;
  const netSavings = summary?.net_balance ?? summary?.net_savings ?? (totalIncome - totalExpenses);
  const calculatedSavingsRate = totalIncome > 0 ? (netSavings / totalIncome) : 0;
  const savingsRate = summary?.savings_rate ?? calculatedSavingsRate;

  const monthlyChartData = (monthly ?? []).slice(-6).map((m) => ({
    label: m.month?.slice(0, 3) ?? '',
    income: m.total_income,
    expense: m.total_expenses,
  }));

  return (
    <View style={{flex: 1, backgroundColor: C.bg}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        contentContainerStyle={{paddingBottom: 40}}>

        {/* Header */}
        <View style={{paddingTop: insets.top + 16, paddingHorizontal: 20, marginBottom: 20}}>
          <Text variant='heading' color='primary'>Analytics</Text>
        </View>

        {/* Period tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20, gap: 8, marginBottom: 20}}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
            <Pressable
              key={p}
              onPress={() => { Haptics.selectionAsync(); setPeriod(p); }}
              style={{
                paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20,
                backgroundColor: period === p ? C.accentDim : C.bgCard,
                borderWidth: 1, borderColor: period === p ? C.accent : C.border,
              }}>
              <Text variant='label' style={{color: period === p ? C.accent : C.textSecondary, fontFamily: Fonts.sansSemiBold}}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Summary cards */}
        {sumLoading ? <ActivityIndicator color={C.accent} style={{marginBottom: 20}} /> : (
          <View style={{flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 20}}>
            <View style={{flex: 1, backgroundColor: C.incomeDim, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${C.income}33`, gap: 4}}>
              <Text variant='caption' style={{color: C.income}}>Income</Text>
              <Text variant='subheading' style={{color: C.income, fontFamily: Fonts.sansBold}}>{formatMoney(totalIncome)}</Text>
            </View>
            <View style={{flex: 1, backgroundColor: C.expenseDim, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: `${C.expense}33`, gap: 4}}>
              <Text variant='caption' style={{color: C.expense}}>Expenses</Text>
              <Text variant='subheading' style={{color: C.expense, fontFamily: Fonts.sansBold}}>{formatMoney(totalExpenses)}</Text>
            </View>
          </View>
        )}

        {/* Savings progress */}
        {summary && (
          <View style={{marginHorizontal: 20, marginBottom: 20, backgroundColor: C.bgCard, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, gap: 12}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text variant='subheading' color='primary'>Savings Rate</Text>
              <Text variant='subheading' style={{color: C.accent, fontFamily: Fonts.sansBold}}>
                {(savingsRate * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={{height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden'}}>
              <View style={{height: 8, width: `${Math.min(savingsRate * 100, 100)}%`, backgroundColor: C.accent, borderRadius: 4}} />
            </View>
            <Text variant='caption' color='secondary'>Net savings: {formatMoney(netSavings)}</Text>
          </View>
        )}

        {/* Monthly bar chart */}
        {!monthLoading && monthlyChartData.length > 0 && (
          <View style={{marginHorizontal: 20, marginBottom: 20, backgroundColor: C.bgCard, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, gap: 16}}>
            <Text variant='subheading' color='primary'>Last 6 Months</Text>
            <BarChart data={monthlyChartData} />
            <View style={{flexDirection: 'row', gap: 16}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <View style={{width: 12, height: 12, borderRadius: 3, backgroundColor: C.income}} />
                <Text variant='caption' color='secondary'>Income</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <View style={{width: 12, height: 12, borderRadius: 3, backgroundColor: C.expense}} />
                <Text variant='caption' color='secondary'>Expenses</Text>
              </View>
            </View>
          </View>
        )}

        {/* By category */}
        {!catLoading && byCategory && byCategory.length > 0 && (
          <View style={{marginHorizontal: 20, marginBottom: 20, backgroundColor: C.bgCard, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, gap: 16}}>
            <Text variant='subheading' color='primary'>By Category</Text>
            <DonutLegend data={byCategory as any} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
