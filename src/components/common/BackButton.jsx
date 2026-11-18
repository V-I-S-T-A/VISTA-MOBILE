import { TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Text } from "./FontText";
import VistaIcon from './VistaIcon';
import { colors, radii, sizes, space, type, motion } from '../../theme/tokens';

export default function BackButton({ variant = 'default' }) {
  const navigation = useNavigation();
  if (variant === 'icon') return <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back" style={{ minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' }}><VistaIcon name="chevron-left" size={sizes.icon} /></TouchableOpacity>;

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={6}
      activeOpacity={motion.pressedOpacity}
      style={{ minWidth: sizes.touch, minHeight: sizes.touch, justifyContent: 'center' }}
      className="rounded-full"
    >
      <View style={{ backgroundColor: colors.yellow, borderRadius: radii.pill, paddingHorizontal: space.md, paddingVertical: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        <VistaIcon name="chevron-left" size={sizes.icon} color={colors.onYellow} />
        <Text style={{ ...type.label, color: colors.onYellow }}>Back</Text>
      </View>
    </TouchableOpacity>
  );
}
