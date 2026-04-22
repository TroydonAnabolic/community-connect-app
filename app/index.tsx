import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/app/loading-screen";
import { useAuth } from "@/providers/auth-provider";

export default function IndexRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading your community dashboard..." />;
  }

  return <Redirect href={user ? "/(tabs)/community" : "/auth"} />;
}
