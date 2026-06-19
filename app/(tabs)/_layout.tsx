import { IconSymbol } from "@/components/ui/icon-symbol";
import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Animated Tab Icon ────────────────────────────────────────────────────────
function AnimatedIconWrapper({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, { damping: 10, stiffness: 150 });
      translateY.value = withSpring(-2, { damping: 10, stiffness: 150 });
      rotation.value = withSpring(360, { damping: 12, stiffness: 100 });
    } else {
      scale.value = withSpring(1.0, { damping: 12, stiffness: 100 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      rotation.value = withSpring(0, { damping: 12, stiffness: 100 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

// ─── Custom tab bar ──────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomMargin = Math.max(insets.bottom - 10, 8);

  return (
    <>
      <BlurView
        intensity={10}
        tint="light"
        style={[s.bottomBlur, { height: bottomMargin + 40 }]}
      />

      {/* Floating tab bar pill */}
      <View style={[s.shadowWrapper, { bottom: bottomMargin }]}>
        <View style={s.bar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isFab = route.name === "add";

            const onPress = () => {
              Haptics.impactAsync(
                isFab
                  ? Haptics.ImpactFeedbackStyle.Medium
                  : Haptics.ImpactFeedbackStyle.Light,
              );
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
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
                    router.push("/create-transaction");
                  }}
                  style={s.fabWrap}
                >
                  <View style={s.fab}>
                    <Text style={s.fabIcon}>+</Text>
                  </View>
                </Pressable>
              );
            }

            const label =
              (options.tabBarLabel as string) ?? options.title ?? route.name;
            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? C.brandBlue : C.textMuted,
              size: 22,
            });

            return (
              <Pressable key={route.key} onPress={onPress} style={s.tab}>
                <View style={[s.tabContent, isFocused && s.activeTabContent]}>
                  <View style={s.iconWrap}>
                    <AnimatedIconWrapper focused={isFocused}>
                      {icon}
                    </AnimatedIconWrapper>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      s.tabLabel,
                      { color: isFocused ? C.brandBlue : C.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <IconSymbol
              name={focused ? "house.fill" : "house"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarLabel: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="chart.bar.xaxis" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{ tabBarLabel: "", tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarLabel: "History",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="list.bullet" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="grid" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  shadowWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 32,
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomBlur: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  bar: {
    flexDirection: "row",
    backgroundColor: C.bg,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 3,
    minWidth: 56,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  activeTabContent: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 24,
  },
  tabLabel: { fontFamily: Fonts.sans, fontSize: 10, letterSpacing: 0.2 },
  fabWrap: { flex: 1, alignItems: "center", paddingBottom: 4 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginTop: -18,
  },
  fabIcon: {
    fontSize: 28,
    color: C.textInverse,
    fontFamily: Fonts.sans,
    lineHeight: 32,
    marginTop: -2,
  },
});
