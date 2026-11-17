import { PullRefreshScrollView as ScrollView } from '../common/PullRefresh';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, RefreshControl, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../common/FontText';
import { DetailsSkeleton } from '../common/Skeleton';
import PageHeading from '../common/PageHeading';
import SubPageHeader from '../common/SubPageHeader';
import DriveArchiveCard from '../staff/DriveArchiveCard';
import { useAuth } from '../../context/AuthContext';
import { useStaffLayout, panelStyles } from '../../theme/layout';
import { submissionsService } from '../../services/submissionsService';
import { usersService } from '../../services/usersService';
import useSubmissionConversation from '../../hooks/useSubmissionConversation';
import { capabilities, viewerScope } from './conversationPolicy.cjs';
import SubmissionTicket from './SubmissionTicket';
import SubmissionConversation from './SubmissionConversation';
import ReplyComposer from './ReplyComposer';
import StaffStatusSheet from './StaffStatusSheet';
import ReviewDriveTask from './ReviewDriveTask';
import { colors, space, type, radii, sizes } from '../../theme/tokens';

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
  const insets = useSafeAreaInsets();
  const footerClearance = insets.bottom;
  const [sheet, setSheet] = useState(false);
  const [lost, setLost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scroll = useRef(null);
  const conversationTop = useRef(0);
  const entryOffsets = useRef({});
  const { progress } = useReanimatedKeyboardAnimation();
  const footerStyle = useAnimatedStyle(() => ({ height: footerClearance * (1 - progress.value), backgroundColor: colors.surface }), [footerClearance]);
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
    conversation.clearUpdateDraft?.();
    setSheet(false);
  };
  const composerVisible = ready && !access.viewOnly && (access.staff || (conversation.hasReply && !!conversation.target));
  const keepTargetVisible = () => {
    const key = conversation.target?.log.log_id;
    if (key && entryOffsets.current[key] != null) scroll.current?.scrollTo({ y: Math.max(0, conversationTop.current + (entryOffsets.current.__heading || 0) + entryOffsets.current[key] - space.sm), animated: false });
  };
  useEffect(keepTargetVisible, [conversation.target]);
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <View style={[{ flex: 1 }, layout.body]}>
        <SubPageHeader />
        <ScrollView
          alwaysBounceVertical overScrollMode="always"
          ref={scroll}
          style={{ flex: 1 }}
          onLayout={keepTargetVisible}
          // Reply focuses an input outside this ScrollView. Releasing that tap
          // must not blur it again; dragging still dismisses the keyboard.
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: composerVisible ? space.sm : Math.max(insets.bottom, space.lg) }}>
          <PageHeading title="Track Details" subtitle="Submission & conversation" compact />
          {(detail.isPending || (!detail.isFetchedAfterMount && !detail.isError)) && id ? <DetailsSkeleton staff={access.staff} /> : !ready ? <View style={{ paddingVertical: 28 }}>
            <Text style={{ color: colors.muted, marginBottom: 12 }}>{lost ? 'This submission is no longer accessible. Reload to verify your access.' : id ? 'Could not load submission details.' : 'No submission selected.'}</Text>
            {id ? <TouchableOpacity accessibilityRole="button" onPress={refresh} style={panelStyles.touch}><Text style={{ color: '#165BAB' }}>Reload submission</Text></TouchableOpacity> : null}
          </View> : <>
            {access.viewOnly ? <View style={{ backgroundColor: colors.selectedSurface, borderRadius: radii.field, padding: 12, marginBottom: 12 }}><Text style={{ color: '#38557B', fontSize: type.meta.fontSize }}>Organization Submission — View Only</Text></View> : null}
            <SubmissionTicket submission={detail.data} viewerRole={user.role} access={access} user={user} submitter={access.staff ? submitter.data : undefined} handler={conversation.entries[0]} />
            <View onLayout={event => { conversationTop.current = event.nativeEvent.layout.y; }}>
              <SubmissionConversation conversation={conversation} submissionId={id} scope={scope} access={access} documents={access.staff && detail.data.status !== 'rejected' ? detail.data.documents : []} onAccessLost={onAccessLost} onEntryLayout={(key, y) => { entryOffsets.current[key] = y; }} />
            </View>
            {access.staff ? driveTasks.map(task => <ReviewDriveTask key={task.taskId} task={task} onComplete={archiveComplete} />) : null}
            {access.staff ? <DriveArchiveCard submission={detail.data} /> : null}
          </>}
        </ScrollView>
      </View>
    {composerVisible ? <>
      <View style={{ width: '100%', maxWidth: sizes.contentWidth, alignSelf: 'center', backgroundColor: colors.surface }}>
        <ReplyComposer conversation={conversation} user={user} onStatus={access.staff ? () => { Keyboard.dismiss(); setSheet(true); } : undefined} />
      </View>
      <Animated.View accessible={false} style={footerStyle} />
    </> : null}
    </KeyboardAvoidingView>
    {ready && access.staff ? <StaffStatusSheet visible={sheet} submission={detail.data} initialRemarks={conversation.updateDraft || ''} onRemarksChange={conversation.changeUpdateDraft} onClose={() => setSheet(false)} onConfirmed={confirmStatus} onQueued={trackUpload} /> : null}
  </View>;
}
