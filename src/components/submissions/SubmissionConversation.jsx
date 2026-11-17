import { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ConversationSkeleton } from '../common/Skeleton';
import { Text } from '../common/FontText';
import ConversationEntry from './ConversationEntry';
import { colors, type } from '../../theme/tokens';
import { currentHistoryAttachments } from './attachmentPreviewPolicy.cjs';

const NO_DOCUMENTS = [];

export default function SubmissionConversation({ conversation, submissionId, scope, access, onAccessLost, onEntryLayout, documents = NO_DOCUMENTS }) {
  const { logs, entries } = conversation;
  // Composer keystrokes do not change saved history or attachment permissions.
  const attachments = useMemo(() => entries.map(log => currentHistoryAttachments(log, entries, documents, access.staff)), [entries, documents, access.staff]);
  const count = logs.data?.pages[0]?.count ?? entries.length;
  return <View style={{ marginBottom: 8 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
      <Text style={{ ...type.cardTitle, color: colors.text }}>Conversation</Text>
      <Text style={{ color: '#73819A', fontSize: type.meta.fontSize }}>{count} {count === 1 ? 'update' : 'updates'}</Text>
    </View>
    <View onLayout={event => onEntryLayout?.('__heading', event.nativeEvent.layout.y)}>
      {logs.isPending ? <ConversationSkeleton /> : logs.isError ? <TouchableOpacity accessibilityRole="button" style={{ padding: 8 }} onPress={() => logs.refetch()}><Text style={{ color: colors.danger }}>Could not load conversation. Tap to retry.</Text></TouchableOpacity> : !entries.length ? <Text style={{ color: colors.muted, padding: 8 }}>No review updates yet.</Text> : entries.map((log, index) => <ConversationEntry onLayout={event => onEntryLayout?.(log.log_id, event.nativeEvent.layout.y)} key={log.log_id} log={log} latest={index === 0} submissionId={submissionId} scope={scope} access={access} conversation={conversation} onAccessLost={onAccessLost} attachments={attachments[index]} />)}
    </View>
    {logs.hasNextPage ? <TouchableOpacity accessibilityRole="button" disabled={logs.isFetchingNextPage} onPress={() => logs.fetchNextPage()} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: '#165BAB' }}>{logs.isFetchingNextPage ? 'Loading…' : 'Load earlier updates'}</Text></TouchableOpacity> : null}
  </View>;
}
