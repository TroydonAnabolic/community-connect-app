import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import {
  createOrOpenConversation,
  subscribeConversationsForUser,
  subscribeDirectoryUsers,
} from "@/services/messaging-service";
import { Conversation, UserProfile } from "@/types/models";
import { formatDateTime } from "@/utils/time";

export default function MessagesScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { colors } = useAppTheme();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<UserProfile[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [openingMemberUid, setOpeningMemberUid] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const unsubscribeConversations = subscribeConversationsForUser(
      profile.uid,
      setConversations,
      (caughtError) =>
        setStatusMessage(`Conversations error: ${caughtError.message}`),
    );

    const unsubscribeDirectory = subscribeDirectoryUsers(
      profile.uid,
      setDirectoryUsers,
      (caughtError) =>
        setStatusMessage(`Directory error: ${caughtError.message}`),
    );

    return () => {
      unsubscribeConversations();
      unsubscribeDirectory();
    };
  }, [profile]);

  const suggestedMembers = useMemo(
    () => directoryUsers.slice(0, 8),
    [directoryUsers],
  );

  if (!profile) {
    return (
      <AppScreen title="Messages" subtitle="Loading profile...">
        <SectionCard>
          <AppText tone="muted">
            Please wait while private messaging loads.
          </AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  const openConversation = (conversationId: string) => {
    alert(`Opening conversation: ${conversationId}`);
    try {
      router.push(`/chat/${conversationId}`);
    } catch (e) {
      // fallback: try window.location for web
      if (typeof window !== "undefined") {
        window.location.href = `/chat/${conversationId}`;
      }
    }
  };

  const handleStartConversation = async (target: UserProfile) => {
    setStatusMessage(null);
    setOpeningMemberUid(target.uid);

    try {
      const conversationId = await createOrOpenConversation(profile, target);
      openConversation(conversationId);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to start conversation.",
      );
    } finally {
      setOpeningMemberUid(null);
    }
  };

  const getPeerName = (conversation: Conversation) => {
    const peerId =
      conversation.memberIds.find((memberId) => memberId !== profile.uid) ??
      profile.uid;
    return conversation.memberNames?.[peerId] ?? "Private conversation";
  };

  return (
    <AppScreen
      title="Private Messages"
      subtitle="One-to-one conversations for support follow-ups and safe communication."
    >
      {statusMessage ? (
        <SectionCard>
          <AppText tone="muted">{statusMessage}</AppText>
        </SectionCard>
      ) : null}

      <SectionCard>
        <AppText variant="heading">Recent conversations</AppText>

        {conversations.length === 0 ? (
          <AppText tone="muted" style={styles.emptyText}>
            No direct messages yet.
          </AppText>
        ) : null}

        {conversations.map((conversation) => (
          <Pressable
            key={conversation.id}
            onPress={() => {
              alert(`Pressed conversation row: ${conversation.id}`);
              openConversation(conversation.id);
            }}
            style={({ pressed }) => [
              styles.rowCard,
              {
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
                backgroundColor: pressed ? "#e0e0e0" : "#fffbe6",
              },
            ]}
            accessibilityRole="button"
          >
            <AppText variant="label">{getPeerName(conversation)}</AppText>
            <AppText variant="caption" tone="muted" numberOfLines={1}>
              {conversation.lastMessagePreview || "Tap to open conversation"}
            </AppText>
            <AppText
              variant="caption"
              tone="muted"
              style={styles.timestampText}
            >
              {conversation.lastMessageAt
                ? formatDateTime(conversation.lastMessageAt)
                : "No messages yet"}
            </AppText>
          </Pressable>
        ))}
      </SectionCard>

      <SectionCard>
        <AppText variant="heading">Start a new conversation</AppText>
        <AppText tone="muted" style={styles.emptyText}>
          Reach out privately to trusted members in your community.
        </AppText>

        {suggestedMembers.length === 0 ? (
          <AppText tone="muted" style={styles.emptyText}>
            No members available to message right now.
          </AppText>
        ) : null}

        {suggestedMembers.map((member) => (
          <Pressable
            key={member.uid}
            onPress={() => {
              alert(`Pressed member row: ${member.uid}`);
              handleStartConversation(member);
            }}
            style={({ pressed }) => [
              styles.memberRow,
              {
                borderColor: colors.border,
                opacity: pressed || openingMemberUid === member.uid ? 0.75 : 1,
                backgroundColor: pressed ? "#e0e0e0" : "#fffbe6",
              },
            ]}
            accessibilityRole="button"
            disabled={openingMemberUid === member.uid}
          >
            <View style={styles.memberInfo}>
              <AppText variant="label">{member.displayName}</AppText>
              <AppText variant="caption" tone="muted">
                {member.role}
              </AppText>
            </View>
            <View
              style={[styles.messageButton, { backgroundColor: colors.accent }]}
            >
              <AppText variant="button" style={styles.messageButtonText}>
                {openingMemberUid === member.uid ? "Opening..." : "Message"}
              </AppText>
            </View>
          </Pressable>
        ))}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    marginTop: AppSpacing.sm,
  },
  rowCard: {
    marginTop: AppSpacing.sm,
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    padding: AppSpacing.sm,
  },
  timestampText: {
    marginTop: 2,
  },
  memberRow: {
    marginTop: AppSpacing.sm,
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    padding: AppSpacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: AppSpacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  messageButton: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
  messageButtonText: {
    color: "#FFFFFF",
  },
});
