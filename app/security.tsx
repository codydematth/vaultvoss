import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";
import { authApi } from "@/lib/api/auth";
import { useAuthContext } from "@/lib/auth/auth-context";
import { storage } from "@/lib/storage";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthContext();
  const { showToast } = useToast();

  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric");
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password confirmation states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect biometric capabilities
  useEffect(() => {
    (async () => {
      try {
        const hardware = await LocalAuthentication.hasHardwareAsync();
        setHasHardware(hardware);

        if (hardware) {
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setIsEnrolled(enrolled);

          const types =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (
            types.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
            )
          ) {
            setBiometricLabel("Face ID");
          } else if (
            types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
          ) {
            setBiometricLabel("Touch ID / Fingerprint");
          } else {
            setBiometricLabel("Biometric Login");
          }
        }

        const active = await storage.getBiometricEnabled();
        setIsEnabled(active);
      } catch (err) {
        console.log("Error initializing biometrics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (value: boolean) => {
    Haptics.selectionAsync();

    // Turning biometrics OFF is simple and doesn't require confirmation
    if (!value) {
      await storage.clearBiometricCredentials();
      setIsEnabled(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ message: `${biometricLabel} login disabled`, type: "info" });
      return;
    }

    // Turning ON requires password verification & active scan
    if (!hasHardware || !isEnrolled) {
      setError(
        "Biometric hardware is not configured or enrolled on this device.",
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setPassword("");
    setError(null);
    setConfirmVisible(true);
  };

  const handleConfirmPassword = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    if (!user?.email) {
      setError("User email context is missing. Try logging in again.");
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // 1. Verify password via Login API
      const { data } = await authApi.login({
        email: user.email,
        password: password.trim(),
      });

      if (data.hasError) {
        throw new Error(data.message || "Incorrect password");
      }

      // 2. Perform test biometric scan to verify hardware works right now
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricLabel} Login`,
        fallbackLabel: "Use passcode",
      });

      if (!result.success) {
        throw new Error("Biometric scanning authentication failed.");
      }

      // 3. Save to secure store and enable
      await storage.saveBiometricCredentials(user.email, password.trim());
      await storage.setBiometricEnabled(true);
      setIsEnabled(true);
      setConfirmVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        message: `${biometricLabel} login enabled successfully`,
        type: "success",
      });
    } catch (err: any) {
      console.log("Error verification biometric:", err);
      setError(err?.message || "Verification failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: (insets.top ?? 0) + 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Pressable
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
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name="chevron.left" size={16} color={C.textPrimary} />
        </Pressable>
        <Text variant="heading" color="primary">
          Security
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 20 }}
      >
        {/* Device support info banner */}
        <View
          style={{
            backgroundColor: hasHardware ? C.incomeDim : C.expenseDim,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: hasHardware ? `${C.income}33` : `${C.expense}33`,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: hasHardware ? C.income : C.expense,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol name="lock.shield" size={20} color={C.white} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              variant="subheading"
              style={{
                fontFamily: Fonts.sansBold,
                fontSize: 15,
                color: hasHardware ? C.income : C.expense,
              }}
            >
              {hasHardware ? "Biometrics Supported" : "Hardware Not Supported"}
            </Text>
            <Text
              variant="caption"
              color="secondary"
              style={{ fontSize: 12, lineHeight: 16 }}
            >
              {hasHardware
                ? `Your device supports secure ${biometricLabel} hardware scanning.`
                : "Your device does not support biometric sensors or they are unavailable."}
            </Text>
          </View>
        </View>

        {/* Biometrics enrolment warning */}
        {hasHardware && !isEnrolled && (
          <View
            style={{
              backgroundColor: C.warningDim,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${C.warning}33`,
              padding: 16,
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
            }}
          >
            <IconSymbol name="info.circle" size={20} color={C.warning} />
            <Text
              variant="caption"
              style={{
                flex: 1,
                color: C.warning,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {
                "No biometric profiles registered. Please configure Face ID or Fingerprints in your device's system settings first."
              }
            </Text>
          </View>
        )}

        {/* Biometric Toggle Card */}
        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            gap: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, gap: 2, paddingRight: 12 }}>
              <Text variant="subheading" color="primary">
                Biometric Login
              </Text>
              <Text
                variant="caption"
                color="secondary"
                style={{ fontSize: 12, lineHeight: 16 }}
              >
                Fast, secure sign-in to your financial dashboard using your
                biometric scanner.
              </Text>
            </View>
            <Switch
              disabled={!hasHardware || !isEnrolled}
              value={isEnabled}
              onValueChange={handleToggle}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={C.white}
              ios_backgroundColor={C.border}
            />
          </View>
        </View>
      </ScrollView>

      {/* Password Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "flex-end" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Backdrop */}
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: C.overlay,
            }}
            onPress={() => setConfirmVisible(false)}
          />

          <View
            style={{
              backgroundColor: C.bgCard,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderTopColor: C.border,
              paddingBottom: Math.max(insets.bottom ?? 0, 16) + 16,
              paddingHorizontal: 24,
              paddingTop: 12,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: C.border,
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <Text variant="title" color="primary">
                Confirm Password
              </Text>
              <Pressable onPress={() => setConfirmVisible(false)} hitSlop={10}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={28}
                  color={C.textSecondary}
                />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 16, paddingBottom: 20 }}>
                <Text
                  variant="body"
                  color="secondary"
                  style={{ lineHeight: 22 }}
                >
                  To enable biometric login, please enter your current account
                  password to verify your credentials.
                </Text>

                <Input
                  label="Account Password"
                  placeholder="Enter password"
                  password
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                  onSubmitEditing={handleConfirmPassword}
                />

                {error && (
                  <View
                    style={{
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: C.expense,
                      padding: 12,
                      backgroundColor: C.expenseDim,
                    }}
                  >
                    <Text variant="caption" color="danger">
                      {error}
                    </Text>
                  </View>
                )}

                <Button
                  label={verifying ? "Verifying…" : "Confirm & Enable"}
                  variant="primary"
                  size="lg"
                  loading={verifying}
                  onPress={handleConfirmPassword}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
