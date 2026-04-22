import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import { createEvent } from "@/services/events-service";

function toDateText(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toTimeText(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { colors } = useAppTheme();

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateText, setDateText] = useState(toDateText(defaultStart));
  const [timeText, setTimeText] = useState(toTimeText(defaultStart));
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (!profile) {
    return null;
  }

  const handleCreate = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Please provide an event title.");
      return;
    }

    const startsAt = new Date(`${dateText}T${timeText}:00`);

    if (Number.isNaN(startsAt.getTime())) {
      setError("Date or time format is invalid. Use YYYY-MM-DD and HH:MM.");
      return;
    }

    const duration = Number(durationMinutes);

    if (!Number.isFinite(duration) || duration < 15) {
      setError("Duration must be at least 15 minutes.");
      return;
    }

    const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

    setSaving(true);

    try {
      await createEvent(profile, {
        title,
        description,
        location,
        startsAt,
        endsAt,
      });

      router.back();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create event.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      title="Create event"
      subtitle="Set up a local activity in under a minute."
    >
      <SectionCard>
        <TextInput
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          placeholder="Description"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.input,
            styles.multiline,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          placeholder="Location"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <AppText variant="caption" tone="muted" style={styles.inputLabel}>
              Date (YYYY-MM-DD)
            </AppText>
            <TextInput
              placeholder="2026-04-22"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
              value={dateText}
              onChangeText={setDateText}
            />
          </View>

          <View style={styles.halfWidth}>
            <AppText variant="caption" tone="muted" style={styles.inputLabel}>
              Start time (HH:MM)
            </AppText>
            <TextInput
              placeholder="14:30"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
              value={timeText}
              onChangeText={setTimeText}
            />
          </View>
        </View>

        <AppText variant="caption" tone="muted" style={styles.inputLabel}>
          Duration (minutes)
        </AppText>
        <TextInput
          keyboardType="numeric"
          placeholder="60"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={durationMinutes}
          onChangeText={setDurationMinutes}
        />

        {error ? (
          <AppText tone="danger" style={styles.errorText}>
            {error}
          </AppText>
        ) : null}

        <Pressable
          onPress={handleCreate}
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
            {saving ? "Creating..." : "Create event"}
          </AppText>
        </Pressable>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    marginBottom: AppSpacing.sm,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: AppSpacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: AppSpacing.xs,
  },
  errorText: {
    marginTop: AppSpacing.xs,
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
});
