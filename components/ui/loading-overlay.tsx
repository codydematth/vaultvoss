import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";
import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import { Image, Modal, Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1200,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.ease }),
          withTiming(0.9, { duration: 800, easing: Easing.ease }),
        ),
        -1,
        true,
      );
    } else {
      rotation.value = 0;
      scale.value = 1;
    }
  }, [visible]);

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (!visible) return null;

  const content = (
    <View style={styles.container}>
      {Platform.OS === "ios" ? (
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(255, 255, 255, 0.85)" },
          ]}
        />
      )}

      <View style={styles.card}>
        <View style={styles.spinnerWrapper}>
          {/* Spinner ring */}
          <Animated.View style={[styles.spinnerRing, animatedSpinnerStyle]} />

          {/* Logo in the center */}
          <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
            <Image
              source={require("@/assets/images/vaultvoss.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    minWidth: 160,
  },
  spinnerWrapper: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerRing: {
    position: "absolute",
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3.5,
    borderColor: C.border,
    borderTopColor: C.brandBlue,
    borderRightColor: C.brandBlue,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: C.textPrimary,
    textAlign: "center",
  },
});
