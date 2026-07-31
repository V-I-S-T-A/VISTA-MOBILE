import { View, Text, Image } from "react-native";

export default function StaffReviewBanner() {
  return (
    <View className="mb-6">
      <View className="mb-4">
        <Text className="text-2xl font-extrabold text-vistaNavy">Review Panel</Text>
        <Text className="text-gray-500 text-sm mt-1">Reviewing documents.</Text>
      </View>
      <Image
        source={require("../../../assets/review-panel.png")}
        className="w-full h-44 rounded-2xl"
        resizeMode="cover"
      />
    </View>
  );
}
