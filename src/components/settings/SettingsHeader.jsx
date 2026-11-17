import { View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { compact, radii, type, colors, space, motion } from '../../theme/tokens';

export default function SettingsHeader({
  title = 'Settings',
  subtitle = null,
  onBack,
  showVistaIcon = false,
  rightElement = null,
  variant = 'brand',
}) {
  const grouped = variant === 'grouped';
  return (
    <View
      style={{
        paddingHorizontal: space.lg,
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
        activeOpacity={motion.pressedOpacity}
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
        <Feather name="chevron-left" size={22} color={grouped ? colors.blue : colors.onBrand} />
      </TouchableOpacity>

      {/* Page Title */}
      <View style={{ flex: 1, paddingHorizontal: 2 }}>
        <Text
          accessibilityRole="header"
          style={{
            ...type.heading,
            fontSize: type.navigationTitle.fontSize,
            lineHeight: type.navigationTitle.lineHeight,
            fontFamily: 'DMSans_700Bold',
            color: grouped ? colors.navy : colors.onBrand,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...type.meta,
              fontSize: type.meta.fontSize,
              lineHeight: type.meta.lineHeight,
              color: grouped ? colors.muted : 'rgba(255, 255, 255, 0.8)',
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
