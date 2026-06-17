import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Text } from "@/components/ui/text";
import { C } from "@/constants/colors";
import { Fonts } from "@/constants/theme";
import { useRegister } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const schema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(
        /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        "Password must contain a number or special character",
      ),
    confirm_password: z.string().min(1, "Please confirm your password"),
    referral_code: z.string().optional(),
    terms: z
      .boolean()
      .refine((v) => v === true, {
        message: "You must accept the terms and conditions",
      }),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: met ? C.income : C.border,
        }}
      />
      <Text variant="caption" style={{ color: met ? C.income : C.textMuted }}>
        {label}
      </Text>
    </View>
  );
}

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [apiError, setApiError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      referral_code: "",
      terms: false,
    },
  });

  const watchedPassword = watch("password", "");
  const passwordRules = [
    { met: watchedPassword.length >= 8, label: "At least 8 characters" },
    { met: /[A-Z]/.test(watchedPassword), label: "One uppercase letter" },
    {
      met: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(watchedPassword),
      label: "One number or special character",
    },
  ];

  const onSubmit = ({ full_name, email, password }: FormValues) => {
    setApiError(null);
    registerMutation.mutate(
      { full_name, email, password },
      { onError: (err) => setApiError(err.message) },
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        paddingBottom: insets.bottom || 24,
      }}
    >
      <View style={{ height: insets.top + 16 }} />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 24,
            gap: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 4, marginBottom: 4 }}>
            <Text variant="title" color="primary">
              Create Account
            </Text>
            <Text variant="body" color="secondary">
              Start your journey to financial mastery
            </Text>
          </View>

          {apiError ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.expense,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: C.expenseDim,
              }}
            >
              <Text variant="caption" color="danger">
                {apiError}
              </Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                autoCapitalize="words"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.full_name?.message}
                leadingIcon={
                  <IconSymbol name="person" size={18} color={C.textSecondary} />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leadingIcon={
                  <IconSymbol
                    name="envelope"
                    size={18}
                    color={C.textSecondary}
                  />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Create a strong password"
                password
                returnKeyType="next"
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leadingIcon={
                  <IconSymbol name="lock" size={18} color={C.textSecondary} />
                }
              />
            )}
          />

          {watchedPassword.length > 0 ? (
            <View
              style={{
                borderRadius: 12,
                gap: 8,
                padding: 14,
                backgroundColor: C.bgCard,
                borderWidth: 1,
                borderColor: C.border,
                marginTop: -4,
              }}
            >
              {passwordRules.map((r) => (
                <PasswordRule key={r.label} met={r.met} label={r.label} />
              ))}
            </View>
          ) : null}

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm Password"
                placeholder="Repeat your password"
                password
                returnKeyType="next"
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirm_password?.message}
                leadingIcon={
                  <IconSymbol
                    name="lock.shield"
                    size={18}
                    color={C.textSecondary}
                  />
                }
              />
            )}
          />

          {/* <Controller control={control} name='referral_code'
            render={({field: {onChange, onBlur, value}}) => (
              <Input label='Referral Code (optional)' placeholder='Enter a referral code' autoCapitalize='characters' returnKeyType='done'
                value={value} onChangeText={onChange} onBlur={onBlur}
                leadingIcon={<IconSymbol name='gift' size={18} color={C.textSecondary} />}
              />
            )}
          /> */}

          <Controller
            control={control}
            name="terms"
            render={({ field: { onChange, value } }) => (
              <Checkbox
                checked={value}
                onToggle={() => onChange(!value)}
                error={errors.terms?.message}
                label={
                  <Text variant="caption" color="secondary">
                    I agree to the{" "}
                    <Text
                      variant="caption"
                      style={{
                        color: C.accent,
                        fontFamily: Fonts.sansSemiBold,
                      }}
                    >
                      Terms of Service
                    </Text>{" "}
                    and{" "}
                    <Text
                      variant="caption"
                      style={{
                        color: C.accent,
                        fontFamily: Fonts.sansSemiBold,
                      }}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                }
              />
            )}
          />

          {/* Primary Action: Create Account */}
          <View style={{ marginTop: 12 }}>
            <Button
              label={
                registerMutation.isPending
                  ? "Creating account…"
                  : "Create Account"
              }
              variant="primary"
              size="lg"
              loading={registerMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          {/* Helper Navigation Link */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/login");
            }}
            activeOpacity={0.7}
            style={{
              alignItems: "center",
              paddingVertical: 12,
            }}
            hitSlop={8}
          >
            <Text variant="body" color="secondary">
              Already have an account?{" "}
              <Text
                variant="body"
                style={{ color: C.accent, fontFamily: Fonts.sansSemiBold }}
              >
                Log in
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingOverlay
        visible={registerMutation.isPending}
        message="Creating account..."
      />
    </View>
  );
}
