import { ScrollView, View, TouchableOpacity } from 'react-native';
import { colors, sizes, radii, type } from '../../theme/tokens';
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
      style={[{ flexGrow: 0, marginVertical: 6 }, style]}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
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
            style={{ minHeight: sizes.touch, justifyContent: 'center' }}
            hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                height: 34,
                paddingHorizontal: 14,
                borderRadius: radii.pill,
                backgroundColor: isSelected ? '#FFC342' : '#EDF4FF',
                borderWidth: 1,
                borderColor: isSelected ? '#F0B32E' : '#DFEBFB',
              }}
            >
              <Text
                style={{
                  ...type.label,
                  fontSize: 12.5,
                  lineHeight: 16,
                  fontFamily: 'DMSans_500Medium',
                  color: isSelected ? '#513600' : '#142B52',
                }}
              >
                {tab}
              </Text>
              {showCounts ? (
                <Text
                  style={{
                    ...type.badge,
                    fontSize: 11,
                    lineHeight: 14,
                    fontFamily: 'DMSans_500Medium',
                    color: isSelected ? '#513600' : '#64748B',
                    opacity: isSelected ? 0.85 : 0.8,
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
