import { Text } from "../../../components/common/FontText";
import { View } from "react-native";

export default function ExtractedDataCard() {
  return (
    <>
      <View className="bg-vistaNavy rounded-2xl p-3 mb-4">
        <Text className="text-white text-[14px] font-medium">
          Extracted structured data
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-3 mb-3">
        <View className="mb-3">
          <Text className="text-slate-500 text-xs font-medium mb-1">
            Submitter name
          </Text>
          <Text className="text-vistaNavy text-[14px] font-medium">
            SECRETARY KIM
          </Text>
        </View>

        <View className="mb-3">
          <Text className="text-slate-500 text-xs font-medium mb-1">
            Date of submission
          </Text>
          <Text className="text-vistaNavy text-[14px] font-medium">
            2026-01-29
          </Text>
        </View>

        <View className="mb-3">
          <Text className="text-slate-500 text-xs font-medium mb-1">
            Document type
          </Text>
          <View className="flex-row items-center flex-wrap">
            <View className="bg-[#FFC342] px-1 py-0.5 mr-2">
              <Text className="text-[#513600] text-sm font-medium">
                site2026_sarf
              </Text>
            </View>
            <Text className="text-vistaNavy text-sm font-medium">
              SARF Document
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-slate-500 text-xs font-medium mb-1">
            Reference ID
          </Text>
          <Text className="text-vistaNavy text-[14px] font-medium">
            VIST-9909-X
          </Text>
        </View>
      </View>
    </>
  );
}