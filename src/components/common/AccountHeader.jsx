import { Image, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function AccountHeader({ profileRoute, showSettings = false }) {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const avatar = user?.image_url
    ? { uri: user.image_url }
    : require("../../assets/default_user.jpg");

  return (
    <View className="flex-row items-center justify-between mb-6">
      <TouchableOpacity onPress={() => navigation.navigate(profileRoute)}>
        <Image
          source={avatar}
          className="rounded-full bg-gray-200"
          style={{ width: 40, height: 40 }}
        />
      </TouchableOpacity>
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 80, height: 80 }}
        resizeMode="contain"
      />
      <TouchableOpacity
        onPress={() =>
          logout().then(() => navigation.reset({ index: 0, routes: [{ name: "Login" }] }))
        }
      >
        <Feather
          name="log-out"
          size={23}
          color="#111827"
        />
      </TouchableOpacity>
    </View>
  );
}
