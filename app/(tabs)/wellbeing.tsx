import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import { scheduleDailyCheckInReminder } from "@/services/notifications-service";
import {
    fallbackTips,
    submitWellbeingCheckIn,
    subscribeWellbeingTips,
} from "@/services/wellbeing-service";
import { WellbeingTip } from "@/types/models";

const moodLabels: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Low",
  2: "Strained",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export default function WellbeingScreen() {
  const { profile } = useAuth();
  const { colors } = useAppTheme();

  const [tips, setTips] = useState<WellbeingTip[]>([]);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const unsubscribe = subscribeWellbeingTips(
      profile.role,
      setTips,
      (caughtError) => setStatusMessage(caughtError.message),
    );

    return unsubscribe;
  }, [profile]);

  const tipsToRender = useMemo(() => {
    if (tips.length > 0) {
      return tips;
    }

    return fallbackTips.map((tip, index) => ({
      id: `fallback-${index}`,
      ...tip,
      audienceRoles: ["senior", "caregiver", "organization"],
      publishedBy: "system",
    }));
  }, [tips]);

  if (!profile) {
    return (
      <AppScreen title="Wellbeing" subtitle="Loading profile...">
        <SectionCard>
          <AppText tone="muted">
            Please wait while wellbeing tools are prepared.
          </AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  const handleCheckIn = async () => {
    setStatusMessage(null);
    setSaving(true);

    try {
      await submitWellbeingCheckIn(profile, mood, note);
      setNote("");
      setStatusMessage("Check-in sent. Thank you for sharing how you feel.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to submit check-in.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReminder = async () => {
    setStatusMessage(null);

    try {
      const result = await scheduleDailyCheckInReminder(9, 0);

      if (!result) {
        setStatusMessage(
          "Notification permission is needed to schedule reminders.",
        );
        return;
      }

      setStatusMessage("Daily reminder set for 9:00 AM.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to schedule reminder.",
      );
    }
  };

  return (
    <AppScreen
      title="Wellbeing"
      subtitle="Receive helpful tips and complete quick daily emotional check-ins."
    >
      <SectionCard>
        <AppText variant="heading">Daily check-in</AppText>
        <AppText tone="muted" style={styles.inlineHelp}>
          Your check-in helps identify wellbeing trends and flags support
          opportunities early.
        </AppText>

        <View style={styles.moodRow}>
          {(Object.keys(moodLabels) as (keyof typeof moodLabels)[]).map(
            (value) => {
              const numericMood = Number(value) as 1 | 2 | 3 | 4 | 5;
              const active = mood === numericMood;

              return (
                <Pressable
                  key={value}
                  onPress={() => setMood(numericMood)}
                  style={[
                    styles.moodChip,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active
                        ? colors.accentMuted
                        : colors.surface,
                    },
                  ]}
                >
                  <AppText
                    variant="button"
                    tone={active ? "accent" : "primary"}
                  >
                    {value}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {moodLabels[numericMood]}
                  </AppText>
                </Pressable>
              );
            },
          )}
        </View>

        <TextInput
          placeholder="Optional note: what is influencing your mood today?"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.noteInput,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleCheckIn}
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
              {saving ? "Submitting..." : "Submit check-in"}
            </AppText>
          </Pressable>

          <Pressable
            onPress={handleReminder}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            accessibilityRole="button"
          >
            <AppText variant="label" tone="accent">
              Set daily reminder
            </AppText>
          </Pressable>
        </View>

        {statusMessage ? (
          <AppText tone="muted" style={styles.statusMessage}>
            {statusMessage}
          </AppText>
        ) : null}
      </SectionCard>

      {tipsToRender.map((tip) => (
        <SectionCard key={tip.id}>
          <View style={styles.tipHeader}>
            <AppText variant="heading">{tip.title}</AppText>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: colors.accentMuted },
              ]}
            >
              <AppText variant="caption" tone="accent">
                {tip.category.toUpperCase()}
              </AppText>
            </View>
          </View>
          <AppText style={styles.tipBody}>{tip.body}</AppText>
        </SectionCard>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  inlineHelp: {
    marginTop: AppSpacing.xs,
    marginBottom: AppSpacing.sm,
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  moodChip: {
    borderWidth: 1,
    borderRadius: AppRadii.md,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
    minWidth: 72,
    alignItems: "center",
  },
  noteInput: {
    marginTop: AppSpacing.md,
    borderWidth: 1,
    borderRadius: AppRadii.md,
    minHeight: 90,
    textAlignVertical: "top",
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  buttonRow: {
    marginTop: AppSpacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
    alignItems: "center",
  },
  primaryButton: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  statusMessage: {
    marginTop: AppSpacing.sm,
  },
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: AppSpacing.sm,
  },
  categoryBadge: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 4,
  },
  tipBody: {
    marginTop: AppSpacing.sm,
  },
});
