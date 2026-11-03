import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Text } from '../common/FontText';
import ConversationEntry from './ConversationEntry';
import { colors, type } from '../../theme/tokens';

export default function SubmissionConversation({ conversation, submissionId, scope, access, onAccessLost }) {
  const { logs, entries } = conversation;
  const count = logs.data?.pages[0]?.count ?? entries.length;
  return <View style={{ marginBottom: 8 }}>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
      <Text style={{ ...type.cardTitle, color: colors.text }}>Conversation</Text>
      <Text style={{ color: '#73819A', fontSize: 12 }}>{count} {count === 1 ? 'update' : 'updates'}</Text>
    </View>
    <View>
      {logs.isPending ? <ActivityIndicator color="#0863E8" style={{ padding: 8 }} /> : logs.isError ? <TouchableOpacity accessibilityRole="button" style={{ padding: 8 }} onPress={() => logs.refetch()}><Text style={{ color: '#B91C1C' }}>Could not load conversation. Tap to retry.</Text></TouchableOpacity> : !entries.length ? <Text style={{ color: '#64748B', padding: 8 }}>No review updates yet.</Text> : entries.map((log, index) => <ConversationEntry key={log.log_id} log={log} latest={index === 0} submissionId={submissionId} scope={scope} access={access} onReply={conversation.selectTarget} onAccessLost={onAccessLost} />)}
    </View>
    {logs.hasNextPage ? <TouchableOpacity accessibilityRole="button" disabled={logs.isFetchingNextPage} onPress={() => logs.fetchNextPage()} style={{ padding: 14, alignItems: 'center' }}><Text style={{ color: '#165BAB' }}>{logs.isFetchingNextPage ? 'Loading…' : 'Load earlier updates'}</Text></TouchableOpacity> : null}
  </View>;
}
