import { AppAlert as Alert } from '../common/AppDialog';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import UserAvatar from '../common/UserAvatar';
import SubmissionStatusBadge from './SubmissionStatusBadge';
import TicketBanner from './TicketBanner';
import { safeWebUrl } from './conversationPolicy.cjs';
import { colors, type } from '../../theme/tokens';

async function openFile(value) {
  const url = safeWebUrl(value);
  if (!url) { Alert.alert('File unavailable', 'A valid file link is not available.'); return; }
  try { await Linking.openURL(url); }
  catch { Alert.alert('Could not open file', 'Try again or contact OSA staff.'); }
}

export function SubmissionAttachmentRow({ name, url }) {
  return <TouchableOpacity accessibilityRole="link" accessibilityLabel={`Open ${name}`}
    onPress={() => openFile(url)} style={styles.file}>
    <Feather name="paperclip" size={20} color="white" />
    <Text style={styles.fileName}>{name}</Text>
    <Feather name="external-link" size={18} color="white" />
  </TouchableOpacity>;
}

export default function SubmissionTicket({ submission, viewerRole, access, user, submitter, handler }) {
  const date = submission.submitted_at ? new Date(submission.submitted_at) : null;
  const identity = access.owner ? user : access.staff ? submitter : undefined;
  const roleLabel = { student: 'Student', staff: 'OSA Staff', admin: 'Admin' }[identity?.role];
  // The API currently withholds ALL files from students, even before approval.
  const files = access.staff && submission.status !== 'rejected'
    ? (submission.documents || []).filter(doc => doc.is_current !== false) : [];
  const archives = access.staff && submission.status === 'approved' ? submission.drive_archives || [] : [];
  return <View style={styles.ticket}>
    <View style={styles.content}>
      <TicketBanner />
      <Text style={styles.category}>{[submission.category_name, submission.doc_type_name].filter(Boolean).join(' · ') || 'Submission'}</Text>
      <Text style={styles.title}>{submission.title || 'Untitled submission'}</Text>
      <View style={styles.meta}>
        <View style={styles.metaCell}><Text style={styles.label}>Date</Text><Text style={styles.value}>{date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unavailable'}</Text></View>
        <View style={styles.metaCell}><Text style={styles.label}>Time</Text><Text style={styles.value}>{date ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Unavailable'}</Text></View>
      </View>
      {handler?.changed_by_name ? <View style={styles.handler}>
        <UserAvatar uri={handler.changed_by_image_url} size={24} />
        <Text style={styles.handlerName}>Handled by {handler.changed_by_name}</Text>
      </View> : null}
      {submission.org_name ? <View style={styles.organization}><Text style={styles.label}>Organization</Text><Text style={styles.value}>{submission.org_name}</Text></View> : null}
      {submission.description ? <Text style={styles.description}>{submission.description}</Text> : null}
      <View style={styles.profileSection}>
        <View style={styles.identity}>
          <UserAvatar uri={identity?.image_url} size={34} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name}>{submission.submitted_by_name || 'Original submitter'}</Text>
            {submission.submitted_by_email ? <Text style={styles.email}>{submission.submitted_by_email}</Text> : null}
            <Text style={styles.role}>{roleLabel ? `${roleLabel} · Original submitter` : 'Original submitter'}</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <SubmissionStatusBadge status={submission.status} size="small" />
          {submission.priority_escalation ? <Text style={styles.priority}>Priority</Text> : null}
        </View>
      </View>
    </View>
    <View style={styles.tear}>
      <View style={[styles.cutout, { left: -10 }]} /><View style={[styles.cutout, { right: -10 }]} />
    </View>
    <View style={styles.strip}>
      {files.map(doc => <SubmissionAttachmentRow key={doc.document_id || doc.file_name} name={doc.file_name || 'Attached document'} url={doc.file_url} />)}
      {archives.map(archive => <SubmissionAttachmentRow key={archive.archive_id} name={`Archived · ${archive.file_name}`} url={archive.drive_view_link} />)}
      {!files.length && !archives.length ? <View style={styles.emptyFile}><Feather name="file-text" size={20} color="#DCEBFF" /><Text style={styles.emptyText}>
        {access.staff ? 'No digital attachment available. Physical files are handled by OSA.' : 'Physical submission · Digital documents are restricted to OSA staff.'}
      </Text></View> : null}
      {access.staff && submission.status === 'approved' && !archives.length ? <Text style={styles.emptyText}>No confirmed Drive archive yet.</Text> : null}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  ticket: { backgroundColor: colors.ticket, borderRadius: 20, marginBottom: 16, shadowColor: colors.navy, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  content: { padding: 12, gap: 6 }, category: { color: colors.ticketText, fontSize: 12, marginTop: 6 },
  title: { ...type.heading, color: 'white', fontSize: 18, lineHeight: 24 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 }, metaCell: { flexGrow: 1, flexBasis: 115 },
  label: { color: colors.ticketMuted, fontSize: 12 }, value: { color: 'white', fontSize: 14, lineHeight: 21 },
  organization: { marginTop: 4 }, description: { color: colors.ticketText, fontSize: 13, lineHeight: 20 },
  handler: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }, handlerName: { ...type.meta, color: colors.ticketText, flex: 1 },
  profileSection: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#FFFFFF55', paddingTop: 12, marginTop: 6 },
  identity: { flexDirection: 'row', flexGrow: 1, flexBasis: 180, minWidth: 0, gap: 10, alignItems: 'center' },
  name: { fontFamily: 'DMSans_700Bold', color: 'white', fontSize: 14 }, email: { color: colors.ticketMuted, fontSize: 11, lineHeight: 17 }, role: { color: colors.ticketMuted, fontSize: 11, marginTop: 3 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, maxWidth: '100%', flexShrink: 1 }, priority: { color: '#FFF0A6', fontSize: 11, fontFamily: 'DMSans_700Bold' },
  tear: { borderTopWidth: 1, borderColor: colors.ticketMuted, borderStyle: 'dashed', marginTop: 4, height: 1 },
  cutout: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#F3F3F3', position: 'absolute', top: -10 },
  strip: { padding: 12, gap: 8, backgroundColor: '#FFFFFF0D', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  file: { backgroundColor: '#FFFFFF22', borderRadius: 14, padding: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fileName: { color: 'white', flex: 1, fontSize: 13 }, emptyFile: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 3 }, emptyText: { color: colors.ticketText, fontSize: 12, lineHeight: 18, flexShrink: 1 },
});
