import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Redirect, Tabs } from "expo-router";
import React from "react";

import { LoadingScreen } from "@/components/app/loading-screen";
import { HapticTab } from "@/components/haptic-tab";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useAuth } from "@/providers/auth-provider";

export default function TabLayout() {
  const { user, profile, loading } = useAuth();
  const { colors } = useAppTheme();

  if (loading) {
    return <LoadingScreen message="Loading workspace..." />;
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const isAdmin = profile?.role === "admin";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="forum" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="event-available" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="wellbeing"
        options={{
          title: "Wellbeing",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="favorite" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="chat" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="person" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: isAdmin ? undefined : null,
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons color={color} name="shield" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
