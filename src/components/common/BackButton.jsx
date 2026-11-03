import { TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Text } from "./FontText";
import VistaIcon from './VistaIcon';
import { sizes } from '../../theme/tokens';

export default function BackButton({ variant = 'default' }) {
  const navigation = useNavigation();
  if (variant === 'icon') return <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={{ minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' }}><VistaIcon name="chevron-left" size={sizes.icon} /></TouchableOpacity>;

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={6}
      style={{ minWidth: sizes.touch, minHeight: sizes.touch, justifyContent: 'center' }}
      className="rounded-full"
    >
      <View style={{ borderWidth: 3, borderColor: '#FFE452' }} className="bg-[#FFF2A8] px-3.5 py-1 flex-row items-center rounded-full">
        <Text className="text-[#1a1a1a] font-medium text-base mr-1 leading-5">
          ‹
        </Text>
        <Text className="text-[#1a1a1a] font-medium text-[13px]">Back</Text>
      </View>
    </TouchableOpacity>
  );
}
