import { AppAlert as Alert } from '../../components/common/AppDialog';
import { Text } from "../../components/common/FontText";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl } from 'react-native';
import { useScreenRefresh } from '../../hooks/useScreenRefresh';
import { Feather } from "@expo/vector-icons";
import { surfaces, useStaffLayout } from "../../theme/layout";
import { submissionsService } from "../../services/submissionsService";
import DraftAttachmentPreview from '../../components/submissions/DraftAttachmentPreview';
import SubmissionTicket from '../../components/submissions/SubmissionTicket';
import SubPageHeader from '../../components/common/SubPageHeader';
import PageHeading from '../../components/common/PageHeading';
import { colors, motion, radii, reviewControls, sizes, space, type } from '../../theme/tokens';
import VistaProcessing from '../../components/common/VistaProcessing';

export default function StaffSubmissionConfirmation({ navigation, route }) {
  const screenLayout = useStaffLayout();
  const { draft, file: initialFile, labels = {} } = route.params || {};
  const [file, setFile] = useState(initialFile);
  const [busy, setBusy] = useState(false);
  const [createdSubmission, setCreatedSubmission] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const upload = useRef(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; upload.current?.abort(); };
  }, []);
  const attachFile = async submissionId => {
    const controller = new AbortController();
    upload.current = controller; setUploading(true);
    try {
      return await submissionsService.uploadSubmissionDocument(submissionId, file, {
        signal: controller.signal,
        onUploaded: () => { if (mounted.current) setUploading(false); },
      });
    } finally {
      if (upload.current === controller) upload.current = null;
      if (mounted.current) setUploading(false);
    }
  };
  const { refreshing, onRefresh } = useScreenRefresh([], async () => {
    // A pull only reads an already-created submission; it never submits a draft
    // or retries the attachment/create operation.
    if (!busy && createdSubmission?.submission_id) {
      const fresh = await submissionsService.getSubmission(createdSubmission.submission_id);
      if (fresh?.submission_id === createdSubmission.submission_id) setCreatedSubmission(fresh);
    }
  });

  const confirm = async () => {
    if (busy || createdSubmission) return;
    setBusy(true);
    setError("");
    try {
      const submission = await submissionsService.createSubmission(draft);
      if (!mounted.current) return;
      setCreatedSubmission(submission);
      if (file) await attachFile(submission.submission_id);
      if (!mounted.current) return;
      Alert.alert(
        "Submission created",
        "Your submission is ready for review.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("StaffReviewPanel"),
          },
        ],
      );
    } catch (e) {
      if (mounted.current) setError(
        e.message ||
          "Could not create the submission. Check your connection and retry.",
      );
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const [submittedAt] = useState(() => new Date().toISOString());
  const ticketSubmission = createdSubmission || {
    title: draft?.title,
    org_name: labels.organization,
    doc_type_name: labels.docType,
    category_name: labels.category,
    academic_year: labels.academicYear,
    submitted_by_name: labels.submittedBy,
    priority_escalation: draft?.priority_escalation,
    description: draft?.description,
    status: 'under_review',
    submitted_at: submittedAt,
    documents: file
      ? [{ document_id: 'draft-attachment', file_name: file.name || 'Attached document', file_url: file.uri, is_current: true }]
      : [],
  };
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, screenLayout.top]}>
      <View style={screenLayout.horizontal}>
        <SubPageHeader disabled={busy} />
      </View>
      <ScrollView
        alwaysBounceVertical overScrollMode="always"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} enabled={!busy} />}
        style={[{ flex: 1 }, screenLayout.horizontal]}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeading compact title="Review Submission" subtitle="Confirm details before creating." />

        <View style={styles.ticketWrap}>
          <SubmissionTicket
            submission={ticketSubmission}
            viewerRole="staff"
            access={{ staff: true, owner: false }}
          />
        </View>
        {file && !createdSubmission ? (
          <View style={styles.previewWrap}>
            <DraftAttachmentPreview file={file} compact onRemove={!busy ? () => setFile(null) : undefined} />
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            {createdSubmission ? (
              <Text style={styles.errorHint}>
                Submission {createdSubmission.submission_id} was created, but
                its attachment was not fully saved. Retry to finish attaching
                it.
              </Text>
            ) : null}
          </View>
        ) : null}
        {createdSubmission && error ? (
          <TouchableOpacity
            disabled={busy}
            activeOpacity={motion.pressedOpacity}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await attachFile(createdSubmission.submission_id);
                if (!mounted.current) return;
                Alert.alert(
                  "Attachment saved",
                  "The submission and attachment are ready for review.",
                  [
                    {
                      text: "OK",
                      onPress: () => navigation.navigate("StaffReviewPanel"),
                    },
                  ],
                );
              } catch (e) {
                if (mounted.current) setError(
                  e.message || "Attachment upload failed. Please retry.",
                );
              } finally {
                if (mounted.current) setBusy(false);
              }
            }}
            style={[styles.actionTarget, busy && { opacity: motion.disabledOpacity }]}
          >
            <View style={[styles.actionSurface, { backgroundColor: colors.blue }]}>
              {busy ? <ActivityIndicator color={colors.onBrand} /> : <Text style={[styles.actionText, { color: colors.onBrand }]}>Retry attachment upload</Text>}
            </View>
          </TouchableOpacity>
        ) : null}
        {createdSubmission && !error ? (
          <View style={styles.successWrap}>
            <Feather name="check-circle" size={32} color={colors.success} />
            <Text style={styles.successText}>
              Submission created successfully
            </Text>
          </View>
        ) : null}
        {!createdSubmission ? (
          <TouchableOpacity
            onPress={confirm}
            disabled={busy}
            activeOpacity={motion.pressedOpacity}
            style={[styles.actionTarget, busy && { opacity: motion.disabledOpacity }]}
          >
            <View style={[styles.actionSurface, { backgroundColor: colors.yellow }]}>
              {busy ? (
                <View style={styles.actionInner}>
                  <ActivityIndicator color={colors.onYellow} />
                  <Text style={[styles.actionText, { color: colors.onYellow, marginLeft: space.sm }]}>Creating submission…</Text>
                </View>
              ) : (
                <View style={styles.actionInner}>
                  <Text style={[styles.actionText, { color: colors.onYellow }]}>Confirm and submit</Text>
                  <Feather name="arrow-right" size={reviewControls.icon} color={colors.onYellow} style={{ marginLeft: space.sm }} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : null}
        {!createdSubmission ? (
          <Text style={styles.helperText}>
            You can go back to edit before confirming.
          </Text>
        ) : null}
      </ScrollView>
      <VistaProcessing visible={busy} message={uploading ? 'Uploading your attachment…' : 'Saving your submission…'} onCancel={uploading ? () => upload.current?.abort() : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  ticketWrap: {
    marginBottom: space.md,
  },
  previewWrap: {
    marginBottom: space.md,
  },
  errorCard: {
    marginBottom: space.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: reviewControls.radius,
    padding: space.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    ...reviewControls.value,
    color: colors.danger,
    marginLeft: space.sm,
    flex: 1,
  },
  errorHint: {
    ...reviewControls.label,
    color: colors.danger,
    marginTop: space.xs,
  },
  actionTarget: {
    minHeight: sizes.touch,
    justifyContent: 'center',
  },
  actionSurface: {
    minHeight: reviewControls.actionHeight,
    borderRadius: reviewControls.radius,
    paddingVertical: 4,
    paddingHorizontal: reviewControls.padding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...reviewControls.action,
    textAlign: 'center',
  },
  successWrap: {
    marginTop: space.lg,
    alignItems: 'center',
  },
  successText: {
    ...type.sectionTitle,
    color: colors.success,
    marginTop: space.sm,
  },
  helperText: {
    ...type.meta,
    color: colors.muted,
    textAlign: 'center',
    marginTop: space.xs,
  },
});
