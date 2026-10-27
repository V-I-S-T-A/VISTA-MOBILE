import { TouchableOpacity, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MAIN_BLUE } from "../../constants/colors";

const ACTIVE = "#FFE35B";

export default function StudentBottomNav({
  activeTab,
  onHomePress,
  onTrackerPress,
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row justify-center gap-20 items-center py-4 rounded-t-2xl"
      style={{ paddingBottom: insets.bottom + 20, backgroundColor: MAIN_BLUE }}
    >
      <TouchableOpacity onPress={onHomePress}>
        <Ionicons
          name="home-outline"
          size={28}
          color={activeTab === "home" ? ACTIVE : "white"}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onTrackerPress}>
        <Feather
          name="file-text"
          size={28}
          color={activeTab === "tracker" ? ACTIVE : "white"}
        />
      </TouchableOpacity>
    </View>
  );
}
