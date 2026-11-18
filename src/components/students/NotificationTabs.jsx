import { ScrollView, View, TouchableOpacity } from 'react-native';
import { colors, sizes, radii, type, space, compact, motion } from '../../theme/tokens';
import { Text } from '../common/FontText';

export function filterNotifications(items, tab) {
  const cutoff = Date.now() - 30 * 86400000;
  return items.filter(item => new Date(item.created_at).getTime() >= cutoff)
    .filter(item => tab === 'Unread' ? !item.is_read : tab === 'Priority'
      ? item.is_priority || item.type === 'submission_priority_changed' : true);
}

export default function NotificationTabs({ value, onChange, variant = 'compact', showCounts = false, items = [], style }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ flexGrow: 0, marginVertical: space.xs }, style]}
      contentContainerStyle={{ gap: space.sm, paddingVertical: space.xs / 2 }}
    >
      {['All', 'Unread', 'Priority'].map(tab => {
        const isSelected = value === tab;
        const count = filterNotifications(items, tab).length;
        return (
          <TouchableOpacity
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={tab + ' notifications'}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(tab)}
            activeOpacity={motion.pressedOpacity}
            style={{ minHeight: sizes.touch, justifyContent: 'center' }}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.xs,
                minHeight: compact.chipHeight,
                paddingVertical: space.xs,
                paddingHorizontal: space.lg,
                borderRadius: radii.pill,
                backgroundColor: isSelected ? colors.blue : colors.selectedSurface,
                borderWidth: 1,
                borderColor: isSelected ? colors.blue : colors.border,
              }}
            >
              <Text
                style={{
                  ...type.label,
                  fontSize: type.field.fontSize,
                  lineHeight: type.field.lineHeight,
                  fontFamily: 'DMSans_500Medium',
                  color: isSelected ? colors.onBrand : colors.navy,
                }}
              >
                {tab}
              </Text>
              {showCounts ? (
                <Text
                  style={{
                    ...type.badge,
                    fontSize: type.meta.fontSize,
                    lineHeight: type.meta.lineHeight,
                    fontFamily: 'DMSans_500Medium',
                    color: isSelected ? colors.onBrand : colors.muted,
                  }}
                >
                  {count}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
