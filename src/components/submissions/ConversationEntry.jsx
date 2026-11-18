import { AppAlert as Alert } from '../common/AppDialog';
import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { RepliesSkeleton } from '../common/Skeleton';
import { Feather } from '@expo/vector-icons';
import { type, sizes, colors, radii, space } from '../../theme/tokens';
import { Text } from '../common/FontText';
import UserAvatar from '../common/UserAvatar';
import { getSubmissionStatus } from './SubmissionStatusBadge';
import { reviewLogsService } from '../../services/reviewLogsService';
import { canReplyTo, nextPage, safeWebUrl, uniqueRows } from './conversationPolicy.cjs';
import { SubmissionAttachmentRow } from './SubmissionTicket';

const timestamp = value => value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Date unavailable';

export const relativeTimestamp = (value, now = Date.now()) => {
  const date = new Date(value).getTime();
  if (!value || !Number.isFinite(date)) return 'Date unavailable';
  const minutes = Math.max(0, Math.floor((now - date) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

export function MessageText({ message }) {
  return <Text selectable style={styles.message}>{message.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    const url = /^https?:\/\//.test(part) && safeWebUrl(part);
    return url ? <Text key={index} accessibilityRole="link" style={{ color: '#165BAB', textDecorationLine: 'underline' }} onPress={async () => {
      try { await Linking.openURL(url); } catch { Alert.alert('Could not open link', 'Please check the link and try again.'); }
    }}>{part}</Text> : part;
  })}</Text>;
}

function Author({ name, image, role, time }) {
  return <View style={styles.author}>
    <UserAvatar uri={image} size={28} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={styles.nameRow}><Text style={styles.name}>{name || 'Former user'}</Text><Text style={styles.role}>{role}</Text></View>
      <Text style={styles.time}>{timestamp(time)}</Text>
    </View>
  </View>;
}

export function ThreadedReply({ reply, canReply, onReply }) {
  return <View style={[styles.reply, reply.parent_reply && styles.followup]}>
    <View style={styles.nameRow}><Text style={styles.name}>{reply.author_name || 'Former user'}</Text><Text accessibilityLabel={timestamp(reply.created_at)} style={styles.replyTime}>{relativeTimestamp(reply.created_at)}</Text></View>
    <MessageText message={reply.message} />
    {canReply ? <ReplyButton compact onPress={() => onReply(reply)} label={`Reply to ${reply.author_name || 'this message'}`} /> : null}
  </View>;
}

function ReplyButton({ onPress, label = 'Reply', compact }) {
  return <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
    style={compact ? styles.replyButtonCompact : styles.replyButton}
  >
    <Feather name="corner-up-left" size={compact ? 13 : 16} color="#536C92" /><Text style={compact ? styles.linkCompact : styles.link}>Reply</Text>
  </TouchableOpacity>;
}

export default function ConversationEntry({ log, latest, submissionId, scope, access, conversation, onAccessLost, onLayout, attachments = [] }) {
  const [expanded, setExpanded] = useState(false);
  // Old deployments do not advertise reply_count/can_reply. Keep history readable
  // without calling endpoints that have not been deployed there.
  const supportsReplies = typeof log.reply_count === 'number';
  const replies = useInfiniteQuery({
    queryKey: ['review-replies', submissionId, scope, log.log_id],
    queryFn: ({ pageParam, signal }) => reviewLogsService.getReplies(log.log_id, { page: pageParam, signal }),
    initialPageParam: 1, getNextPageParam: nextPage,
    enabled: expanded && supportsReplies, staleTime: 0, retry: false,
  });
  useEffect(() => { if ([403, 404].includes(replies.error?.status)) onAccessLost(); }, [replies.error, onAccessLost]);
  const rows = useMemo(() => replies.isError ? [] : uniqueRows(replies.data?.pages, 'reply_id'), [replies.isError, replies.data?.pages]);
  const count = replies.data?.pages[0]?.count ?? log.reply_count ?? 0;
  const permission = canReplyTo(log, access);
  const current = getSubmissionStatus(log.new_status);
  return <View onLayout={onLayout} style={styles.card}>
    <View style={styles.transition}>
      <View style={[styles.dot, { backgroundColor: current.foreground }]} />
      <Text style={styles.transitionText}>{log.old_status && log.old_status !== log.new_status ? `${getSubmissionStatus(log.old_status).label} → ` : ''}<Text style={{ color: current.foreground, fontFamily: 'DMSans_700Bold' }}>{current.label}</Text>{log.old_status === log.new_status ? ' · Review update' : ''}</Text>
      {latest ? <Text style={styles.latest}>Latest</Text> : null}
    </View>
    <View style={styles.entryBody}>
      <Author name={log.changed_by_name} image={log.changed_by_image_url} role="OSA Staff" time={log.changed_at} />
      {log.remarks_text ? <MessageText message={log.remarks_text} /> : <Text style={styles.context}>Status recorded by OSA.</Text>}
      {log.attachment_change?.action ? <View>
        <Text style={styles.context}>Attachment {log.attachment_change.action}</Text>
        {(log.attachment_change.new_files || []).map((name, index) => {
          const doc = access.staff && attachments.find(file => file.file_name === name);
          return doc ? <SubmissionAttachmentRow key={doc.document_id || doc.file_url} name={name} document={doc} history />
            : <Text key={`${name}:${index}`} style={styles.context}>{name}</Text>;
        })}
      </View> : null}
      <View style={styles.actions}>
        {permission ? <ReplyButton onPress={() => { setExpanded(true); conversation.selectTarget(log); }} /> : null}
        {supportsReplies && (count > 0 || expanded) ? <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.replyButton}><Text style={styles.link}>{expanded ? 'Hide replies' : `View replies (${count})`}</Text><Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#536C92" /></TouchableOpacity> : null}
      </View>
      {expanded ? <View style={styles.thread}>
        {replies.isPending ? <RepliesSkeleton canReply={permission} /> : null}
        {replies.isError ? <TouchableOpacity accessibilityRole="button" onPress={() => replies.refetch()} style={styles.retry}><Text style={styles.error}>Could not load replies. Tap to retry.</Text></TouchableOpacity> : null}
        {rows.map(reply => <ThreadedReply key={reply.reply_id} reply={reply} canReply={permission} onReply={parent => conversation.selectTarget(log, parent)} />)}
        {!replies.isPending && !replies.isError && !rows.length ? <Text style={styles.context}>No replies yet.</Text> : null}
        {replies.hasNextPage ? <TouchableOpacity disabled={replies.isFetchingNextPage} onPress={() => replies.fetchNextPage()} style={styles.retry}><Text style={styles.link}>{replies.isFetchingNextPage ? 'Loading…' : 'Load more replies'}</Text></TouchableOpacity> : null}
      </View> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: 'continuous', borderWidth: 1, borderColor: colors.border, paddingVertical: space.sm, paddingHorizontal: space.md, marginBottom: space.sm },
  transition: { backgroundColor: '#EDF5FF', borderRadius: radii.field, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6, gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 }, transitionText: { color: '#61708D', fontSize: type.meta.fontSize, flex: 1, lineHeight: type.meta.lineHeight }, latest: { color: '#165BAB', fontSize: type.meta.fontSize, fontFamily: 'DMSans_700Bold' },
  entryBody: { padding: 0, paddingTop: 4 }, author: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' }, name: { color: '#173866', ...type.notificationTitle, flexShrink: 1 },
  role: { backgroundColor: '#EDF5FF', color: '#1D62B0', fontSize: type.meta.fontSize, borderRadius: radii.chip, paddingHorizontal: 6, paddingVertical: 2 },
  time: { color: '#73819A', fontSize: type.meta.fontSize, marginTop: 2 },
  replyTime: { color: '#73819A', fontSize: type.meta.fontSize, marginTop: 0 },
  message: { ...type.conversation, color: colors.text },
  context: { color: colors.muted, fontSize: type.meta.fontSize, lineHeight: type.meta.lineHeight, marginBottom: 5 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  replyButton: { minHeight: sizes.touch, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.xs },
  replyButtonCompact: { minHeight: sizes.touch, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: 0, alignSelf: 'flex-start' },
  link: { color: '#536C92', fontSize: type.meta.fontSize },
  linkCompact: { color: '#536C92', fontSize: type.meta.fontSize, lineHeight: type.meta.lineHeight, fontFamily: 'DMSans_500Medium' },
  thread: { borderLeftWidth: 1, borderLeftColor: '#B9D6F7', paddingLeft: 6, gap: 2 }, reply: { paddingVertical: 2, paddingHorizontal: 0, paddingRight: 10 },
  followup: { borderLeftWidth: 1, borderLeftColor: '#97BFE9', marginLeft: 6 }, retry: { minHeight: sizes.touch, justifyContent: 'center' }, error: { color: colors.danger, ...type.meta },
});
