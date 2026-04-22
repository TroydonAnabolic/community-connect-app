import { Text, TextProps, TextStyle } from "react-native";

import { Fonts } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type TextVariant =
  | "title"
  | "heading"
  | "body"
  | "label"
  | "caption"
  | "button";
type Tone = "primary" | "muted" | "accent" | "danger";

const VARIANT_MAP: Record<
  TextVariant,
  Pick<TextStyle, "fontSize" | "lineHeight" | "fontWeight">
> = {
  title: { fontSize: 30, lineHeight: 36, fontWeight: "700" },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  button: { fontSize: 16, lineHeight: 20, fontWeight: "700" },
};

type AppTextProps = TextProps & {
  variant?: TextVariant;
  tone?: Tone;
};

export function AppText({
  variant = "body",
  tone = "primary",
  style,
  ...props
}: AppTextProps) {
  const { colors, scaleText } = useAppTheme();
  const variantStyle = VARIANT_MAP[variant];

  const colorMap: Record<Tone, string> = {
    primary: colors.textPrimary,
    muted: colors.textMuted,
    accent: colors.accent,
    danger: colors.danger,
  };

  return (
    <Text
      style={[
        {
          color: colorMap[tone],
          fontSize: scaleText(variantStyle.fontSize ?? 16),
          lineHeight: scaleText(variantStyle.lineHeight ?? 22),
          fontWeight: variantStyle.fontWeight,
          fontFamily:
            variant === "title" || variant === "heading"
              ? Fonts.rounded
              : Fonts.sans,
        },
        style,
      ]}
      {...props}
    />
  );
}
