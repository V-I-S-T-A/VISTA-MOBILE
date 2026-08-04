import { View, Text } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function GDriveSyncFeatures() {
  return (
    <View className="mb-8">
      <Text className="text-vistaNavy font-bold text-sm mb-1">
        Powering Institutional <Text className="text-[#FFC342]">Efficiency</Text>
      </Text>
      <Text className="text-gray-500 text-[11px] leading-4 mb-6">
        Connect your professional workspace to VISTA. This integration allows for seamless, automated storage of high-resolution document scans directly to your institutional Google Drive.
      </Text>

      <View className="flex-row mb-5">
        <View className="bg-vistaNavy w-10 h-10 rounded-xl items-center justify-center mr-4 mt-1 shadow-sm">
          <Feather name="cloud" size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-vistaNavy font-bold text-sm mb-1">Automated Archiving</Text>
          <Text className="text-gray-500 text-xs leading-4">
            Scanned files are instantly categorized and uploaded to your secure drive folders.
          </Text>
        </View>
      </View>

      <View className="flex-row">
        <View className="bg-vistaNavy w-10 h-10 rounded-xl items-center justify-center mr-4 mt-1 shadow-sm">
          <MaterialCommunityIcons name="shield-check-outline" size={22} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-vistaNavy font-bold text-sm mb-1">Enterprise Security</Text>
          <Text className="text-gray-500 text-xs leading-4">
            Using OAuth 2.0 protocols to ensure your institutional credentials remain protected.
          </Text>
        </View>
      </View>
    </View>
  );
}
