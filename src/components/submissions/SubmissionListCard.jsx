import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from '../common/FontText';
import UserAvatar from '../common/UserAvatar';
import SubmissionStatusBadge, { getSubmissionStatus } from './SubmissionStatusBadge';
import { surfaces } from '../../theme/layout';
import { colors, compact, radii, type, cardTones } from '../../theme/tokens';

export default function SubmissionListCard({ submission, onPress, showSubmitterEmail = false }) {
  const { fontScale } = useWindowDimensions();
  const title = submission.title || 'Untitled submission';
  const date = submission.submitted_at
    ? new Date(submission.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const tone = submission.priority_escalation
    ? cardTones.priority
    : cardTones[submission.status] || cardTones.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${submission.priority_escalation ? 'Priority, ' : ''}${title}, ${submission.org_name || 'Organization unavailable'}, ${getSubmissionStatus(submission.status).label}${showSubmitterEmail && submission.submitted_by_email ? `, ${submission.submitted_by_email}` : ''}. Open full submission details.`}
      style={[surfaces.card, styles.card]}
    >
      <View style={[styles.accent, { backgroundColor: tone.accent }]} />
      <View style={styles.avatar}>
        <UserAvatar uri={submission.org_image_url} size={compact.avatar || 30} />
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
          {title}
        </Text>
        <View style={[styles.row, fontScale > 1.2 && styles.largeRow]}>
          <View style={styles.metadata}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.org}>
              {submission.org_name || 'Organization unavailable'}
            </Text>
          </View>
          <SubmissionStatusBadge status={submission.status} size="mini" />
        </View>
        <View style={[styles.row, fontScale > 1.2 && styles.largeRow]}>
          <View style={styles.metadata}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.date}>
              {date}
            </Text>
          </View>
          {submission.priority_escalation ? (
            <View style={styles.priority}>
              <Text style={styles.priorityText}>Priority</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: compact.paddingHorizontal || 11,
    paddingVertical: compact.paddingVertical || 7.5,
    marginBottom: compact.gutter || 5,
    borderRadius: radii.listCard || 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: colors.listSurface,
  },
  accent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: compact.accent || 3,
  },
  avatar: {
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#EEF2F6',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: compact.rowGap || 2.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  largeRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 2,
  },
  title: {
    ...type.listTitle,
    color: '#142B52',
    minWidth: 0,
    includeFontPadding: false,
  },
  metadata: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  org: {
    ...type.listOrg,
    color: colors.muted,
    flexShrink: 1,
    includeFontPadding: false,
  },
  date: {
    ...type.listDate,
    color: colors.muted,
    flexShrink: 1,
    includeFontPadding: false,
  },
  priority: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#FFF6D8',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    flexShrink: 0,
  },
  priorityText: {
    fontFamily: type.medium,
    fontSize: 9.5,
    lineHeight: 13,
    color: '#765700',
    includeFontPadding: false,
  },
});
