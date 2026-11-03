import { View } from "react-native";
import { Text } from "./FontText";
import { layout, typography } from "../../theme/layout";

export default function PageHeading({ title, subtitle, compact = false, style }) {
  return (
    <View style={[{ marginBottom: compact ? 6 : layout.sectionGap }, style]}>
      <Text className="text-vistaNavy" style={typography.title}>{title}</Text>
      {subtitle ? <Text className="text-gray-600" style={[typography.body, { marginTop: 4 }]}>{subtitle}</Text> : null}
    </View>
  );
}
