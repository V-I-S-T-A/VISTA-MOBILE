import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffHomeContent from "./home/StaffHomeContent";

export default function StaffHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <StaffHomeContent />

      <StaffBottomNav
        activeTab="home"
        onHomePress={() => navigation.navigate("StaffHome")}
        onProfilePress={() => navigation.navigate("StaffDocumentEntry")}
      />
    </View>
  );
}