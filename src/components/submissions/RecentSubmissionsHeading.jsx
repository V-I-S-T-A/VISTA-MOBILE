import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from '../common/FontText';
import { colors, compact, type } from '../../theme/tokens';

export default function RecentSubmissionsHeading({ onViewAll }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Submissions</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="View all submissions"
        onPress={onViewAll}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.action}
      >
        <Text style={styles.actionText}>View All</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: compact.gutter || 5,
  },
  title: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  actionText: {
    fontFamily: type.bold,
    fontSize: 10,
    lineHeight: 14,
    color: colors.blue,
    includeFontPadding: false,
  },
});
