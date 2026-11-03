import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { colors, compact } from '../../theme/tokens';

export default function SettingsRow({
  icon,
  iconComponent = null,
  label,
  description = null,
  rightElement = null,
  showChevron = true,
  onPress,
  hasDivider = false,
  disabled = false,
  danger = false,
}) {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || !onPress}
        accessibilityRole="button"
        accessibilityLabel={description ? `${label}, ${description}` : label}
        accessibilityState={{ disabled }}
        activeOpacity={0.65}
        style={{
          minHeight: compact.touch,
          paddingHorizontal: 14,
          paddingVertical: description ? 9.5 : 8.5,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
        }}
      >
        {/* Left Icon (containerless) */}
        {iconComponent ? (
          <View
            style={{
              width: 22,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 11,
              flexShrink: 0,
            }}
          >
            {iconComponent}
          </View>
        ) : icon ? (
          <View
            style={{
              width: 22,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 11,
              flexShrink: 0,
            }}
          >
            <Feather
              name={icon}
              size={18.5}
              color={danger ? colors.danger : colors.blue}
            />
          </View>
        ) : null}

        {/* Center Label & Description */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: 'DMSans_600SemiBold',
              fontSize: 13.5,
              lineHeight: 18,
              color: danger ? colors.danger : colors.navy,
            }}
          >
            {label}
          </Text>
          {description ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 10.5,
                lineHeight: 14,
                color: colors.muted,
                marginTop: 1,
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {/* Right Action / Chevron */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
          {rightElement}
          {showChevron ? (
            <Feather name="chevron-right" size={15} color="#94A3B8" />
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Subtle Inset Divider */}
      {hasDivider ? (
        <View
          style={{
            height: 1,
            backgroundColor: '#F1F5F9',
            marginLeft: 47,
          }}
        />
      ) : null}
    </View>
  );
}
