import BottomNavFrame from '../common/BottomNavFrame';
import BottomNavItem from '../common/BottomNavItem';
import { PersistentBottomNav } from '../../navigation/PersistentBottomNav';
import { View } from "react-native";
import { navigationStyles } from '../../theme/layout';
import { useNavigation } from '@react-navigation/native';

export default function StudentBottomNav({
  activeTab,
  onHomePress,
  onTrackerPress,
  docked = false,
  scrollBehavior,
}) {
  const navigation = useNavigation();
  return (
    <PersistentBottomNav>
    <BottomNavFrame docked={docked} scrollBehavior={scrollBehavior}>
    <View style={navigationStyles.shell}>
      <BottomNavItem label="Home" icon="home" selected={activeTab === 'home'} onPress={onHomePress} />
      <BottomNavItem label="Review tracker" icon="file-text" selected={activeTab === 'tracker'} onPress={onTrackerPress} />
      <BottomNavItem label="All notifications" icon="inbox" selected={activeTab === 'notifications'} onPress={() => navigation.navigate('StudentNotifications')} />
    </View>
    </BottomNavFrame>
    </PersistentBottomNav>
  );
}
