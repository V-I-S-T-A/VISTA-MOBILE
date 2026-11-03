import { Text } from "../../../components/common/FontText";
import { View, TouchableOpacity } from "react-native";

export default function AnalysisActions({ onRedoPress }) {
  return (
    <View className="mb-3">
      <View className="bg-[#FFC342] min-h-[48px] rounded-xl items-center justify-center mb-3">
        <Text className="text-[#513600] font-medium text-sm">
          Approve & Save to Drive
        </Text>
      </View>

      <TouchableOpacity
        onPress={onRedoPress}
        className="min-h-[48px] rounded-xl border border-vistaNavy items-center justify-center bg-white"
      >
        <Text className="text-vistaNavy font-medium text-sm">Redo</Text>
      </TouchableOpacity>
    </View>
  );
}