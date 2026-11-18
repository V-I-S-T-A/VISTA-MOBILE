import BottomNavFrame from '../common/BottomNavFrame';
import BottomNavItem from '../common/BottomNavItem';
import { PersistentBottomNav } from '../../navigation/PersistentBottomNav';
import { View } from "react-native";
import { navigationStyles } from '../../theme/layout';

export default function StaffBottomNav({
  activeTab = "home",
  onHomePress,
  onProfilePress,
  onScanPress,
  onReportsPress,
  onCloudPress,
  docked = false,
  scrollBehavior,
}) {
  return (
    <PersistentBottomNav>
    <BottomNavFrame docked={docked} scrollBehavior={scrollBehavior}>
    <View style={navigationStyles.shell}>
      <BottomNavItem label="Home" icon="home" selected={activeTab === 'home'} onPress={onHomePress} />
      <BottomNavItem label="Document entry" icon="edit" selected={activeTab === 'profile'} onPress={onProfilePress} />
      <BottomNavItem label="Scan document" icon="maximize" action onPress={onScanPress} />
      <BottomNavItem label="Submissions" icon="file-text" selected={activeTab === 'reports'} onPress={onReportsPress} />
      <BottomNavItem label="Google Drive" icon="cloud" selected={activeTab === 'cloud'} onPress={onCloudPress} />
    </View>
    </BottomNavFrame>
    </PersistentBottomNav>
  );
}
