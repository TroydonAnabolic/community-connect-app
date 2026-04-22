import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { AppText } from "@/components/app/app-text";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import {
    sendDirectMessage,
    subscribeMessages,
} from "@/services/messaging-service";
import { DirectMessage } from "@/types/models";
import { formatDateTime } from "@/utils/time";

export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{ conversationId: string }>();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const { user, profile } = useAuth();
  const { colors } = useAppTheme();

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const unsubscribe = subscribeMessages(conversationId, setMessages);
    return unsubscribe;
  }, [conversationId]);

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (!profile || !conversationId) {
    return null;
  }

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    setSending(true);

    try {
      await sendDirectMessage(conversationId, profile, draft);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <AppText tone="muted">
              No messages yet. Start the conversation.
            </AppText>
          </View>
        }
        renderItem={({ item }) => {
          const mine = item.senderId === profile.uid;

          return (
            <View
              style={[
                styles.messageBubble,
                {
                  alignSelf: mine ? "flex-end" : "flex-start",
                  backgroundColor: mine ? colors.accent : colors.surface,
                  borderColor: mine ? colors.accent : colors.border,
                },
              ]}
            >
              <AppText
                variant="caption"
                style={{ color: mine ? "#EAF8EF" : colors.textMuted }}
              >
                {mine ? "You" : item.senderName}
              </AppText>
              <AppText style={{ color: mine ? "#FFFFFF" : colors.textPrimary }}>
                {item.text}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: mine ? "#EAF8EF" : colors.textMuted }}
              >
                {formatDateTime(item.createdAt)}
              </AppText>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.composerRow,
          { borderTopColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <TextInput
          accessibilityLabel="Message text"
          placeholder="Write a message..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.background,
            },
          ]}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable
          onPress={handleSend}
          disabled={sending}
          style={[
            styles.sendButton,
            { backgroundColor: colors.accent, opacity: sending ? 0.7 : 1 },
          ]}
        >
          <AppText variant="button" style={styles.sendButtonText}>
            Send
          </AppText>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.md,
    gap: AppSpacing.sm,
  },
  emptyWrap: {
    marginTop: AppSpacing.lg,
    alignItems: "center",
  },
  messageBubble: {
    borderWidth: 1,
    borderRadius: AppRadii.md,
    maxWidth: "85%",
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
    gap: 2,
  },
  composerRow: {
    borderTopWidth: 1,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: AppSpacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: AppRadii.md,
    minHeight: 42,
    maxHeight: 112,
    textAlignVertical: "top",
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: AppSpacing.xs,
  },
  sendButton: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
  },
  sendButtonText: {
    color: "#FFFFFF",
  },
});
