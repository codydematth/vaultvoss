import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useToast } from "@/components/ui/toast";
import { C } from "@/constants/colors";
import { useMe } from "@/hooks/use-auth";
import { authApi, usersApi } from "@/lib/api/auth";
import { getApiError } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, refreshUser, clearSession } = useAuthContext();
  const { data: me } = useMe();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Permission to access the camera roll is required to update your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      setProfileError("Full name is required");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProfileLoading(true);
    setProfileError(null);
    try {
      if (selectedImageUri) {
        const formData = new FormData();
        formData.append("full_name", fullName.trim());
        if (email.trim()) {
          formData.append("email", email.trim());
        }

        const filename = selectedImageUri.split("/").pop() || "avatar.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("profile_image", {
          uri:
            Platform.OS === "ios"
              ? selectedImageUri.replace("file://", "")
              : selectedImageUri,
          name: filename,
          type,
        } as any);

        await usersApi.updateMe(formData);
      } else {
        await usersApi.updateMe({
          full_name: fullName.trim(),
          email: email.trim() || undefined,
        });
      }

      await refreshUser();
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ message: "Profile updated successfully", type: "success" });
      setSelectedImageUri(null);
    } catch (err) {
      setProfileError(getApiError(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      setPwError("Both fields are required");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPwLoading(true);
    setPwError(null);
    try {
      const { data } = await authApi.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });
      if (data.hasError) throw new Error(data.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({ message: "Password changed successfully", type: "success" });
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      setPwError(getApiError(err));
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (user?.id) {
              try {
                await usersApi.deleteById(user.id);
              } catch {}
            }
            await clearSession();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          paddingTop: insets.top + 16,
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
          Profile
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            gap: 24,
          }}
        >
          {/* Avatar */}
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <Pressable
              onPress={handlePickImage}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                position: "relative",
              })}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: C.accentDim,
                  borderWidth: 2,
                  borderColor: C.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {selectedImageUri || user?.profile_image_url ? (
                  <Image
                    source={{
                      uri: selectedImageUri || user?.profile_image_url || "",
                    }}
                    style={{ width: 80, height: 80 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text variant="heading" color="accent">
                    {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: C.accent,
                  borderWidth: 2,
                  borderColor: C.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconSymbol name="camera" size={12} color={C.textInverse} />
              </View>
            </Pressable>
            <Text
              variant="subheading"
              color="primary"
              style={{ marginTop: 12 }}
            >
              {user?.full_name}
            </Text>
            <Text variant="caption" color="secondary">
              {user?.email}
            </Text>
          </View>

          {/* Edit profile */}
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
            <Text variant="subheading" color="primary">
              Edit Profile
            </Text>
            <Input
              label="Full Name"
              placeholder="Your name"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              returnKeyType="next"
            />
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="done"
            />
            {profileError ? (
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
                  {profileError}
                </Text>
              </View>
            ) : null}
            <Button
              label={profileLoading ? "Updating…" : "Update Profile"}
              variant="primary"
              size="md"
              loading={profileLoading}
              onPress={handleUpdateProfile}
            />
          </View>

          {/* Change password */}
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
            <Text variant="subheading" color="primary">
              Change Password
            </Text>
            <Input
              label="Current Password"
              placeholder="Current password"
              password
              value={currentPw}
              onChangeText={setCurrentPw}
              returnKeyType="next"
            />
            <Input
              label="New Password"
              placeholder="Min 8 characters"
              password
              value={newPw}
              onChangeText={setNewPw}
              returnKeyType="done"
              onSubmitEditing={handleChangePassword}
            />
            {pwError ? (
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
                  {pwError}
                </Text>
              </View>
            ) : null}
            <Button
              label={pwLoading ? "Changing…" : "Change Password"}
              variant="primary"
              size="md"
              loading={pwLoading}
              onPress={handleChangePassword}
            />
          </View>

          {/* Danger zone */}
          <View
            style={{
              backgroundColor: C.expenseDim,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: `${C.expense}44`,
              padding: 20,
              gap: 12,
            }}
          >
            <Text variant="subheading" style={{ color: C.expense }}>
              Danger Zone
            </Text>
            <Text variant="body" color="secondary">
              Permanently delete your account and all associated data.
            </Text>
            <Button
              label="Delete Account"
              variant="destructive"
              size="md"
              onPress={handleDeleteAccount}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
