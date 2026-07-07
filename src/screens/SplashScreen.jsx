import { View, Image, Text } from "react-native";

export default function SplashScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Image
        source={require("../assets/logo.png")}
        className="w-40 h-40"
        resizeMode="contain"
      />
      <Text className="text-vistaOrange text-3xl font-extrabold tracking-widest mt-6">
        V.I.S.T.A.
      </Text>
    </View>
  );
}
