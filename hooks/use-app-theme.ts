import { useMemo } from "react";

import { BasePalette, HighContrastPalette } from "@/constants/app-theme";
import { useAuth } from "@/providers/auth-provider";

export function useAppTheme() {
  const { profile } = useAuth();

  const fontScale = profile?.accessibility?.fontScale ?? 1;
  const highContrast = profile?.accessibility?.highContrast ?? false;

  return useMemo(() => {
    const colors = highContrast ? HighContrastPalette : BasePalette;

    return {
      colors,
      fontScale,
      highContrast,
      scaleText(size: number) {
        return Math.round(size * fontScale);
      },
    };
  }, [fontScale, highContrast]);
}
