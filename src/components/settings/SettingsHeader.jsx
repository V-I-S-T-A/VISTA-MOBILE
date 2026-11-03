import { View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { compact, radii, type } from '../../theme/tokens';

export default function SettingsHeader({
  title = 'Settings',
  subtitle = null,
  onBack,
  showVistaIcon = false,
  rightElement = null,
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 2,
        paddingBottom: 2,
        minHeight: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left Back Button */}
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{
          width: compact.touch,
          height: compact.touch,
          borderRadius: radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -8,
          marginRight: 2,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="chevron-left" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Page Title */}
      <View style={{ flex: 1, paddingHorizontal: 2 }}>
        <Text
          numberOfLines={1}
          style={{
            ...type.heading,
            fontSize: 18,
            lineHeight: 24,
            fontFamily: 'DMSans_700Bold',
            color: '#FFFFFF',
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              ...type.meta,
              fontSize: 11,
              lineHeight: 14,
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: 1,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right Element or VISTA Icon across from Back button */}
      {rightElement ? (
        rightElement
      ) : showVistaIcon ? (
        <View
          style={{
            width: compact.touch,
            height: compact.touch,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: -8,
          }}
        >
          <Image
            source={require('../../assets/logo.webp')}
            style={{ width: 26, height: 26 }}
            resizeMode="contain"
            accessibilityLabel="VISTA official logo"
          />
        </View>
      ) : (
        <View style={{ width: compact.touch, marginRight: -8 }} />
      )}
    </View>
  );
}
