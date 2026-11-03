import { View } from 'react-native';
import { Text } from '../common/FontText';
import { colors, type } from '../../theme/tokens';

export default function SettingsSection({ title, children, style }) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      {title ? (
        <Text
          style={{
            ...type.meta,
            fontFamily: 'DMSans_600SemiBold',
            fontSize: 10.5,
            lineHeight: 14,
            letterSpacing: 0.7,
            color: '#FFFFFF',
            textTransform: 'uppercase',
            marginBottom: 5,
            marginLeft: 3,
          }}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          shadowColor: '#183A60',
          shadowOffset: { width: 0, height: 1.5 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        {children}
      </View>
    </View>
  );
}
