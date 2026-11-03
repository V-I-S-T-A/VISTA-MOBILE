import { type } from '../../../theme/tokens';
import UserAvatar from '../../../components/common/UserAvatar';
import { Text } from "../../../components/common/FontText";
import { View, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../context/AuthContext";

export default function AnalysisResultsHeader({ onBackPress }) {
  const navigation = useNavigation();
  const { user } = useAuth();
  


  return (
    <>
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity style={{ minWidth: 48, minHeight: 48, justifyContent: 'center' }} onPress={() => navigation.navigate("StaffProfile")}>
          <UserAvatar uri={user?.image_url} size={34} />
        </TouchableOpacity>
        <Image
          source={require("../../../assets/logo.webp")}
          className="w-14 h-14"
          resizeMode="contain"
        />
        <TouchableOpacity>
          <Feather name="sliders" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <Text style={type.title} className="text-vistaNavy">
        Analysis Results
      </Text>
      <Text className="text-vistaNavy text-[13px] leading-5 mb-4">
        Reviewing extracted entities and document classification metrics.
      </Text>

      <TouchableOpacity
        onPress={onBackPress}
        className="self-start bg-[#FFE45C] rounded-full min-h-[48px] px-3 py-1 mb-3 flex-row items-center"
      >
        <Feather name="chevron-left" size={18} color="#8A7A1C" />
        <Text className="text-[#8A7A1C] text-xs font-bold">Back</Text>
      </TouchableOpacity>
    </>
  );
}
