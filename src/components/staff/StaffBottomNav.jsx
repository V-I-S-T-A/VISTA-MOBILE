import { sizes, nav } from '../../theme/tokens';
import BottomNavFrame from '../common/BottomNavFrame';
import { View, TouchableOpacity } from "react-native";
import VistaIcon from '../common/VistaIcon';
import { navigationStyles } from '../../theme/layout';

const ACTIVE_COLOR = nav.selected;
const INACTIVE_COLOR = nav.inactive;
const tabStyle = navigationStyles.item;

export default function StaffBottomNav({
  activeTab = "home",
  onHomePress,
  onProfilePress,
  onScanPress,
  onReportsPress,
  onCloudPress,
  docked = false,
}) {
  return (
    <BottomNavFrame docked={docked}>
    <View style={navigationStyles.shell}>
      <TouchableOpacity accessibilityLabel="Home" accessibilityRole="button" accessibilityState={{ selected: activeTab === "home" }} style={[tabStyle, activeTab === "home" && navigationStyles.selected]} onPress={onHomePress}>
        <VistaIcon
          name="home"
          size={sizes.navIcon}
          color={activeTab === "home" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>

      <TouchableOpacity accessibilityLabel="Document entry" accessibilityRole="button" accessibilityState={{ selected: activeTab === "profile" }} style={[tabStyle, activeTab === "profile" && navigationStyles.selected]} onPress={onProfilePress}>
        <VistaIcon
          name="edit"
          size={sizes.navIcon}
          color={activeTab === "profile" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onScanPress}
        accessibilityLabel="Scan document"
        accessibilityRole="button"
        style={tabStyle}
      >
        <VistaIcon name="maximize" size={sizes.navIcon} color="white" />
      </TouchableOpacity>

      <TouchableOpacity accessibilityLabel="Submissions" accessibilityRole="button" accessibilityState={{ selected: activeTab === "reports" }} style={[tabStyle, activeTab === "reports" && navigationStyles.selected]} onPress={onReportsPress}>
        <VistaIcon
          name="file-text"
          size={sizes.navIcon}
          color={activeTab === "reports" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>

      <TouchableOpacity accessibilityLabel="Google Drive" accessibilityRole="button" accessibilityState={{ selected: activeTab === "cloud" }} style={[tabStyle, activeTab === "cloud" && navigationStyles.selected]} onPress={onCloudPress}>
        <VistaIcon
          name="cloud"
          size={sizes.navIcon}
          color={activeTab === "cloud" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>
    </View>
    </BottomNavFrame>
  );
}
