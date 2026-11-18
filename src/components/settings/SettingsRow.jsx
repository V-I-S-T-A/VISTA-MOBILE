import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { colors, compact, type, space, settingsLayout, motion, sizes } from '../../theme/tokens';

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
  triggerRef,
  variant = 'grouped',
  iconColor = colors.blue,
  busy = false,
}) {
  const Row = onPress ? TouchableOpacity : View;
  const grouped = variant === 'grouped';
  const iconStyle = grouped ? {
    width: settingsLayout.iconSize,
    height: settingsLayout.iconSize,
    borderRadius: settingsLayout.iconRadius,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
    flexShrink: 0,
  } : {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  };
  return (
    <View>
      <Row
        ref={triggerRef}
        onPress={onPress}
        disabled={disabled || busy || !onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={description ? `${label}, ${description}` : label}
        accessibilityState={{ disabled: disabled || busy, busy }}
        activeOpacity={motion.pressedOpacity}
        style={{
          minHeight: grouped ? settingsLayout.rowMinHeight : compact.touch,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          opacity: disabled ? motion.disabledOpacity : 1,
        }}
      >
        {/* Quiet outline icons align with the inset group separators. */}
        {iconComponent ? (
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={iconStyle}
          >
            {iconComponent}
          </View>
        ) : icon ? (
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={iconStyle}
          >
            <Feather
              name={icon}
              size={sizes.icon}
              color={danger ? colors.danger : grouped ? colors.muted : colors.blue}
            />
          </View>
        ) : null}

        {/* Center Label & Description */}
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          <Text
            style={{
              fontFamily: grouped ? type.medium : 'DMSans_600SemiBold',
              fontSize: type.field.fontSize,
              lineHeight: type.field.lineHeight,
              color: danger ? colors.danger : colors.navy,
            }}
          >
            {label}
          </Text>
          {description ? (
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: type.meta.fontSize,
                lineHeight: type.meta.lineHeight,
                color: colors.muted,
                marginTop: grouped ? space.xs : 1,
              }}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {/* Right Action / Chevron */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: space.sm }}>
          {rightElement}
          {busy ? (
            <ActivityIndicator size="small" color={colors.blue} />
          ) : showChevron ? (
            <Feather name="chevron-right" size={grouped ? sizes.icon : 15} color={grouped ? colors.muted : '#94A3B8'} />
          ) : null}
        </View>
      </Row>

      {/* Subtle Inset Divider */}
      {hasDivider ? (
        <View
          style={{
            height: settingsLayout.separatorWidth,
            backgroundColor: grouped ? colors.divider : '#F1F5F9',
            marginLeft: grouped ? space.lg + settingsLayout.iconSize + space.md : 47,
          }}
        />
      ) : null}
    </View>
  );
}
