import { colors, radii, space, type } from '../../../theme/tokens';
import PageHeading from "../../../components/common/PageHeading";
import { Text } from "../../../components/common/FontText";
import { View } from "react-native";

export default function GDriveSyncTop() {
  return (
    <View className="mb-4">
      <PageHeading title="Google Drive Sync" subtitle="Sync your google drive account." />
      
      <View style={{ backgroundColor: colors.yellow, borderRadius: radii.field, padding: space.sm, alignItems: 'center' }}>
        <Text style={{ ...type.label, color: colors.onYellow }}>Secure integration</Text>
      </View>
    </View>
  );
}
