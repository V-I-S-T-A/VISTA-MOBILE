import { TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Text } from "../common/FontText";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import { useNotifications } from "../../hooks/useStudentNotifications";

export default function StudentNotificationBell() {
  const navigation = useNavigation();
  const { role } = useAuth();
  const { data } = useNotifications();
  const unreadCount = data?.unread_count || 0;

  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate(
          role === ROLES.STUDENT ? "StudentNotifications" : "StaffNotifications",
        )
      }
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      className="w-10 h-10 items-center justify-center"
    >
      <Feather name="bell" size={23} color="#111827" />
      {unreadCount > 0 ? (
        <View className="absolute -top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 items-center justify-center border-2 border-[#F3F3F3]">
          <Text className="text-white text-[9px] font-extrabold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
