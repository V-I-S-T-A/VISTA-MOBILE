import AppInput from '../../../../components/common/AppInput';
import { AppAlert as Alert } from '../../../../components/common/AppDialog';
import { Text } from '../../../../components/common/FontText';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Switch, View } from 'react-native';
import SelectField from '../../../../components/staff/SelectField';
import AppButton from '../../../../components/common/AppButton';
import AppModal from '../../../../components/common/AppModal';
import AppBottomSheet from '../../../../components/common/AppBottomSheet';
import SubmissionStatusBadge from '../../../../components/submissions/SubmissionStatusBadge';
import StaffReviewFiles from '../../../../components/submissions/StaffReviewFiles';
import { STAFF_REVIEW_ACTIONS, validateDecision, isImage } from '../../../../components/submissions/staffReviewPolicy.cjs';
import { submitStaffReview } from '../../../../components/submissions/submitStaffReview.cjs';
import { colors, type, reviewControls } from '../../../../theme/tokens';
import { useUpdateSubmissionStatus } from '../../../../hooks/useSubmissions';
import { submissionsService } from '../../../../services/submissionsService';
import { reviewLogsService } from '../../../../services/reviewLogsService';
import { driveService } from '../../../../services/driveService';
import { prepareAttachment } from '../../../../services/prepareAttachment';

