import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppSpacing } from "@/constants/app-theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import { AppText } from "./app-text";

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({
  message = "Loading community workspace...",
}: LoadingScreenProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.accent} size="large" />
      <AppText style={styles.message} tone="muted">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: AppSpacing.lg,
  },
  message: {
    marginTop: AppSpacing.md,
    textAlign: "center",
  },
});
