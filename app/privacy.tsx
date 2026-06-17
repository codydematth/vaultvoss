import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top || 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color="primary">
          Privacy Policy
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={12}
          style={styles.closeButton}
        >
          <IconSymbol
            name="xmark.circle.fill"
            size={28}
            color={C.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (insets.bottom || 16) + 32 },
        ]}
      >
        <Text variant="caption" color="secondary" style={styles.date}>
          Last updated: June 11, 2026
        </Text>

        <Text variant="body" color="secondary" style={styles.paragraph}>
          {'VaultVoss ("us", "we", or "our") respects your privacy. This Privacy Policy describes how we collect, protect, and use your information when you use our mobile application ("App").'}
        </Text>

        {/* Section 1 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          1. Information We Collect
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          {"We only collect information necessary to provide and improve the App's services. This includes:"}
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={[styles.paragraph, styles.bullet]}
        >
          •{" "}
          <Text style={{ fontWeight: "bold", color: C.textPrimary }}>
            Account Info
          </Text>
          : Your name, email, and password when you register.
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={[styles.paragraph, styles.bullet]}
        >
          •{" "}
          <Text style={{ fontWeight: "bold", color: C.textPrimary }}>
            Financial Data
          </Text>
          : Transactions, budgets, assets, and liabilities you manually log
          inside the App.
        </Text>
        <Text
          variant="body"
          color="secondary"
          style={[styles.paragraph, styles.bullet]}
        >
          •{" "}
          <Text style={{ fontWeight: "bold", color: C.textPrimary }}>
            Preferences
          </Text>
          : Your settings preferences, including whether biometric
          authentication is enabled.
        </Text>

        {/* Section 2 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          2. Biometric & Secure Credentials
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          {"When you enable biometric login (like Face ID or Touch ID), your raw biometric data is processed entirely by your device's operating system security chip (Secure Enclave or Keychain). VaultVoss never has access to, stores, or transmits your actual biometric data. We securely cache your verified email and password credentials in the operating system's secure store (Keychain/KeyStore) via industry-standard encryption for local authentication checks."}
        </Text>

        {/* Section 3 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          3. How We Use Information
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          We use your information to operate the App, calculate your financial
          summaries (such as net worth and budget progress), authenticate your
          logins, and send transactional email notifications. We do not sell,
          rent, or trade your personal or financial data to third-party
          advertisers.
        </Text>

        {/* Section 4 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          4. Security of Data
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          The security of your data is our highest priority. We use
          military-grade encryption standards to transmit your data to our
          secure servers and employ strict security protocols for storage.
          However, please remember that no method of transmission over the
          Internet, or method of electronic storage is 100% secure.
        </Text>

        {/* Section 5 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          5. Your Data Choices
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          You have full control over your data. You can edit or delete any
          logged transactions or assets at any time. You can also permanently
          delete your account and all associated financial records directly from
          the Profile settings screen inside the App.
        </Text>

        {/* Section 6 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          6. Contact Us
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          If you have any questions or suggestions about our Privacy Policy, do
          not hesitate to contact us at{" "}
          <Text style={{ fontWeight: "bold", color: C.accent }}>
            support@matthiasamire.com
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  date: {
    fontFamily: Fonts.sansMedium,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bullet: {
    paddingLeft: 12,
    marginBottom: 8,
  },
});
