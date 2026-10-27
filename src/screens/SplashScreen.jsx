import { Text, View, Image, TouchableOpacity } from "react-native";

export default function SplashScreen({ error, onRetry }) {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Image
        source={require("../assets/logo.png")}
        className="w-40 h-40"
        resizeMode="contain"
      />
      <Text
        className="text-vistaOrange text-3xl tracking-widest mt-6"
        style={{ fontWeight: "800" }}
      >
        VISTA
      </Text>
      {error ? (
        <>
          <Text className="text-gray-600 text-center mx-8 mt-6">{error}</Text>
          <TouchableOpacity
            className="bg-vistaOrange rounded-lg px-6 py-3 mt-4"
            onPress={onRetry}
          >
            <Text className="text-white" style={{ fontWeight: "600" }}>
              Try again
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}
