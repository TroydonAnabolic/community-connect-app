import { Redirect } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { LoadingScreen } from "@/components/app/loading-screen";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import { UserRole } from "@/types/models";

const roleOptions: {
  value: Exclude<UserRole, "admin">;
  label: string;
  description: string;
}[] = [
  {
    value: "senior",
    label: "Senior",
    description: "Older adult using community features",
  },
  {
    value: "caregiver",
    label: "Caregiver",
    description: "Family or support person",
  },
  {
    value: "organization",
    label: "Organisation",
    description: "Local service provider",
  },
];

const textScaleOptions = [
  { label: "Standard", value: 1 },
  { label: "Large", value: 1.2 },
  { label: "XL", value: 1.35 },
] as const;

export default function AuthScreen() {
  const { user, loading, signIn, signUp } = useAuth();
  const { colors } = useAppTheme();

  const [isSignUp, setIsSignUp] = useState(true);
  const [displayName, setDisplayName] = useState("Troydon");
  const [email, setEmail] = useState("troyincarnate@gmail.com");
  const [password, setPassword] = useState("Password123!");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("senior");
  const [fontScale, setFontScale] =
    useState<(typeof textScaleOptions)[number]["value"]>(1.2);
  const [highContrast, setHighContrast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <LoadingScreen message="Checking your account..." />;
  }

  if (user) {
    return <Redirect href="/(tabs)/community" />;
  }

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and password.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setError("Please add your display name for your profile.");
      return;
    }

    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp({
          email,
          password,
          displayName,
          role,
          accessibility: {
            fontScale,
            highContrast,
          },
        });
      } else {
        await signIn(email, password);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to continue.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppScreen
        title="Community Connect"
        subtitle="Inclusive community support for seniors, caregivers, and local organisations."
      >
        <SectionCard>
          <AppText variant="heading">
            {isSignUp ? "Quick onboarding" : "Welcome back"}
          </AppText>
          <AppText tone="muted" style={styles.sectionIntro}>
            {isSignUp
              ? "Create your account in under a minute with accessibility preferences ready from day one."
              : "Sign in to continue with discussions, events, and private messages."}
          </AppText>

          {isSignUp ? (
            <TextInput
              accessibilityLabel="Display name"
              autoCapitalize="words"
              placeholder="Display name"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
            />
          ) : null}

          <TextInput
            accessibilityLabel="Email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              },
            ]}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            accessibilityLabel="Password"
            autoComplete="password"
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              },
            ]}
            value={password}
            onChangeText={setPassword}
          />

          {isSignUp ? (
            <View style={styles.blockSection}>
              <AppText variant="label">I am joining as</AppText>
              <View style={styles.rowWrap}>
                {roleOptions.map((option) => {
                  const active = role === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setRole(option.value)}
                      style={[
                        styles.selectCard,
                        {
                          borderColor: active ? colors.accent : colors.border,
                          backgroundColor: active
                            ? colors.accentMuted
                            : colors.surface,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        tone={active ? "accent" : "primary"}
                      >
                        {option.label}
                      </AppText>
                      <AppText
                        variant="caption"
                        tone="muted"
                        style={styles.optionDescription}
                      >
                        {option.description}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <AppText variant="label" style={styles.labelTop}>
                Preferred text size
              </AppText>
              <View style={styles.inlineButtons}>
                {textScaleOptions.map((option) => {
                  const active = fontScale === option.value;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => setFontScale(option.value)}
                      style={[
                        styles.inlineButton,
                        {
                          backgroundColor: active
                            ? colors.accent
                            : colors.surface,
                          borderColor: active ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="button"
                        style={{
                          color: active ? "#FFFFFF" : colors.textPrimary,
                        }}
                      >
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <AppText variant="label">High contrast mode</AppText>
                  <AppText variant="caption" tone="muted">
                    Strong contrast for improved readability.
                  </AppText>
                </View>
                <Switch
                  accessibilityLabel="Enable high contrast"
                  value={highContrast}
                  onValueChange={setHighContrast}
                  trackColor={{ false: "#C8D8CC", true: colors.accent }}
                />
              </View>
            </View>
          ) : null}

          {error ? (
            <AppText tone="danger" style={styles.errorText}>
              {error}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={handleSubmit}
            style={[
              styles.primaryButton,
              { backgroundColor: colors.accent, opacity: submitting ? 0.7 : 1 },
            ]}
          >
            <AppText variant="button" style={styles.primaryButtonText}>
              {submitting
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => {
              setError(null);
              setIsSignUp((current) => !current);
            }}
            style={styles.modeSwitchButton}
          >
            <AppText tone="accent">
              {isSignUp
                ? "Already registered? Sign in"
                : "Need an account? Start onboarding"}
            </AppText>
          </Pressable>
        </SectionCard>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  sectionIntro: {
    marginTop: AppSpacing.xs,
    marginBottom: AppSpacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    marginBottom: AppSpacing.sm,
  },
  blockSection: {
    marginTop: AppSpacing.sm,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
    marginTop: AppSpacing.sm,
  },
  selectCard: {
    borderWidth: 1,
    borderRadius: AppRadii.md,
    padding: AppSpacing.sm,
    flexBasis: "48%",
    minHeight: 94,
  },
  optionDescription: {
    marginTop: AppSpacing.xs,
  },
  labelTop: {
    marginTop: AppSpacing.md,
  },
  inlineButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
    marginTop: AppSpacing.sm,
  },
  inlineButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingVertical: AppSpacing.xs,
    paddingHorizontal: AppSpacing.md,
  },
  switchRow: {
    marginTop: AppSpacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: AppSpacing.md,
  },
  switchTextWrap: {
    flex: 1,
  },
  errorText: {
    marginTop: AppSpacing.sm,
  },
  primaryButton: {
    marginTop: AppSpacing.md,
    borderRadius: AppRadii.pill,
    paddingVertical: AppSpacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  modeSwitchButton: {
    marginTop: AppSpacing.md,
    alignItems: "center",
  },
});
