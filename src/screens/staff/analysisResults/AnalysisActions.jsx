import { View, Text, TouchableOpacity } from "react-native";

export default function AnalysisActions({ onRedoPress }) {
  return (
    <View className="mb-6">
      <View className="bg-[#FFC342] h-10 items-center justify-center mb-3">
        <Text className="text-[#F27B1A] font-extrabold text-sm">
          Approve & Save to Drive
        </Text>
      </View>

      <TouchableOpacity
        onPress={onRedoPress}
        className="h-10 border border-vistaNavy items-center justify-center bg-white"
      >
        <Text className="text-vistaNavy font-extrabold text-sm">Redo</Text>
      </TouchableOpacity>
    </View>
  );
}