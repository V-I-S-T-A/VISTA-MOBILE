import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Text } from '../common/FontText';
import UserAvatar from '../common/UserAvatar';
import SubmissionStatusBadge, { getSubmissionStatus } from './SubmissionStatusBadge';
import { surfaces } from '../../theme/layout';
import { colors, compact, type, cardTones, space, motion, notificationLayout } from '../../theme/tokens';

// Intl formatter construction is expensive in Hermes. Share it across cards
// instead of reconstructing one for every card on each navigation render.
const submissionDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function formatSubmissionDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  // Preserve the existing malformed-date fallback rather than throwing in render.
  return Number.isNaN(date.getTime()) ? date.toLocaleDateString() : submissionDateFormatter.format(date);
}

export default function SubmissionListCard({ submission, onPress, showSubmitterEmail = false }) {
  const { fontScale } = useWindowDimensions();
  const title = submission.title || 'Untitled submission';
  const date = formatSubmissionDate(submission.submitted_at);
  const tone = submission.priority_escalation
    ? cardTones.priority
    : cardTones[submission.status] || cardTones.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={motion.pressedOpacity}
      accessibilityRole="button"
      accessibilityLabel={`${submission.priority_escalation ? 'Priority, ' : ''}${title}, ${submission.org_name || 'Organization unavailable'}, ${getSubmissionStatus(submission.status).label}${showSubmitterEmail && submission.submitted_by_email ? `, ${submission.submitted_by_email}` : ''}. Open full submission details.`}
      style={[surfaces.card, styles.card]}
    >
      <View style={[styles.accent, { backgroundColor: tone.accent }]} />
      <UserAvatar uri={submission.org_image_url} size={notificationLayout.avatar || 30} />
      <View style={styles.content}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.title}>
          {title}
        </Text>
        <View style={[styles.row, styles.middleRow, fontScale > 1.2 && styles.largeRow]}>
          <View style={styles.metadata}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.org}>
              {submission.org_name || 'Organization unavailable'}
            </Text>
          </View>
          <SubmissionStatusBadge status={submission.status} size="mini" variant="dot" />
        </View>
        <View style={[styles.row, fontScale > 1.2 && styles.largeRow]}>
          <View style={styles.metadata}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.date}>
              {date}
            </Text>
          </View>
          {submission.priority_escalation ? (
            <View style={styles.priority}>
              <View style={styles.priorityDot} />
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
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: notificationLayout.paddingHorizontal || 12,
    paddingVertical: notificationLayout.paddingVertical || 8,
    marginBottom: notificationLayout.gap || 8,
    borderRadius: notificationLayout.radius || 20,
    borderWidth: 1,
    borderColor: colors.border,
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
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.xs,
  },
  middleRow: {
    marginTop: 1,
    marginBottom: 3,
  },
  largeRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 2,
  },
  title: {
    ...type.notificationTitle,
    fontFamily: type.bold,
    color: colors.navy,
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
    gap: 5,
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.priorityText,
  },
  priorityText: {
    fontFamily: type.bold,
    fontSize: type.meta.fontSize,
    lineHeight: type.meta.lineHeight,
    color: colors.priorityText,
    includeFontPadding: false,
  },
});
