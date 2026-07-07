import { View, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#F5A623";
const INACTIVE_COLOR = "white";

export default function StaffBottomNav({
  activeTab = "home",
  onHomePress,
  onProfilePress,
  onScanPress,
  onReportsPress,
  onCloudPress,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-vistaNavy flex-row justify-between items-center px-8 py-4 rounded-t-2xl"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <TouchableOpacity onPress={onHomePress}>
        <Ionicons
          name="home-outline"
          size={24}
          color={activeTab === "home" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={onProfilePress}>
        <Ionicons
          name="person-outline"
          size={24}
          color={activeTab === "profile" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onScanPress}
        className="bg-vistaNavy border-2 border-white rounded-full p-3 -mt-6"
      >
        <Feather name="maximize" size={22} color="white" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onReportsPress}>
        <Feather
          name="file-text"
          size={22}
          color={activeTab === "reports" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={onCloudPress}>
        <Feather
          name="cloud"
          size={22}
          color={activeTab === "cloud" ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
      </TouchableOpacity>
    </View>
  );
}
