import { type } from '../theme/tokens';
import { Text, ScrollView, RefreshControl, Image, TouchableOpacity } from "react-native";
import { useScreenRefresh } from '../hooks/useScreenRefresh';
import { MAIN_YELLOW, MAIN_BLUE } from "../constants/colors";

export default function SplashScreen({ error, onRetry }) {
  const { refreshing, onRefresh } = useScreenRefresh([], error ? onRetry : undefined);
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}
      alwaysBounceVertical overScrollMode="always" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Image
        source={require("../assets/logo.webp")}
        style={{ width: 130, height: 130 }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontFamily: "DMSans_800ExtraBold",
          fontSize: type.number.fontSize,
          letterSpacing: 3,
          color: MAIN_YELLOW,
          marginTop: 12,
        }}
      >
        VISTA
      </Text>
      {error ? (
        <>
          <Text className="text-gray-600 text-center mx-8 mt-6">{error}</Text>
          <TouchableOpacity
            className="rounded-lg px-6 py-3 mt-4"
            style={{ backgroundColor: MAIN_BLUE }}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text className="text-white" style={{ fontFamily: "DMSans_700Bold" }}>
              Try again
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
  );
}
