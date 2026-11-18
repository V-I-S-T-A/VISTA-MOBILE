import { colors, radii, space, type } from '../../../theme/tokens';
import PageHeading from "../../../components/common/PageHeading";
import { Text } from "../../../components/common/FontText";
import { View } from "react-native";
import GoogleDriveLogo from '../../../components/common/GoogleDriveLogo';

export default function GDriveSyncTop() {
  return (
    <View className="mb-4">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ paddingTop: space.xs }}><GoogleDriveLogo /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <PageHeading title="Google Drive Sync" subtitle="Connect your institutional account." />
        </View>
      </View>
      
      <View style={{ backgroundColor: colors.blue, borderRadius: radii.field, padding: space.sm, alignItems: 'center' }}>
        <Text style={{ ...type.label, color: colors.onBrand }}>Secure integration</Text>
      </View>
    </View>
  );
}
