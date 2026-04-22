import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import {
    createDiscussionPost,
    flagDiscussionPost,
    subscribeDiscussionPosts,
} from "@/services/community-service";
import { DiscussionPost } from "@/types/models";
import { formatDateTime } from "@/utils/time";

export default function CommunityScreen() {
  const { profile } = useAuth();
  const { colors } = useAppTheme();

  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeDiscussionPosts(setPosts, (caughtError) =>
      setError(caughtError.message),
    );

    return unsubscribe;
  }, []);

  if (!profile) {
    return (
      <AppScreen title="Community" subtitle="Discussion space loading...">
        <SectionCard>
          <AppText tone="muted">
            Please wait while we load your member profile.
          </AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  const isAdmin = profile.role === "admin";

  const visiblePosts = posts.filter(
    (post) => !post.isFlagged || isAdmin || post.authorId === profile.uid,
  );

  const handleCreatePost = async () => {
    setError(null);

    if (!draft.trim()) {
      setError("Write a message before posting.");
      return;
    }

    setSubmitting(true);

    try {
      await createDiscussionPost(profile, draft);
      setDraft("");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to post right now.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFlagPost = async (postId: string) => {
    try {
      await flagDiscussionPost(postId, profile.uid);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to flag this post.";
      setError(message);
    }
  };

  return (
    <AppScreen
      title="Community Circle"
      subtitle="Safe local discussion for seniors, caregivers, and organisations."
    >
      <SectionCard>
        <AppText variant="heading">Start a discussion</AppText>
        <AppText tone="muted" style={styles.inlineHelp}>
          Posts are automatically screened for unsafe language and can be
          flagged for moderation.
        </AppText>
        <TextInput
          accessibilityLabel="New discussion post"
          multiline
          placeholder="Share an update, ask for help, or post a local opportunity..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.postInput,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={draft}
          onChangeText={setDraft}
        />
        {error ? (
          <AppText tone="danger" style={styles.errorText}>
            {error}
          </AppText>
        ) : null}
        <Pressable
          onPress={handleCreatePost}
          disabled={submitting}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.accent,
              opacity: submitting ? 0.7 : 1,
            },
          ]}
        >
          <AppText variant="button" style={styles.primaryButtonText}>
            {submitting ? "Posting..." : "Post to community"}
          </AppText>
        </Pressable>
      </SectionCard>

      {visiblePosts.length === 0 ? (
        <SectionCard>
          <AppText tone="muted">
            No discussions yet. Be the first to welcome people into the
            community.
          </AppText>
        </SectionCard>
      ) : null}

      {visiblePosts.map((post) => (
        <SectionCard key={post.id}>
          <View style={styles.postHeader}>
            <View style={styles.authorWrap}>
              <AppText variant="label">{post.authorName}</AppText>
              <AppText variant="caption" tone="muted">
                {formatDateTime(post.createdAt)}
              </AppText>
            </View>
            {!post.isFlagged ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleFlagPost(post.id)}
                style={[styles.flagButton, { borderColor: colors.border }]}
              >
                <AppText variant="caption" tone="muted">
                  Flag
                </AppText>
              </Pressable>
            ) : (
              <View
                style={[styles.flaggedBadge, { backgroundColor: "#F7E0DB" }]}
              >
                <AppText variant="caption" tone="danger">
                  Under review
                </AppText>
              </View>
            )}
          </View>

          <AppText style={styles.postBody}>{post.body}</AppText>

          {post.isFlagged && post.moderationReason ? (
            <AppText
              variant="caption"
              tone="danger"
              style={styles.moderationReason}
            >
              {post.moderationReason}
            </AppText>
          ) : null}
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
  postInput: {
    borderWidth: 1,
    borderRadius: AppRadii.md,
    minHeight: 110,
    textAlignVertical: "top",
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
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
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: AppSpacing.md,
  },
  authorWrap: {
    flex: 1,
  },
  flagButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 4,
  },
  flaggedBadge: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.sm,
    paddingVertical: 4,
  },
  postBody: {
    marginTop: AppSpacing.sm,
  },
  moderationReason: {
    marginTop: AppSpacing.sm,
  },
});
