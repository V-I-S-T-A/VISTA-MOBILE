import { View, Text } from "react-native";

export default function ExtractedDataCard() {
  return (
    <>
      <View className="bg-vistaNavy rounded-2xl px-5 py-4 mb-4">
        <Text className="text-white text-base font-extrabold">
          EXTRACTED STRUCTURED DATA
        </Text>
      </View>

      <View className="bg-white rounded-2xl px-6 py-6 mb-6">
        <View className="mb-5">
          <Text className="text-slate-400 text-xs font-extrabold mb-1">
            SUBMITTER NAME
          </Text>
          <Text className="text-vistaNavy text-base font-extrabold">
            SECRETARY KIM
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-slate-400 text-xs font-extrabold mb-1">
            DATE OF SUBMISSION
          </Text>
          <Text className="text-vistaNavy text-base font-extrabold">
            2026-01-29
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-slate-400 text-xs font-extrabold mb-1">
            DOCUMENT TYPE
          </Text>
          <View className="flex-row items-center flex-wrap">
            <View className="bg-[#FFC342] px-1 py-0.5 mr-2">
              <Text className="text-[#F27B1A] text-sm font-extrabold">
                site2026_sarf
              </Text>
            </View>
            <Text className="text-vistaNavy text-sm font-extrabold">
              SARF Document
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-slate-400 text-xs font-extrabold mb-1">
            REFERENCE ID
          </Text>
          <Text className="text-vistaNavy text-base font-extrabold">
            VIST-9909-X
          </Text>
        </View>
      </View>
    </>
  );
}