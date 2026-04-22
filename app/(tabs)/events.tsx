import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import {
    addEventToCalendar,
    getUserEventRsvpStatus,
    respondToEvent,
    subscribeEvents,
} from "@/services/events-service";
import { CommunityEvent, RsvpStatus } from "@/types/models";
import { formatDateTime } from "@/utils/time";

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "yes", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "Cannot" },
];

export default function EventsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useAppTheme();

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [rsvpByEvent, setRsvpByEvent] = useState<
    Record<string, RsvpStatus | null>
  >({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeEvents(setEvents, (caughtError) =>
      setStatusMessage(caughtError.message),
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!profile || events.length === 0) {
      setRsvpByEvent({});
      return;
    }

    let cancelled = false;

    const loadStatuses = async () => {
      const entries = await Promise.all(
        events.map(async (event) => {
          const status = await getUserEventRsvpStatus(event.id, profile.uid);
          return [event.id, status] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      setRsvpByEvent(Object.fromEntries(entries));
    };

    loadStatuses().catch((error) => {
      if (!cancelled) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Unable to load RSVP status.",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [events, profile]);

  if (!profile) {
    return (
      <AppScreen title="Events" subtitle="Loading your profile...">
        <SectionCard>
          <AppText tone="muted">
            Please wait while we prepare event access.
          </AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  const handleRsvp = async (event: CommunityEvent, status: RsvpStatus) => {
    setStatusMessage(null);

    try {
      await respondToEvent(event.id, profile, status);
      setRsvpByEvent((current) => ({
        ...current,
        [event.id]: status,
      }));
      setStatusMessage("RSVP updated.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to update RSVP.",
      );
    }
  };

  const handleAddCalendar = async (event: CommunityEvent) => {
    setStatusMessage(null);

    try {
      await addEventToCalendar(event);
      setStatusMessage("Event added to your device calendar.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to add to calendar.",
      );
    }
  };

  return (
    <AppScreen
      title="Events & Meetups"
      subtitle="Create social and wellbeing activities, then track RSVPs in real time."
      headerRight={
        <Pressable
          onPress={() => router.push("/create-event")}
          style={[styles.headerButton, { backgroundColor: colors.accent }]}
        >
          <AppText variant="button" style={styles.headerButtonText}>
            Create
          </AppText>
        </Pressable>
      }
    >
      {statusMessage ? (
        <SectionCard>
          <AppText tone="muted">{statusMessage}</AppText>
        </SectionCard>
      ) : null}

      {events.length === 0 ? (
        <SectionCard>
          <AppText tone="muted">
            No events yet. Create the first event for your local community.
          </AppText>
        </SectionCard>
      ) : null}

      {events.map((event) => {
        const selected = rsvpByEvent[event.id];

        return (
          <SectionCard key={event.id}>
            <AppText variant="heading">{event.title}</AppText>
            <AppText tone="muted" style={styles.timeText}>
              {formatDateTime(event.startsAt)} - {formatDateTime(event.endsAt)}
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.organizer}>
              Hosted by {event.createdByName}
            </AppText>
            <AppText style={styles.description}>
              {event.description || "No description provided."}
            </AppText>
            <AppText variant="caption" tone="muted" style={styles.location}>
              Location: {event.location || "To be confirmed"}
            </AppText>

            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map((option) => {
                const active = selected === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleRsvp(event, option.value)}
                    style={[
                      styles.rsvpButton,
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
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="caption" tone="muted" style={styles.countsText}>
              RSVP counts: Going {event.rsvpCounts?.yes ?? 0} | Maybe{" "}
              {event.rsvpCounts?.maybe ?? 0} | Cannot{" "}
              {event.rsvpCounts?.no ?? 0}
            </AppText>

            <Pressable
              onPress={() => handleAddCalendar(event)}
              style={[styles.calendarButton, { borderColor: colors.border }]}
              accessibilityRole="button"
            >
              <AppText variant="label" tone="accent">
                Add to my calendar
              </AppText>
            </Pressable>
          </SectionCard>
        );
      })}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
  headerButtonText: {
    color: "#FFFFFF",
  },
  timeText: {
    marginTop: AppSpacing.xs,
  },
  organizer: {
    marginTop: 2,
  },
  description: {
    marginTop: AppSpacing.sm,
  },
  location: {
    marginTop: AppSpacing.xs,
  },
  rsvpRow: {
    marginTop: AppSpacing.md,
    flexDirection: "row",
    gap: AppSpacing.sm,
    flexWrap: "wrap",
  },
  rsvpButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
  countsText: {
    marginTop: AppSpacing.sm,
  },
  calendarButton: {
    marginTop: AppSpacing.sm,
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
    alignSelf: "flex-start",
  },
});
