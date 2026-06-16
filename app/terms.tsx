import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";

export default function TermsScreen() {
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
          Terms of Service
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
          {'Welcome to VaultVoss. Please read these Terms of Service ("Terms") carefully before using our mobile application ("App") operated by VaultVoss Inc. ("us", "we", or "our").'}
        </Text>

        {/* Section 1 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          1. Agreement to Terms
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          By accessing or using our App, you agree to be bound by these Terms
          and our Privacy Policy. If you disagree with any part of the terms,
          you may not access the App.
        </Text>

        {/* Section 2 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          2. Account Creation & Security
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          To access the full features of the App, you must register for an
          account. You are responsible for safeguarding your password and
          account details, including any biometric login credentials (like Face
          ID) configured on your device. We are not liable for unauthorized
          access resulting from your failure to secure your account.
        </Text>

        {/* Section 3 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          3. Expense Tracking & Financial Data
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          VaultVoss is a private, secure expense tracking utility. The data you
          input (such as bank balances, transactions, and net worth) is stored
          securely. We do not provide professional financial, tax, or investment
          advice. The financial analytics provided by the App are for
          informational and convenience purposes only.
        </Text>

        {/* Section 4 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          4. Prohibited Uses
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          You agree not to use the App for any illegal or unauthorized purpose.
          You must not attempt to breach or circumvent the security mechanisms,
          reverse engineer the App, or transmit any malware or destructive code.
        </Text>

        {/* Section 5 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          5. Limitation of Liability
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          To the maximum extent permitted by applicable law, in no event shall
          VaultVoss Inc. be liable for any indirect, punitive, incidental,
          special, consequential, or exemplary damages, including without
          limitation damages for loss of profits, data, or other intangible
          losses, arising out of or relating to the use of, or inability to use,
          this App.
        </Text>

        {/* Section 6 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          6. Changes to Terms
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          We reserve the right, at our sole discretion, to modify or replace
          these Terms at any time. If a revision is material, we will provide
          notice prior to any new terms taking effect. By continuing to access
          our App after those revisions become effective, you agree to be bound
          by the revised terms.
        </Text>

        {/* Section 7 */}
        <Text variant="subheading" color="primary" style={styles.sectionTitle}>
          7. Contact Us
        </Text>
        <Text variant="body" color="secondary" style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at{" "}
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
});
