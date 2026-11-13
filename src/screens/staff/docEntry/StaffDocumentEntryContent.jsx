import { useBottomNavClearance } from '../../../theme/layout';
import TextInput from '../../../components/common/AppInput';
import AppButton from '../../../components/common/AppButton';
import { AppAlert as Alert } from '../../../components/common/AppDialog';
import PageHeading from "../../../components/common/PageHeading";
import { prepareAttachment } from '../../../services/prepareAttachment';
import DraftAttachmentPreview from '../../../components/submissions/DraftAttachmentPreview';
import VistaProcessing from '../../../components/common/VistaProcessing';
import { FormSkeleton } from '../../../components/common/Skeleton';
import { Text } from '../../../components/common/FontText';
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Image, TouchableOpacity, ScrollView, ActivityIndicator, Switch, StyleSheet } from 'react-native';
import VistaIcon from '../../../components/common/VistaIcon';
import { colors, form, space, radii, sizes, type } from '../../../theme/tokens';

import SelectField from "../../../components/staff/SelectField";
import { scanDocument, pickDocumentFile } from "../../../utils/documentScan";
import { useAutofillDocument } from "../../../hooks/useSubmissions";
import { useActiveAcademicYear } from "../../../hooks/useAcademicYears";
import { useOrganizations, useOrganizationUsers } from "../../../hooks/useOrganizations";
import { useCategories } from "../../../hooks/useCategories";
import { useDocumentTypes } from "../../../hooks/useDocumentTypes";
import AccountHeader from "../../../components/common/AccountHeader";
import { normalizeDocumentCode } from "../../../utils/documentCode.cjs";
function toOption(row, idField, labelFn) {
  return { id: row[idField], label: labelFn(row) };
}

