import { TouchableOpacity, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE = "#FFE35B";

export default function StudentBottomNav({ activeTab, onHomePress, onTrackerPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-vistaNavy flex-row justify-around items-center py-4 rounded-t-2xl" style={{ paddingBottom: insets.bottom + 12 }}>
      <TouchableOpacity onPress={onHomePress} className="px-10">
        <Ionicons name="home-outline" size={26} color={activeTab === "home" ? ACTIVE : "white"} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onTrackerPress} className="px-10">
        <Feather name="file-text" size={25} color={activeTab === "tracker" ? ACTIVE : "white"} />
      </TouchableOpacity>
    </View>
  );
}
