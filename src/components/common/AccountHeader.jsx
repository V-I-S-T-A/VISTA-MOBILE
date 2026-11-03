import { Feather } from "@expo/vector-icons";
import { sizes, colors } from '../../theme/tokens';
import { Image, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import StudentNotificationBell from "../students/StudentNotificationBell";
import UserAvatar from './UserAvatar';

export default function AccountHeader({ profileRoute, showSettings = false }) {
  const navigation = useNavigation();
  const { user } = useAuth();

  return (
    <View className="flex-row items-center justify-between" style={{ height: 56, marginBottom: 8 }}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" style={{ width: sizes.touch, height: sizes.touch, justifyContent: "center" }} onPress={() => navigation.navigate(profileRoute)}>
        <UserAvatar uri={user?.image_url} size={sizes.avatarHeader} style={{ borderWidth: 2, borderColor: 'white' }} />
      </TouchableOpacity>
      <Image
        source={require("../../assets/logo.webp")}
        style={{ width: 56, height: 56, position: "absolute", left: "50%", marginLeft: -28 }}
        resizeMode="contain"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showSettings ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={{ width: sizes.touch, height: sizes.touch, justifyContent: "center", alignItems: "center" }}
            onPress={() => navigation.navigate("Settings")}
          >
            <Feather name="settings" size={20} color={colors.navy} />
          </TouchableOpacity>
        ) : null}
        <StudentNotificationBell />
      </View>
    </View>
  );
}