export default function StaffDocumentEntryContent({ navigation, initialAttachment }) {
  const footerClearance = useBottomNavClearance();
  const attachmentTrigger = useRef(null);
  // --- form state -----------------------------------------------------
  const [organization, setOrganization] = useState(null); // { id, label }
  const [docType, setDocType] = useState(null);
  const [category, setCategory] = useState(null);
  const [academicYear, setAcademicYear] = useState(null);
  const [submittedBy, setSubmittedBy] = useState(null);
  const [title, setTitle] = useState("");
  const titleEdited = useRef(false);
  const [description, setDescription] = useState("");
  const [ocrNotice, setOcrNotice] = useState(null); // { template, confidence, needsReview[] }
  const [scannedFile, setScannedFile] = useState(null); // { uri, name, type }
  const [ocrDraft, setOcrDraft] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [priority, setPriority] = useState(false);

  // --- reference data ---------------------------------------------------
  const { data: organizations = [], isLoading: loadingOrgs } =
    useOrganizations();
  const { data: categories = [], isLoading: loadingCategories } =
    useCategories();
  const { data: documentTypes = [], isLoading: loadingDocTypes } =
    useDocumentTypes();
  const { data: activeAcademicYear, isLoading: loadingAcademicYear } = useActiveAcademicYear();
  const { data: orgUsers = [], isLoading: loadingOrgUsers } =
    useOrganizationUsers(organization?.id);

  const orgOptions = useMemo(
    () => organizations.map((o) => toOption(o, "org_id", (r) => r.name)),
    [organizations],
  );
  const categoryOptions = useMemo(
    () => categories.map((c) => toOption(c, "category_id", (r) => r.name)),
    [categories],
  );
  const docTypeOptions = useMemo(
    () => documentTypes.map((d) => toOption(d, "doc_type_id", (r) => r.name)),
    [documentTypes],
  );
  const submittedByOptions = useMemo(
    () =>
      orgUsers.map((u) =>
        toOption(u, "user_id", (r) => `${r.first_name} ${r.last_name}`),
      ),
    [orgUsers],
  );

  // Academic Year: auto-selected from the active year, per business rule --
  // staff shouldn't need to touch this unless requirements change.
  useEffect(() => {
    if (activeAcademicYear && !academicYear) {
      setAcademicYear({
        id: activeAcademicYear.academic_year_id,
        label: activeAcademicYear.year,
      });
    }
  }, [activeAcademicYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Submitted By: re-resolve whenever the detected/selected organization
  // changes. Field stays editable -- this only pre-selects when there's an
  // unambiguous single match.
  useEffect(() => {
    if (
      submittedBy &&
      !submittedByOptions.some((option) => option.id === submittedBy.id)
    ) {
      setSubmittedBy(null);
    }

    if (submittedByOptions.length === 1) {
      setSubmittedBy(submittedByOptions[0]);
    }
  }, [submittedByOptions, submittedBy]);

  // --- OCR autofill + create submission mutations -----------------------
  const autofillMutation = useAutofillDocument();
  const runAutofillRef = useRef(null);
  useEffect(() => {
    if (!organization) return;
    const full = organizations.find(item => String(item.org_id) === String(organization.id));
    if (full && full.name !== organization.label) setOrganization({ id: full.org_id, label: full.name });
  }, [organizations, organization]);

  const runAutofill = async (file) => {
    setProcessing(true);
    try {
      // const file = await scanDocument();
      // if (!file) return; // staff cancelled the scan

      setScannedFile(null);
      const prepared = await prepareAttachment(file);
      setScannedFile(prepared);
      const draft = await autofillMutation.mutateAsync(file);
      setOcrDraft(draft);

      if (draft.status !== "draft_pending_review") {
        setOcrNotice({ unrecognized: true, bestScore: draft.best_score });
        return;
      }

      // --- Organization: from OCR's org suggestion, still editable ---
      if (draft.suggested_org_id) {
        const matched = organizations.find(
          (o) => String(o.org_id) === String(draft.suggested_org_id),
        );
        setOrganization({
          id: draft.suggested_org_id,
          label:
            matched?.name ||
            draft.fields?.organization_name?.value ||
            "Detected organization",
        });
      }

      // --- Document type: from OCR's doc_type suggestion ---
      if (draft.suggested_doc_type_id) {
        const matched = documentTypes.find(
          (d) => d.doc_type_id === draft.suggested_doc_type_id,
        );
        setDocType({
          id: draft.suggested_doc_type_id,
          label: matched?.name || draft.display_name,
        });
      }

      // --- Category: from OCR's checkbox-derived suggestion ---
      if (draft.suggested_category_id) {
        const matched = categories.find(
          (c) => c.category_id === draft.suggested_category_id,
        );
        setCategory({
          id: draft.suggested_category_id,
          label: matched?.name || "Detected category",
        });
      }

      // Match web autofill; preserve a title already entered by staff.
      if (!titleEdited.current) setTitle(draft.display_name || '');

      // --- Description: populate from any other OCR field text, purely
      // as a starting point staff can edit/clear before submitting ---
      const documentCode = normalizeDocumentCode(
        draft.fields?.document_code?.value,
      );
      if (documentCode && !draft.fields?.document_code?.needs_review) {
        setDescription((prev) => prev || `Document code: ${documentCode}`);
      }

      // Surface anything OCR flagged for review, without blocking submit.
      const needsReview = Object.entries(draft.fields || {})
        .filter(([, field]) => field?.needs_review)
        .map(([name]) => name);

      setOcrNotice({
        template: draft.display_name,
        confidence: draft.template_confidence,
        needsReview,
      });
    } catch (error) {
      Alert.alert(
        "Document recognition failed",
        error.message || "Could not read this document. Please try another file or try again.",
      );
    } finally { setProcessing(false); }
  };

  runAutofillRef.current = runAutofill;

  useEffect(() => {
    if (!initialAttachment?.uri) return;

    const attachment = {
      uri: initialAttachment.uri,
      name: initialAttachment.name,
      type: initialAttachment.type,
    };
    navigation.setParams({ attachment: undefined });
    runAutofillRef.current?.(attachment);
  }, [
    initialAttachment?.uri,
    initialAttachment?.name,
    initialAttachment?.type,
    navigation,
  ]);

  const handleAttachDocument = () => {
    Alert.alert(
      "Attach Document",
      "Scan a physical document with your camera, or choose an existing file.",
      [
        {
          text: "Scan with Camera",
          onPress: async () => {
            try {
              const file = await scanDocument();
              if (file) runAutofill(file);
            } catch (error) {
              Alert.alert(
                "Scan failed",
                error?.message || "Could not scan the document. Please try again.",
              );
            }
          },
        },
        {
          text: "Choose File (PDF/Image)",
          onPress: async () => {
            try {
              const file = await pickDocumentFile();
              if (file) runAutofill(file);
            } catch (error) {
              Alert.alert(
                "File selection failed",
                error?.message || "Could not choose that file. Please try again.",
              );
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { returnFocusRef: attachmentTrigger },
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a document title.");
      return;
    }
    if (!organization || !category || !docType) {
      Alert.alert(
        "Missing fields",
        "Organization, document type, and category are required.",
      );
      return;
    }

    navigation.navigate("StaffSubmissionConfirmation", { draft: {
        doc_type_id: docType.id,
        org_id: organization.id,
        category_id: category.id,
        academic_year_id: academicYear?.id,
        submitted_by: submittedBy?.id,
        title: title.trim(),
        priority_escalation: priority,
        ...(description.trim() ? { description: description.trim() } : {}),
      }, file: scannedFile, labels: { organization: organization.label, docType: docType.label, category: category.label, academicYear: academicYear?.label, submittedBy: submittedBy?.label } });
  };

  const isBusy =
    autofillMutation.isPending || processing;

  return (
    <ScrollView
      className="flex-1 pt-2"
      contentContainerStyle={{ paddingBottom: footerClearance }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <AccountHeader profileRoute="StaffProfile" />

      <PageHeading compact title="Document Entry" subtitle="Registration Portal." />

      {loadingOrgs || loadingCategories || loadingDocTypes || loadingAcademicYear ? <FormSkeleton compact /> : <View style={styles.form}>
        <SelectField
          size="compact"
          label="Organization"
          placeholder="Select organization..."
          value={organization}
          options={orgOptions}
          isLoading={loadingOrgs}
          onChange={setOrganization}
        />
        <SelectField
          size="compact"
          label="Document type"
          placeholder="Select type..."
          value={docType}
          options={docTypeOptions}
          isLoading={loadingDocTypes}
          onChange={setDocType}
        />
        <SelectField
          size="compact"
          label="Category"
          placeholder="Select category..."
          value={category}
          options={categoryOptions}
          isLoading={loadingCategories}
          onChange={setCategory}
        />

        <View style={{ marginBottom: form.fieldGap }}>
          <Text style={styles.label}>
            Document title
          </Text>
          <TextInput
            size="compact"
            value={title}
            onChangeText={value => { titleEdited.current = true; setTitle(value); }}
            placeholder="Enter document title..."
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Document title"
          />
        </View>

        <SelectField
          size="compact"
          label="Academic year"
          placeholder="Auto-selected from active year"
          value={academicYear}
          options={academicYear ? [academicYear] : []}
          disabled
          onChange={() => {}}
        />

        <SelectField
          size="compact"
          label="Submitted by"
          placeholder="Select"
          value={submittedBy}
          options={submittedByOptions}
          isLoading={loadingOrgUsers}
          disabled={!organization}
          onChange={setSubmittedBy}
        />

        <View className="flex-row items-center justify-between bg-[#FFF6D6] rounded-2xl p-2 mb-2">
          <View className="flex-1 mr-3"><Text className="text-vistaNavy font-medium text-[13px]">Priority escalation</Text><Text className="text-slate-600 text-xs mt-1">Flag this submission for priority review.</Text></View>
          <Switch value={priority} onValueChange={setPriority} accessibilityLabel="Priority escalation" trackColor={{ false: '#CBD5E1', true: '#FDC849' }} thumbColor="#FFFFFF" />
        </View>
        {ocrNotice?.template ? (
          <View className="bg-slate-50 rounded-lg p-2 mb-2">
            <Text className="text-vistaNavy text-xs font-medium">
              Detected: {ocrNotice.template} ({ocrNotice.confidence}% match)
            </Text>
            {ocrNotice.needsReview?.length > 0 ? (
              <Text className="text-amber-600 text-xs font-semibold mt-1">
                Please double-check: {ocrNotice.needsReview.join(", ")}
              </Text>
            ) : null}
          </View>
        ) : null}
        {ocrNotice?.unrecognized ? (
          <View className="bg-slate-50 rounded-lg p-2 mb-2">
            <Text className="text-amber-600 text-xs font-semibold">
              Couldn't confidently match a known form template — please fill in
              the fields manually.
            </Text>
          </View>
        ) : null}

        {scannedFile ? <>
          <DraftAttachmentPreview file={scannedFile} compact />
          <TouchableOpacity disabled={isBusy} onPress={() => { setScannedFile(null); setOcrDraft(null); setOcrNotice(null); }} accessibilityLabel="Remove attachment" className="self-end min-h-[48px] justify-center px-3 mb-2"><Text className="text-red-700 text-sm font-bold">Remove attachment</Text></TouchableOpacity>
        </> : null}
        <TouchableOpacity
          ref={attachmentTrigger}
          onPress={handleAttachDocument}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Attach document (optional)"
          accessibilityState={{ disabled: isBusy, busy: autofillMutation.isPending }}
          style={[styles.attachment, isBusy && { opacity: 0.55 }]}
        >
          {autofillMutation.isPending ? (
            <>
              <ActivityIndicator />
              <Text style={styles.attachmentLabel}>
                Reading document…
              </Text>
            </>
          ) : (
            <>
              <VistaIcon name="paperclip" size={sizes.icon} color={colors.muted} />
              <Text style={styles.attachmentLabel}>Attach Document (Optional)</Text>
            </>
          )}
        </TouchableOpacity>

        <AppButton label="Submit" variant="accent" onPress={handleSubmit} disabled={isBusy} />
      </View>}
      <VistaProcessing visible={processing} message="Reading your document and preparing its image…" />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  form: { backgroundColor: colors.surface, borderRadius: radii.card, padding: space.sm },
  label: { ...type.label, color: colors.text, marginBottom: form.labelGap },
  attachment: { minHeight: sizes.touch, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: form.paddingHorizontal, paddingVertical: form.paddingVertical, borderRadius: radii.field, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.field, marginBottom: form.sectionGap },
  attachmentLabel: { ...type.body, color: colors.muted, flexShrink: 1 },
});
