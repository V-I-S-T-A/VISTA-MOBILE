import { View } from 'react-native';
import { Text } from './FontText';
import VistaIcon from './VistaIcon';

export default function StaleWarningBanner({
  message = "Could not refresh. Showing cached data.",
  style,
}) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={message}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#FFF7ED',
          borderWidth: 1,
          borderColor: '#FFEDD5',
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 5,
          marginBottom: 8,
        },
        style,
      ]}
    >
      <VistaIcon name="alert-circle" size={13} color="#C2410C" />
      <Text
        style={{
          fontFamily: 'DMSans_400Regular',
          fontSize: 11,
          lineHeight: 15,
          color: '#9A3412',
          flex: 1,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
