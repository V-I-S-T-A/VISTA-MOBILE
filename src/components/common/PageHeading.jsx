import { View } from "react-native";
import { Text } from "./FontText";
import { layout, typography } from "../../theme/layout";
import { colors, space } from '../../theme/tokens';

export default function PageHeading({ title, subtitle, compact = false, style }) {
  return (
    <View style={[{ marginBottom: compact ? 6 : layout.sectionGap }, style]}>
      <Text accessibilityRole="header" style={[typography.title, { color: colors.navy }]}>{title}</Text>
      {subtitle ? <Text style={[typography.body, { marginTop: space.xs }]}>{subtitle}</Text> : null}
    </View>
  );
}
