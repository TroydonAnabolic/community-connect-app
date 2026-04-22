import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppScreen } from "@/components/app/app-screen";
import { AppText } from "@/components/app/app-text";
import { SectionCard } from "@/components/app/section-card";
import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";
import {
    fetchEngagementStats,
    subscribeFlaggedPosts,
} from "@/services/admin-service";
import {
    clearPostFlag,
    deleteDiscussionPost,
} from "@/services/community-service";
import { publishWellbeingTip } from "@/services/wellbeing-service";
import { DiscussionPost, EngagementStats } from "@/types/models";
import { formatDateTime } from "@/utils/time";

type TipCategory = "safety" | "social" | "health";
type AudienceRole = "senior" | "caregiver" | "organization";

const audienceOptions: AudienceRole[] = ["senior", "caregiver", "organization"];

const emptyStats: EngagementStats = {
  users: 0,
  posts: 0,
  events: 0,
  conversations: 0,
  checkIns: 0,
};

export default function AdminScreen() {
  const { profile } = useAuth();
  const { colors } = useAppTheme();

  const [flaggedPosts, setFlaggedPosts] = useState<DiscussionPost[]>([]);
  const [stats, setStats] = useState<EngagementStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [tipTitle, setTipTitle] = useState("");
  const [tipBody, setTipBody] = useState("");
  const [tipCategory, setTipCategory] = useState<TipCategory>("safety");
  const [tipAudience, setTipAudience] = useState<AudienceRole[]>([
    ...audienceOptions,
  ]);
  const [publishing, setPublishing] = useState(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const unsubscribe = subscribeFlaggedPosts(setFlaggedPosts, (error) =>
      setStatusMessage(error.message),
    );

    return unsubscribe;
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    setStatsLoading(true);

    fetchEngagementStats()
      .then((nextStats) => {
        setStats(nextStats);
      })
      .catch((error) => {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Unable to load engagement stats.",
        );
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [isAdmin]);

  const activeCategoryLabel = useMemo(
    () => tipCategory.toUpperCase(),
    [tipCategory],
  );

  if (!profile) {
    return (
      <AppScreen title="Admin" subtitle="Loading profile...">
        <SectionCard>
          <AppText tone="muted">
            Please wait while admin access is checked.
          </AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  if (!isAdmin) {
    return (
      <AppScreen title="Admin" subtitle="Moderation and analytics panel">
        <SectionCard>
          <AppText tone="muted">
            This area is restricted to admin accounts. Ask an administrator to
            assign your role.
          </AppText>
        </SectionCard>
      </AppScreen>
    );
  }

  const refreshStats = async () => {
    setStatusMessage(null);
    setStatsLoading(true);

    try {
      const nextStats = await fetchEngagementStats();
      setStats(nextStats);
      setStatusMessage("Stats refreshed.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to refresh stats.",
      );
    } finally {
      setStatsLoading(false);
    }
  };

  const toggleAudience = (role: AudienceRole) => {
    setTipAudience((current) => {
      if (current.includes(role)) {
        return current.filter((entry) => entry !== role);
      }

      return [...current, role];
    });
  };

  const handlePublishTip = async () => {
    setStatusMessage(null);

    if (!tipTitle.trim() || !tipBody.trim()) {
      setStatusMessage("Tip title and body are both required.");
      return;
    }

    if (tipAudience.length === 0) {
      setStatusMessage("Select at least one audience role.");
      return;
    }

    setPublishing(true);

    try {
      await publishWellbeingTip(profile, {
        title: tipTitle,
        body: tipBody,
        category: tipCategory,
        audienceRoles: tipAudience,
      });

      setTipTitle("");
      setTipBody("");
      setTipCategory("safety");
      setTipAudience([...audienceOptions]);
      setStatusMessage("Wellbeing tip published successfully.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to publish tip.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleClearFlag = async (postId: string) => {
    try {
      await clearPostFlag(postId);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to clear flag.",
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDiscussionPost(postId);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Unable to delete post.",
      );
    }
  };

  return (
    <AppScreen
      title="Admin Console"
      subtitle="Moderate content and monitor engagement health."
    >
      <SectionCard>
        <View style={styles.statsHeader}>
          <AppText variant="heading">Engagement snapshot</AppText>
          <Pressable
            onPress={refreshStats}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            accessibilityRole="button"
          >
            <AppText variant="label" tone="accent">
              {statsLoading ? "Refreshing..." : "Refresh"}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statTile, { borderColor: colors.border }]}>
            <AppText variant="heading">{stats.users}</AppText>
            <AppText variant="caption" tone="muted">
              users
            </AppText>
          </View>
          <View style={[styles.statTile, { borderColor: colors.border }]}>
            <AppText variant="heading">{stats.posts}</AppText>
            <AppText variant="caption" tone="muted">
              posts
            </AppText>
          </View>
          <View style={[styles.statTile, { borderColor: colors.border }]}>
            <AppText variant="heading">{stats.events}</AppText>
            <AppText variant="caption" tone="muted">
              events
            </AppText>
          </View>
          <View style={[styles.statTile, { borderColor: colors.border }]}>
            <AppText variant="heading">{stats.conversations}</AppText>
            <AppText variant="caption" tone="muted">
              chats
            </AppText>
          </View>
          <View style={[styles.statTile, { borderColor: colors.border }]}>
            <AppText variant="heading">{stats.checkIns}</AppText>
            <AppText variant="caption" tone="muted">
              check-ins
            </AppText>
          </View>
        </View>
      </SectionCard>

      <SectionCard>
        <AppText variant="heading">Publish wellbeing tip</AppText>
        <AppText variant="caption" tone="muted" style={styles.categoryText}>
          Category: {activeCategoryLabel}
        </AppText>

        <View style={styles.categoryRow}>
          {(["safety", "social", "health"] as TipCategory[]).map((category) => {
            const active = tipCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setTipCategory(category)}
                style={[
                  styles.categoryButton,
                  {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active
                      ? colors.accentMuted
                      : colors.surface,
                  },
                ]}
              >
                <AppText variant="label" tone={active ? "accent" : "primary"}>
                  {category}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          placeholder="Tip title"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.surface,
            },
          ]}
          value={tipTitle}
          onChangeText={setTipTitle}
        />

        <TextInput
          placeholder="Tip body"
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
          value={tipBody}
          onChangeText={setTipBody}
        />

        <AppText variant="label">Audience roles</AppText>
        <View style={styles.categoryRow}>
          {audienceOptions.map((role) => {
            const active = tipAudience.includes(role);
            return (
              <Pressable
                key={role}
                onPress={() => toggleAudience(role)}
                style={[
                  styles.categoryButton,
                  {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active
                      ? colors.accentMuted
                      : colors.surface,
                  },
                ]}
              >
                <AppText variant="label" tone={active ? "accent" : "primary"}>
                  {role}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handlePublishTip}
          disabled={publishing}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.accent,
              opacity: publishing ? 0.7 : 1,
            },
          ]}
        >
          <AppText variant="button" style={styles.primaryButtonText}>
            {publishing ? "Publishing..." : "Publish tip"}
          </AppText>
        </Pressable>
      </SectionCard>

      <SectionCard>
        <AppText variant="heading">Moderation queue</AppText>
        {flaggedPosts.length === 0 ? (
          <AppText tone="muted" style={styles.categoryText}>
            No flagged posts currently.
          </AppText>
        ) : null}

        {flaggedPosts.map((post) => (
          <View
            key={post.id}
            style={[styles.flaggedPost, { borderColor: colors.border }]}
          >
            <AppText variant="label">{post.authorName}</AppText>
            <AppText variant="caption" tone="muted">
              {formatDateTime(post.createdAt)}
            </AppText>
            <AppText style={styles.flaggedBody}>{post.body}</AppText>
            <AppText variant="caption" tone="danger">
              {post.moderationReason || "Flagged for review"}
            </AppText>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => handleClearFlag(post.id)}
                style={[styles.secondaryButton, { borderColor: colors.border }]}
              >
                <AppText variant="label" tone="accent">
                  Clear flag
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => handleDeletePost(post.id)}
                style={[
                  styles.dangerButton,
                  { backgroundColor: colors.danger },
                ]}
              >
                <AppText variant="label" style={styles.primaryButtonText}>
                  Delete
                </AppText>
              </Pressable>
            </View>
          </View>
        ))}
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
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: AppSpacing.sm,
  },
  statsGrid: {
    marginTop: AppSpacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  statTile: {
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    padding: AppSpacing.sm,
    minWidth: 92,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
    alignSelf: "flex-start",
  },
  categoryText: {
    marginTop: AppSpacing.xs,
    marginBottom: AppSpacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
    marginBottom: AppSpacing.sm,
  },
  categoryButton: {
    borderWidth: 1,
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.sm,
    marginBottom: AppSpacing.sm,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  primaryButton: {
    borderRadius: AppRadii.pill,
    paddingVertical: AppSpacing.sm,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
  },
  flaggedPost: {
    marginTop: AppSpacing.sm,
    borderWidth: 1,
    borderRadius: AppRadii.sm,
    padding: AppSpacing.sm,
  },
  flaggedBody: {
    marginTop: AppSpacing.xs,
    marginBottom: AppSpacing.xs,
  },
  actionRow: {
    marginTop: AppSpacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: AppSpacing.sm,
  },
  dangerButton: {
    borderRadius: AppRadii.pill,
    paddingHorizontal: AppSpacing.md,
    paddingVertical: AppSpacing.xs,
  },
});
