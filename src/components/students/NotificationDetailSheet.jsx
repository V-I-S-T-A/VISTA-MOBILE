import { View } from 'react-native';
import AppBottomSheet from '../common/AppBottomSheet';
import AppButton from '../common/AppButton';
import VistaIcon from '../common/VistaIcon';
import UserAvatar from '../common/UserAvatar';
import { Text } from '../common/FontText';
import { colors, space, type, notificationLayout } from '../../theme/tokens';
import { getStatus, formatTime } from './StudentNotificationListItem';

export default function NotificationDetailSheet({ notification, onClose, onOpenSubmission, returnFocusRef }) {
  const status = getStatus(notification?.submission_status, notification?.type);
  return <AppBottomSheet portal visible={!!notification} title="Notification details" onClose={onClose} returnFocusRef={returnFocusRef} contentStyle={{ gap: space.sm }}>
    {notification ? <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }}>
        <UserAvatar uri={notification.actor_image_url} size={notificationLayout.avatar} fallbackIcon={<VistaIcon name="file-text" size={18} color={colors.muted} />} />
        <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
          <Text accessibilityRole="header" style={{ ...type.cardTitle, color: colors.text }}>{notification.submission_title || (notification.submission_id ? `Submission ${notification.submission_id.slice(0, 8)}` : 'Submission update')}</Text>
          <Text style={{ ...type.meta, color: colors.muted }}>{status.label} · {formatTime(notification.created_at)}</Text>
          {notification.actor_name ? <Text style={{ ...type.meta, color: colors.muted }}>Updated by {notification.actor_name}</Text> : null}
        </View>
      </View>
      <Text selectable style={{ ...type.body, color: colors.text }}>{notification.message || 'There is an update on your submission.'}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {notification.submission_id ? <AppButton style={{ flexGrow: 1, flexBasis: 160 }} label="View submission" onPress={onOpenSubmission} /> : null}
        <AppButton style={{ flexGrow: 1, flexBasis: 80 }} label="Close" variant="secondary" onPress={onClose} />
      </View>
    </> : null}
  </AppBottomSheet>;
}
