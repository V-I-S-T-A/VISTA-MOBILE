import { Text } from "../../../components/common/FontText";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, radii, sizes, space, type } from '../../../theme/tokens';

function Feature({ icon, title, children }) {
  return <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
    <View accessible={false} style={{ width: space.xxxl + space.sm, height: space.xxxl + space.sm, borderRadius: radii.chip,
      backgroundColor: colors.selectedSurface, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={sizes.icon} color={colors.blue} />
    </View>
    <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
      <Text style={{ ...type.sectionTitle, color: colors.text }}>{title}</Text>
      <Text style={{ ...type.meta, color: colors.muted }}>{children}</Text>
    </View>
  </View>;
}

export default function GDriveSyncFeatures() {
  return (
    <View style={{ gap: space.lg, marginBottom: space.lg }}>
      <View style={{ gap: space.xs }}>
        <Text style={{ ...type.sectionTitle, color: colors.text }}>
          Powering Institutional <Text style={{ color: colors.blue }}>Efficiency</Text>
        </Text>
        <Text style={{ ...type.body, color: colors.muted }}>
          Connect your professional workspace to VISTA. This integration allows for seamless, automated storage of high-resolution document scans directly to your institutional Google Drive.
        </Text>
      </View>

      <Feature icon="archive" title="Automated Archiving">Scanned files are instantly categorized and uploaded to your secure drive folders.</Feature>
      <Feature icon="shield" title="Enterprise Security">Using OAuth 2.0 protocols to ensure your institutional credentials remain protected.</Feature>
    </View>
  );
}
