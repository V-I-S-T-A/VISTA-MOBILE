import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function GDriveSyncLoginCard() {
  return (
    <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100 items-center">
      <View className="bg-[#eef2ff] w-20 h-20 rounded-2xl items-center justify-center mb-5">
        <View className="bg-vistaNavy w-12 h-12 rounded-xl items-center justify-center">
          <MaterialCommunityIcons name="line-scan" size={24} color="white" />
        </View>
      </View>

      <Text className="text-vistaNavy font-bold text-sm mb-2">Internal Staff Login</Text>
      <Text className="text-gray-500 text-xs text-center leading-5 mb-6 px-2">
        Please use your institutional email to access the VISTA scanning gateway.
      </Text>

      <TouchableOpacity className="bg-[#FFCC00] w-full flex-row items-center justify-center py-3 rounded-lg border border-yellow-500 shadow-sm mb-6">
        <View className="bg-white p-1 rounded-sm mr-3">
          <Image 
            source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" }}
            className="w-4 h-4"
          />
        </View>
        <Text className="text-gray-800 font-semibold text-[15px]">Sign in with Google</Text>
      </TouchableOpacity>

      <View className="flex-row items-center w-full mb-4">
        <View className="flex-1 h-[1px] bg-gray-200" />
        <Text className="text-gray-400 font-bold text-[10px] tracking-widest px-3">PRIVACY ASSURANCE</Text>
        <View className="flex-1 h-[1px] bg-gray-200" />
      </View>

      <Text className="text-gray-400 text-[9px] text-center leading-4 px-1">
        Access is restricted to authorized personnel. Data is handled according to the <Text className="underline">Institutional Privacy Framework</Text>. All uploads are logged for audit purposes.
      </Text>
    </View>
  );
}
