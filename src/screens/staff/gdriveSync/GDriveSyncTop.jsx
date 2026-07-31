import { View, Text, TouchableOpacity } from "react-native";

export default function GDriveSyncTop() {
  return (
    <View className="mb-6">
      <Text className="text-2xl font-extrabold text-vistaNavy">Google Drive Sync</Text>
      <Text className="text-gray-600 text-sm mt-1 mb-5">Sync your google drive account.</Text>
      
      <TouchableOpacity className="bg-[#FFC342] rounded-2xl py-3.5 items-center justify-center shadow-sm">
        <Text className="text-white font-extrabold text-xl tracking-wider">SECURE INTEGRATION</Text>
      </TouchableOpacity>
    </View>
  );
}
