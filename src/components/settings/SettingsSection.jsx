import { View } from 'react-native';
import { Text } from '../common/FontText';
import { colors, type, radii, shadows, space } from '../../theme/tokens';

export default function SettingsSection({ title, children, style, variant = 'brand' }) {
  const grouped = variant === 'grouped';
  return (
    <View style={[{ marginBottom: grouped ? space.xxl : space.lg }, style]}>
      {title ? (
        <Text
          style={{
            ...type.meta,
            fontFamily: grouped ? type.medium : 'DMSans_600SemiBold',
            fontSize: type.meta.fontSize,
            lineHeight: type.meta.lineHeight,
            letterSpacing: grouped ? 0 : 0.7,
            color: grouped ? colors.muted : colors.onBrand,
            textTransform: 'uppercase',
            marginBottom: grouped ? space.sm : 5,
            marginLeft: grouped ? space.lg : 3,
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.listCard,
          borderCurve: 'continuous',
          borderWidth: grouped ? 0 : 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...(grouped ? {} : shadows.card),
        }}
      >
        {children}
      </View>
    </View>
  );
}
