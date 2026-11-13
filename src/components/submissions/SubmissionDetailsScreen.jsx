import { useCallback, useEffect, useState } from 'react';
import { Keyboard, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../common/FontText';
import { DetailsSkeleton } from '../common/Skeleton';
import AccountHeader from '../common/AccountHeader';
import PageHeading from '../common/PageHeading';
import BackButton from '../common/BackButton';
import StaffBottomNav from '../staff/StaffBottomNav';
import StudentBottomNav from '../students/StudentBottomNav';
import DriveArchiveCard from '../staff/DriveArchiveCard';
import { useAuth } from '../../context/AuthContext';
import { useStaffLayout, panelStyles, useBottomNavClearance } from '../../theme/layout';
import { submissionsService } from '../../services/submissionsService';
import { usersService } from '../../services/usersService';
import { openDocumentEntryWithAttachment } from '../../utils/openDocumentEntryWithAttachment';
import useSubmissionConversation from '../../hooks/useSubmissionConversation';
import { capabilities, viewerScope } from './conversationPolicy.cjs';
import SubmissionTicket from './SubmissionTicket';
import SubmissionConversation from './SubmissionConversation';
import ReplyComposer from './ReplyComposer';
import StaffStatusSheet from './StaffStatusSheet';
import ReviewDriveTask from './ReviewDriveTask';

export default function SubmissionDetailsScreen(props) {
  const { user } = useAuth();
  const scope = viewerScope(user);
  const id = props.route?.params?.submission?.submission_id || props.route?.params?.submissionId;
  // Account, membership and submission changes reset selections and the sheet.
  return <ScopedDetails key={`${scope}:${id}`} {...props} user={user} scope={scope} id={id} />;
}

function ScopedDetails({ navigation, user, scope, id }) {
  const client = useQueryClient();
  const layout = useStaffLayout();
  const footerClearance = typeof useBottomNavClearance === 'function' ? useBottomNavClearance() : 68;
  const [sheet, setSheet] = useState(false);
  const [lost, setLost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const tasksKey = ['drive', 'review-tasks', scope, id];
  const [driveTasks, setDriveTasks] = useState(() => client.getQueryData?.(tasksKey) || []);
  const trackUpload = task => setDriveTasks(current => {
    const next = current.some(item => item.taskId === task.taskId) ? current : [...current, task];
    client.setQueryData(tasksKey, next);
    return next;
  });
  const archiveComplete = useCallback(() => {
    client.invalidateQueries({ queryKey: ['submissions', id, scope] });
    client.invalidateQueries({ queryKey: ['review-logs', id, scope] });
  }, [client, id, scope]);
  const detail = useQuery({ queryKey: ['submissions', id, scope], queryFn: () => submissionsService.getSubmission(id), enabled: !!id && !!user,
    staleTime: 0, refetchOnMount: 'always', retry: false });
  const access = capabilities(detail.data, user);
  const ready = detail.isFetchedAfterMount && !!detail.data && !detail.isError && !lost;
  const submitter = useQuery({ queryKey: ['submission-submitter', id, scope, detail.data?.submitted_by],
    queryFn: () => usersService.getSubmissionSubmitter(detail.data),
    enabled: ready && access.staff && !!detail.data?.submitted_by_email, retry: false });
  const onAccessLost = useCallback(() => {
    setLost(true); setSheet(false); Keyboard.dismiss();
    client.removeQueries({ queryKey: ['review-replies', id, scope] });
    client.removeQueries({ queryKey: ['review-drafts', id, scope] });
  }, [client, id, scope]);
  const conversation = useSubmissionConversation({ submissionId: id, scope, access, enabled: ready, onAccessLost });
  useEffect(() => { if ([403, 404].includes(detail.error?.status)) onAccessLost(); }, [detail.error, onAccessLost]);
  const refresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await detail.refetch();
      if (!fresh.isError) {
        setLost(false);
        await client.invalidateQueries({ queryKey: ['review-logs', id, scope] });
        await client.invalidateQueries({ queryKey: ['review-replies', id, scope] });
        if (access.staff) await client.invalidateQueries({ queryKey: ['drive'] });
      }
    } finally { setRefreshing(false); }
  };
  const confirmStatus = async () => {
    const fresh = await detail.refetch();
    if (fresh.isError) throw fresh.error;
    const history = await conversation.logs.refetch();
    if (history.isError) throw history.error;
    setSheet(false);
  };
  const composerVisible = ready && !access.viewOnly && (access.staff || conversation.hasReply) && !!conversation.target;
  const closedComposerOffset = Math.max(52, footerClearance - 8);
  return <View style={{ flex: 1, backgroundColor: '#F3F3F3' }}>
      <View style={[{ flex: 1 }, layout.body]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: composerVisible ? closedComposerOffset + 104 : footerClearance }}>
          <AccountHeader profileRoute={access.staff ? 'StaffProfile' : 'StudentProfile'} />
          <PageHeading title="Track Details" subtitle="Submission & conversation" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}><BackButton /><Text style={{ fontSize: 13, color: '#173866' }}>Track Details</Text></View>
          {(detail.isPending || (!detail.isFetchedAfterMount && !detail.isError)) && id ? <DetailsSkeleton staff={access.staff} /> : !ready ? <View style={{ paddingVertical: 28 }}>
            <Text style={{ color: '#64748B', marginBottom: 12 }}>{lost ? 'This submission is no longer accessible. Reload to verify your access.' : id ? 'Could not load submission details.' : 'No submission selected.'}</Text>
            {id ? <TouchableOpacity accessibilityRole="button" onPress={refresh} style={panelStyles.touch}><Text style={{ color: '#165BAB' }}>Reload submission</Text></TouchableOpacity> : null}
          </View> : <>
            {access.viewOnly ? <View style={{ backgroundColor: '#E8EFF8', borderRadius: 12, padding: 12, marginBottom: 12 }}><Text style={{ color: '#38557B', fontSize: 12 }}>Organization Submission — View Only</Text></View> : null}
            <SubmissionTicket submission={detail.data} viewerRole={user.role} access={access} user={user} submitter={access.staff ? submitter.data : undefined} handler={conversation.entries[0]} />
            <SubmissionConversation conversation={conversation} submissionId={id} scope={scope} access={access} onAccessLost={onAccessLost} />
            {access.staff ? driveTasks.map(task => <ReviewDriveTask key={task.taskId} task={task} onComplete={archiveComplete} />) : null}
            {access.staff ? <DriveArchiveCard submission={detail.data} /> : null}
          </>}
        </ScrollView>
      </View>
    {composerVisible ? <KeyboardStickyView
      offset={{ closed: -closedComposerOffset, opened: 0 }}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
      <View style={[layout.horizontal, { paddingTop: 4, paddingBottom: 4, backgroundColor: '#F3F3F3' }]}>
        <ReplyComposer conversation={conversation} onStatus={access.staff ? () => { Keyboard.dismiss(); setSheet(true); } : undefined} />
      </View>
    </KeyboardStickyView> : null}
    {access.staff ? (
      <StaffBottomNav activeTab="reports" onScanPress={() => openDocumentEntryWithAttachment(navigation)} onHomePress={() => navigation.navigate('StaffHome')} onProfilePress={() => navigation.navigate('StaffDocumentEntry')} onReportsPress={() => navigation.navigate('StaffReviewPanel')} onCloudPress={() => navigation.navigate('GDriveSync')} />
    ) : (
      <StudentBottomNav activeTab="tracker" onHomePress={() => navigation.navigate('StudentHome')} onTrackerPress={() => navigation.navigate('StudentTracker')} />
    )}
    {ready && access.staff ? <StaffStatusSheet visible={sheet} submission={detail.data} onClose={() => setSheet(false)} onConfirmed={confirmStatus} onQueued={trackUpload} /> : null}
  </View>;
}
