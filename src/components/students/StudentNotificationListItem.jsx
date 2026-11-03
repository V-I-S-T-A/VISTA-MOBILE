import { useRef } from 'react';
import VistaIcon from '../common/VistaIcon';
import UserAvatar from '../common/UserAvatar';
import { colors, radii, type, notificationLayout, sizes } from '../../theme/tokens';
import { TouchableOpacity, View } from "react-native";
import { Text } from "../common/FontText";
import { getSubmissionStatus } from '../submissions/SubmissionStatusBadge';

export function getStatus(status = "", itemType = "") {
  if (itemType === "drive_upload_pending") {
    return { label: "Uploading", color: "#1F5CAE", background: "#EDF4FF" };
  }
  if (itemType === "drive_upload_success") {
    return { label: "Uploaded", color: "#15803D", background: "#DCFCE7" };
  }
  if (itemType === "drive_upload_error") {
    return { label: "Upload failed", color: "#B91C1C", background: "#FEE2E2" };
  }
  if (itemType === "submission_priority_changed") {
    return { label: "Priority", color: "#765700", background: "#FFF0C2" };
  }
  if (status) {
    const saved = getSubmissionStatus(status);
    return { label: saved.label, color: saved.foreground, background: saved.background };
  }
  return { label: "Pending", color: "#4B5563", background: "#F0F2F5" };
}

export function relativeTimestamp(value, now = Date.now()) {
  if (!value) return "";
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return "";
  const minutes = Math.max(0, Math.floor((now - date) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StudentNotificationListItem({ notification, onPress }) {
  const trigger = useRef(null);
  const status = getStatus(notification.submission_status, notification.type);
  const fallbackId = notification.submission_id?.slice(0, 8);
  const title = notification.submission_title ||
    (fallbackId ? `Submission ${fallbackId}` : "Submission update");
  const isPriority = notification.is_priority || notification.type === 'submission_priority_changed';
  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity
      ref={trigger}
      onPress={() => onPress?.(trigger)}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${notification.is_read ? 'Read' : 'Unread'}, ${status.label}, ${notification.message || 'There is an update on your submission.'}${notification.actor_name ? `, Updated by ${notification.actor_name}` : ''}, ${formatTime(notification.created_at)}`}
      style={{
        minHeight: sizes.touch,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: notificationLayout.paddingHorizontal || 11,
        paddingVertical: notificationLayout.paddingVertical || 7.5,
        marginBottom: notificationLayout.gap || 5,
        borderRadius: notificationLayout.radius || 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#183A60',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <UserAvatar
        uri={notification.actor_image_url}
        size={notificationLayout.avatar || 30}
        fallbackIcon={
          <VistaIcon
            name={
              notification.type?.startsWith('drive_')
                ? 'upload-cloud'
                : isPriority
                  ? 'flag'
                  : 'file-text'
            }
            size={16}
            color={colors.muted}
          />
        }
      />
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        {/* Line 1: Title & Unread indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Text
            numberOfLines={notificationLayout.titleLines || 1}
            ellipsizeMode="tail"
            style={{
              ...type.notificationTitle,
              fontFamily: isUnread ? 'DMSans_700Bold' : 'DMSans_500Medium',
              color: isUnread ? '#142B52' : '#475569',
              flex: 1,
              minWidth: 0,
            }}
          >
            {title}
          </Text>
          {isUnread ? (
            <View
              accessibilityLabel="Unread"
              style={{
                width: notificationLayout.unread || 6,
                height: notificationLayout.unread || 6,
                borderRadius: (notificationLayout.unread || 6) / 2,
                backgroundColor: isPriority ? '#DC2626' : '#1A59A5',
                flexShrink: 0,
              }}
            />
          ) : null}
        </View>

        {/* Line 2: Message preview */}
        <Text
          numberOfLines={notificationLayout.previewLines || 1}
          ellipsizeMode="tail"
          style={{
            ...type.notificationPreview,
            fontFamily: isUnread ? 'DMSans_500Medium' : 'DMSans_400Regular',
            color: isUnread ? '#334155' : '#64748B',
            marginTop: 1,
            marginBottom: 3,
          }}
        >
          {notification.message || 'There is an update on your submission.'}
        </Text>

        {/* Line 3: Compact Status & Timestamp on the same line */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1.5,
              borderRadius: radii.pill,
              backgroundColor: status.background,
            }}
          >
            <Text
              style={{
                ...type.notificationBadge,
                color: status.color,
              }}
            >
              {status.label}
            </Text>
          </View>
          <Text style={{ fontSize: 8, color: '#94A3B8' }}>•</Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              ...type.notificationMeta,
              color: '#64748B',
              flexShrink: 1,
            }}
          >
            {relativeTimestamp(notification.created_at) || formatTime(notification.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