export default function ReviewDetailsActionCard({ submission, isLoading, onConfirmed, onBusyChange, onQueued }) {
  const [nextStatus, setNextStatus] = useState(() => STAFF_REVIEW_ACTIONS.find(action => action.id === submission?.status) || null);
  const [remarks, setRemarks] = useState('');
  const [priority, setPriority] = useState(!!submission?.priority_escalation);
  const [files, setFiles] = useState([]);
  const [attachmentAction, setAttachmentAction] = useState('add');
  const [finalFiles, setFinalFiles] = useState([]);
  const [reportFiles, setReportFiles] = useState([]);
  const [confirmation, setConfirmation] = useState(false);
  const [returnText, setReturnText] = useState('');
  const [drive, setDrive] = useState(null);
  const [driveError, setDriveError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false), journal = useRef({});
  const edits = useRef({ status: false, priority: false });
  const updateStatus = useUpdateSubmissionStatus();
  const busy = saving || updateStatus.isPending;
  useEffect(() => {
    if (!edits.current.priority) setPriority(!!submission?.priority_escalation);
    if (!edits.current.status) setNextStatus(STAFF_REVIEW_ACTIONS.find(action => action.id === submission?.status) || null);
  }, [submission?.status, submission?.priority_escalation]);
  useEffect(() => {
    if (nextStatus?.id !== 'approved') return;
    let cancelled = false;
    setDrive(null); setDriveError('');
    driveService.getConnection().then(value => { if (!cancelled) setDrive(value); }).catch(() => { if (!cancelled) setDriveError('Could not check Google Drive. You may save the decision; file uploads need a connected account.'); });
    return () => { cancelled = true; };
  }, [nextStatus?.id]);
  const isReport = !!submission?.is_accomplishment_report;
  const changeStatus = value => { edits.current.status = true; setNextStatus(value); setConfirmation(false); setReturnText(''); };
  const changePriority = value => { edits.current.priority = true; setPriority(value); };
  const returning = nextStatus?.id === 'rejected';
  const Confirmation = returning ? AppModal : AppBottomSheet;
  const unconverted = [...finalFiles, ...reportFiles].some(isImage);
  const save = async () => {
    if (pending.current) return;
    const status = nextStatus?.id;
    try { validateDecision({ status, currentStatus: submission.status, finalFiles: status === 'approved' ? finalFiles : [], reportFiles: status === 'approved' && isReport ? reportFiles : [], returnConfirmation: returnText }); }
    catch (error) { Alert.alert('Action required', error.message); return; }
    pending.current = true; setSaving(true); onBusyChange?.(true);
    try {
      const result = await submitStaffReview({ submission, status, remarks, priority,
        attachmentAction, file: status === 'under_review' ? files[0] : undefined,
        finalFiles: status === 'approved' ? finalFiles : [], reportFiles: status === 'approved' && isReport ? reportFiles : [],
        folderId: drive?.folder_id || drive?.target_folder_id, journal: journal.current, onQueued,
        services: {
          update: payload => updateStatus.mutateAsync(payload),
          getSubmission: id => submissionsService.getSubmission(id),
          listReviewLogs: id => reviewLogsService.listReviewLogs(id),
          prepareAttachment: async file => submissionsService.prepareStatusAttachment(file.type?.startsWith('image/') ? await prepareAttachment(file) : file),
          uploadDocument: payload => driveService.uploadDocument(payload),
        },
      });
      await onConfirmed?.();
      setConfirmation(false); setRemarks(''); setFiles([]); setFinalFiles([]); setReportFiles([]); journal.current = {};
      edits.current = { status: false, priority: false };
      setNextStatus(STAFF_REVIEW_ACTIONS.find(action => action.id === result.fresh.status) || null);
      setPriority(!!result.fresh.priority_escalation);
      Alert.alert('Updated', result.queued ? `Decision saved. ${result.queued} Drive upload(s) queued; delivery is not yet confirmed.` : status ? `${nextStatus.label} saved and confirmed.` : 'Remarks and priority saved.');
    } catch (error) { Alert.alert('Update not confirmed', error.message || 'Please retry. Your draft is retained.'); }
    finally { pending.current = false; setSaving(false); onBusyChange?.(false); }
  };
  const requestUpdate = () => {
    if (busy || pending.current) return;
    if (!nextStatus && !remarks.trim() && priority === !!submission?.priority_escalation) { Alert.alert('No changes', 'Choose a status, enter remarks, or change priority before updating.'); return; }
    Keyboard.dismiss();
    if (nextStatus?.id === 'approved' || nextStatus?.id === 'rejected') { setReturnText(''); setConfirmation(true); }
    else return save();
  };
  const closeConfirmation = () => { if (!pending.current) setConfirmation(false); };
  return <View style={styles.form}>
    <View style={styles.row}><Text style={styles.label}>Document status</Text><SubmissionStatusBadge status={submission?.status} size="mini" /></View>
    <SelectField size="compact" presentation="inline" accessibilityLabel="Document status" placeholder="Select Action..." style={{ marginBottom: 0 }} value={nextStatus} options={STAFF_REVIEW_ACTIONS} disabled={isLoading || busy} onChange={changeStatus} />
    <Text style={styles.label}>Reviewer remarks</Text>
    <AppInput accessibilityLabel="Reviewer remarks" value={remarks} editable={!busy} onChangeText={setRemarks} placeholder="Notes or revision requirements…" multiline style={styles.remarks} />
    <View style={styles.row}><Text style={styles.body}>Priority escalation</Text><Switch value={priority} onValueChange={changePriority} disabled={isLoading || busy} accessibilityLabel="Priority escalation" trackColor={{ false: '#CBD5E1', true: colors.yellow }} /></View>
    {nextStatus?.id === 'under_review' ? <StaffReviewFiles label="On Process attachment (optional)" files={files} onChange={setFiles} action={attachmentAction} onActionChange={setAttachmentAction} documents={submission.documents || []} disabled={busy} /> : null}
    <AppButton size="compact" label={busy ? 'Saving and confirming…' : 'Update Status'} accessibilityLabel="Update Status" variant="accent" busy={busy} disabled={busy || isLoading} onPress={requestUpdate} />
    <Confirmation visible={confirmation} title="Confirm approval & Drive" onClose={closeConfirmation} dismissible={!busy} busy={busy}>
      {returning ? <Text style={styles.title}>Return submission?</Text> : null}
      <Text style={styles.body}>{submission.title}</Text>
      {nextStatus?.id === 'rejected' ? <>
        <Text style={styles.meta}>Marks the entry as rejected and removes active attachment associations. The entry and review history remain.</Text>
        <AppInput accessibilityLabel="Type RETURNED to confirm" value={returnText} onChangeText={setReturnText} editable={!busy} placeholder="Type RETURNED" autoCapitalize="characters" autoCorrect={false} />
      </> : <>
        <Text style={styles.meta}>{drive?.connected ? `Drive: ${drive.folder_name || 'Google Drive (Root)'}` : driveError || (drive ? 'Google Drive is not connected. Connect it in Google Drive Sync to archive files.' : 'Checking Google Drive…')}</Text>
        <Text style={styles.meta}>Files are queued after the decision is saved. Approved copies use the existing automatic Drive folder structure.</Text>
        {isReport ? <StaffReviewFiles approval label="Accomplishment Report files (optional)" files={reportFiles} onChange={setReportFiles} disabled={busy} /> : null}
        <StaffReviewFiles approval label={submission.status === 'rejected' ? 'Approved document (required)' : 'Approved documents (optional)'} files={finalFiles} onChange={setFinalFiles} disabled={busy} />
      </>}
      <AppButton label={returning ? 'Return Submission' : 'Confirm Approved'} variant={returning ? 'destructive' : 'primary'} onPress={save} busy={busy} disabled={returning ? returnText !== 'RETURNED' : unconverted} />
      <AppButton label="Cancel" variant="secondary" onPress={closeConfirmation} disabled={busy} />
    </Confirmation>
  </View>;
}
const styles = StyleSheet.create({
  form: { gap: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { ...reviewControls.label, color: colors.text }, body: { ...reviewControls.value, color: colors.text, flexShrink: 1 }, meta: { ...type.meta, color: colors.muted }, title: { ...type.heading, color: colors.text },
  remarks: { minHeight: 64, maxHeight: 112, textAlignVertical: 'top', padding: 8, ...reviewControls.value },

});
