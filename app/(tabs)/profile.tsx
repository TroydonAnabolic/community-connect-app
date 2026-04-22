import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";

const fontScaleChoices = [
  { label: "Standard", value: 1 },
  { label: "Large", value: 1.2 },
  { label: "XL", value: 1.35 },
] as const;

export default function ProfileScreen() {
  const { profile, signOutUser, updateAccessibility, refreshPushToken } =
    useAuth();
  const { colors } = useAppTheme();

  const [fontScale, setFontScale] =
    useState<(typeof fontScaleChoices)[number]["value"]>(1.2);
  const [highContrast, setHighContrast] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFontScale(
      (profile.accessibility
        .fontScale as (typeof fontScaleChoices)[number]["value"]) ?? 1,
    );
    setHighContrast(profile.accessibility.highContrast ?? false);
  }, [profile]);

  if (!profile) {
    return (
      <AppScreen title="Profile" subtitle="Loading profile...">
        <SectionCard>
          <AppText tone="muted">Please wait while profile data loads.</AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  const handleSaveAccessibility = async () => {
    setStatusMessage(null);
    setSaving(true);

    try {
      await updateAccessibility({
        fontScale,
        highContrast,
      });
      setStatusMessage("Accessibility settings saved.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePushRefresh = async () => {
    setStatusMessage(null);

    try {
      await refreshPushToken();
      setStatusMessage("Notification token refreshed.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to refresh notifications.",
      );
    }
  };

  return (
    <AppScreen
      title="Profile"
      subtitle="Manage accessibility preferences and account settings."
    >
      <SectionCard>
        <AppText variant="heading">Account details</AppText>
        <AppText style={styles.detailText}>{profile.displayName}</AppText>
        <AppText tone="muted">{profile.email}</AppText>
        <AppText variant="caption" tone="muted" style={styles.roleBadge}>
          Role: {profile.role}
        </AppText>
      </SectionCard>

      <SectionCard>
        <AppText variant="heading">Accessibility</AppText>
        <AppText tone="muted" style={styles.inlineHelp}>
          Choose the text size and contrast mode that are easiest for you to
          read.
        </AppText>

        <View style={styles.inlineButtons}>
          {fontScaleChoices.map((choice) => {
            const active = fontScale === choice.value;
            return (
              <Pressable
                key={choice.label}
                onPress={() => setFontScale(choice.value)}
                style={[
                  styles.inlineButton,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <AppText
                  variant="button"
                  style={{ color: active ? "#FFFFFF" : colors.textPrimary }}
                >
                  {choice.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <AppText variant="label">High contrast mode</AppText>
            <AppText variant="caption" tone="muted">
              Increases contrast for readability.
            </AppText>
          </View>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ false: "#C8D8CC", true: colors.accent }}
          />
        </View>

        <Pressable
          onPress={handleSaveAccessibility}
          disabled={saving}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.accent,
              opacity: saving ? 0.7 : 1,
            },
          ]}
        >
          <AppText variant="button" style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Save accessibility settings"}
          </AppText>
        </Pressable>
      </SectionCard>

      <SectionCard>
        <AppText variant="heading">Notifications</AppText>
        <Pressable
          onPress={handlePushRefresh}
          style={[styles.secondaryButton, { borderColor: colors.border }]}
        >
          <AppText variant="label" tone="accent">
            Refresh notification permissions
          </AppText>
        </Pressable>
      </SectionCard>

      <SectionCard>
        <Pressable
          onPress={signOutUser}
          style={[styles.dangerButton, { backgroundColor: colors.danger }]}
        >
          <AppText variant="button" style={styles.primaryButtonText}>
            Sign out
          </AppText>
        </Pressable>
      </SectionCard>

      {statusMessage ? (
        <SectionCard>
          <AppText tone="muted">{statusMessage}</AppText>
        </SectionCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  detailText: {
    marginTop: AppSpacing.sm,
  },
  roleBadge: {
    marginTop: AppSpacing.xs,
  },
  inlineHelp: {
    marginTop: AppSpacing.xs,
  },
  inlineButtons: {
    marginTop: AppSpacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  inlineButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
  switchRow: {
    marginTop: AppSpacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: AppSpacing.md,
  },
  switchText: {
    flex: 1,
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
  secondaryButton: {
    marginTop: AppSpacing.sm,
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    alignSelf: "flex-start",
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  dangerButton: {
    borderRadius: AppRadii.pill,
    paddingVertical: AppSpacing.sm,
    alignItems: "center",
  },
});
