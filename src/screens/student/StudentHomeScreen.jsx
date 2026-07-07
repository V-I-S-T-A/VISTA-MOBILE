import { View, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StudentHomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-white items-center justify-center px-4"
      style={{ paddingTop: insets.top }}
    >
      <Image
        source={require("../../assets/logo.png")}
        className="w-20 h-20 mb-4"
        resizeMode="contain"
      />
      <Text className="text-xl font-bold text-vistaNavy">Welcome, Student 👋</Text>
    </View>
  );
}
