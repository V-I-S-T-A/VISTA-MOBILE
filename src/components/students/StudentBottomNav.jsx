import { sizes, nav } from '../../theme/tokens';
import BottomNavFrame from '../common/BottomNavFrame';
import { TouchableOpacity, View } from "react-native";
import VistaIcon from '../common/VistaIcon';
import { navigationStyles } from '../../theme/layout';
import { useNavigation } from '@react-navigation/native';

const ACTIVE = nav.selected;

export default function StudentBottomNav({
  activeTab,
  onHomePress,
  onTrackerPress,
  docked = false,
}) {
  const navigation = useNavigation();
  return (
    <BottomNavFrame docked={docked}>
    <View style={navigationStyles.shell}>
      <TouchableOpacity onPress={onHomePress} accessibilityRole="button" accessibilityLabel="Home" accessibilityState={{ selected: activeTab === 'home' }} style={[navigationStyles.item, activeTab === 'home' && navigationStyles.selected]}>
        <VistaIcon
          name="home"
          size={sizes.navIcon}
          color={activeTab === "home" ? ACTIVE : "white"}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onTrackerPress} accessibilityRole="button" accessibilityLabel="Review tracker" accessibilityState={{ selected: activeTab === 'tracker' }} style={[navigationStyles.item, activeTab === 'tracker' && navigationStyles.selected]}>
        <VistaIcon
          name="file-text"
          size={sizes.navIcon}
          color={activeTab === "tracker" ? ACTIVE : "white"}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('StudentNotifications')} accessibilityRole="button" accessibilityLabel="All notifications" accessibilityState={{ selected: activeTab === 'notifications' }} style={[navigationStyles.item, activeTab === 'notifications' && navigationStyles.selected]}>
        <VistaIcon name="inbox" size={sizes.navIcon} color={activeTab === 'notifications' ? ACTIVE : 'white'} />
      </TouchableOpacity>
    </View>
    </BottomNavFrame>
  );
}
