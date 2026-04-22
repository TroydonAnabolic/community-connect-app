import { PropsWithChildren } from "react";
import {
    ScrollView,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppRadii, AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import { AppText } from "./app-text";

type AppScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  headerRight?: React.ReactNode;
}>;

export function AppScreen({
  title,
  subtitle,
  scroll = true,
  contentContainerStyle,
  children,
  headerRight,
}: AppScreenProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.backgroundDecor} pointerEvents="none">
        <View
          style={[
            styles.blob,
            {
              backgroundColor: colors.accentMuted,
              width: width * 0.5,
              height: width * 0.5,
              top: -width * 0.18,
              left: -width * 0.08,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              backgroundColor: "#F6E7CF",
              width: width * 0.42,
              height: width * 0.42,
              top: width * 0.1,
              right: -width * 0.18,
            },
          ]}
        />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" tone="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {headerRight}
      </View>

      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fixedContent, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    borderRadius: AppRadii.pill,
    opacity: 0.55,
    position: "absolute",
  },
  headerRow: {
    paddingHorizontal: AppSpacing.lg,
    paddingTop: AppSpacing.sm,
    paddingBottom: AppSpacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: AppSpacing.md,
    alignItems: "flex-start",
  },
  headerTextWrap: {
    flex: 1,
  },
  subtitle: {
    marginTop: AppSpacing.xs,
  },
  scrollContent: {
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.xl,
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: AppSpacing.lg,
    paddingBottom: AppSpacing.lg,
  },
});
