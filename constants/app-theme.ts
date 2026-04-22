export type AppPalette = {
  background: string;
  surface: string;
  card: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  border: string;
  danger: string;
  warning: string;
};

export const BasePalette: AppPalette = {
  background: "#F2F7F3",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  textPrimary: "#17241C",
  textMuted: "#5E6D62",
  accent: "#1D7A58",
  accentMuted: "#DBF0E5",
  border: "#C8D8CC",
  danger: "#B23B2A",
  warning: "#B67720",
};

export const HighContrastPalette: AppPalette = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  textPrimary: "#000000",
  textMuted: "#1A1A1A",
  accent: "#005139",
  accentMuted: "#D8EFE5",
  border: "#000000",
  danger: "#8A1A0E",
  warning: "#7A4A00",
};

export const AppSpacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
};

export const AppRadii = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};
