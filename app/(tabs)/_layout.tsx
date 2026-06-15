import {C} from '@/constants/colors';
import {Fonts} from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import {Tabs, useRouter} from 'expo-router';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {IconSymbol} from '@/components/ui/icon-symbol';

// ─── Custom tab bar ──────────────────────────────────────────────────────────
function CustomTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        s.bar,
        {paddingBottom: Math.max(insets.bottom, 8)},
      ]}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const isFocused = state.index === index;
        const isFab = route.name === 'add';

        const onPress = () => {
          Haptics.impactAsync(isFab ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
          const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isFab) {
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-transaction');
              }}
              style={s.fabWrap}>
              <View style={s.fab}>
                <Text style={s.fabIcon}>+</Text>
              </View>
            </Pressable>
          );
        }

        const label = options.tabBarLabel as string ?? options.title ?? route.name;
        const icon = options.tabBarIcon?.({focused: isFocused, color: isFocused ? C.income : C.textMuted, size: 22});

        return (
          <Pressable key={route.key} onPress={onPress} style={s.tab}>
            <View style={s.iconWrap}>{icon}</View>
            <Text style={[s.tabLabel, {color: isFocused ? C.income : C.textMuted}]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tabs.Screen
        name='index'
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => <IconSymbol name='house.fill' color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='analytics'
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({color, size}) => <IconSymbol name='chart.bar.xaxis' color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='add'
        options={{tabBarLabel: '', tabBarIcon: () => null}}
      />
      <Tabs.Screen
        name='transactions'
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({color, size}) => <IconSymbol name='list.bullet' color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({color, size}) => <IconSymbol name='gearshape.fill' color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  tab: {flex: 1, alignItems: 'center', gap: 3, paddingTop: 4},
  iconWrap: {alignItems: 'center', justifyContent: 'center', height: 28},
  tabLabel: {fontFamily: Fonts.sans, fontSize: 10, letterSpacing: 0.2},
  fabWrap: {flex: 1, alignItems: 'center', paddingBottom: 4},
  fab: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginTop: -18,
  },
  fabIcon: {
    fontSize: 28, color: C.textInverse,
    fontFamily: Fonts.sans,
    lineHeight: 32,
    marginTop: -2,
  },
});
