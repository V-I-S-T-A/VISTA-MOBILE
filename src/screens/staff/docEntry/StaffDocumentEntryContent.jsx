import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import SelectField from "../../../components/staff/SelectField";
import { scanDocument, pickDocumentFile } from "../../../utils/documentScan";
import { useAutofillDocument } from "../../../hooks/useSubmissions";
import { useActiveAcademicYear } from "../../../hooks/useAcademicYears";
import { useOrganizations, useOrganizationUsers } from "../../../hooks/useOrganizations";
import { useCategories } from "../../../hooks/useCategories";
import { useDocumentTypes } from "../../../hooks/useDocumentTypes";
import AccountHeader from "../../../components/common/AccountHeader";
function toOption(row, idField, labelFn) {
  return { id: row[idField], label: labelFn(row) };
}

export default function StaffDocumentEntryContent({ navigation }) {
  // --- form state -----------------------------------------------------
  const [organization, setOrganization] = useState(null); // { id, label }
  const [docType, setDocType] = useState(null);
  const [category, setCategory] = useState(null);
  const [academicYear, setAcademicYear] = useState(null);
  const [submittedBy, setSubmittedBy] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ocrNotice, setOcrNotice] = useState(null); // { template, confidence, needsReview[] }
  const [scannedFile, setScannedFile] = useState(null); // { uri, name, type }
  const [ocrDraft, setOcrDraft] = useState(null);

  // --- reference data ---------------------------------------------------
  const organizationsQuery = useOrganizations();
  const categoriesQuery = useCategories();
  const documentTypesQuery = useDocumentTypes();
  const academicYearQuery = useActiveAcademicYear();
  const orgUsersQuery = useOrganizationUsers(organization?.id);
  const { data: organizations = [], isLoading: loadingOrgs } = organizationsQuery;
  const { data: categories = [], isLoading: loadingCategories } = categoriesQuery;
  const { data: documentTypes = [], isLoading: loadingDocTypes } = documentTypesQuery;
  const { data: activeAcademicYear } = academicYearQuery;
  const { data: orgUsers = [], isLoading: loadingOrgUsers } = orgUsersQuery;
  const failedOptions = [
    ["organizations", organizationsQuery],
    ["categories", categoriesQuery],
    ["document types", documentTypesQuery],
    ["academic year", academicYearQuery],
    ["organization users", orgUsersQuery],
  ].filter(([, query]) => query.isError);
  const retryingOptions = failedOptions.some(([, query]) => query.isFetching);

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

  const runAutofill = async (file) => {
    try {
      // const file = await scanDocument();
      // if (!file) return; // staff cancelled the scan

      setScannedFile(file);
      const draft = await autofillMutation.mutateAsync(file);
      setOcrDraft(draft);

      if (draft.status !== "draft_pending_review") {
        setOcrNotice({ unrecognized: true, bestScore: draft.best_score });
        return;
      }

      // --- Organization: from OCR's org suggestion, still editable ---
      if (draft.suggested_org_id) {
        const matched = organizations.find(
          (o) => o.org_id === draft.suggested_org_id,
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

      // --- Document Title: intentionally left blank for staff to type ---
      // (per business rule -- never pre-filled from OCR)

      // --- Description: populate from any other OCR field text, purely
      // as a starting point staff can edit/clear before submitting ---
      const documentCode = draft.fields?.document_code?.value;
      if (documentCode) {
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
        "Scan failed",
        error.message || "Could not process the scanned document.",
      );
    }
  };

  const handleAttachDocument = () => {
    Alert.alert(
      "Attach Document",
      "Scan a physical document with your camera, or choose an existing file.",
      [
        {
          text: "Scan with Camera",
          onPress: async () => {
            const file = await scanDocument();
            if (file) runAutofill(file);
          },
        },
        {
          text: "Choose File (PDF/Image)",
          onPress: async () => {
            const file = await pickDocumentFile();
            if (file) runAutofill(file);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleSubmit = () => {
    if (failedOptions.length > 0 || loadingOrgs || loadingCategories || loadingDocTypes || loadingOrgUsers || academicYearQuery.isLoading) {
      Alert.alert("Form options unavailable", "Please wait for the form options to load, or use Try again before submitting.");
      return;
    }
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
        ...(description.trim() ? { description: description.trim() } : {}),
      }, file: scannedFile, labels: { organization: organization.label, docType: docType.label, category: category.label, academicYear: academicYear?.label, submittedBy: submittedBy?.label } });
  };

  const isBusy =
    autofillMutation.isPending;

  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <AccountHeader profileRoute="StaffProfile" />

      <Text className="text-2xl font-extrabold text-vistaNavy">
        Document Entry
      </Text>
      <Text className="text-vistaNavy text-sm font-semibold mb-4">
        Registration Portal.
      </Text>

      {failedOptions.length > 0 && (
        <View accessibilityRole="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <Text className="text-red-700 text-sm">
            Could not load {failedOptions.map(([label]) => label).join(", ")}. Please try again before submitting.
          </Text>
          <TouchableOpacity accessibilityRole="button" disabled={retryingOptions}
            onPress={() => { failedOptions.forEach(([, query]) => { query.refetch(); }); }}>
            <Text className="text-red-700 font-bold mt-2">{retryingOptions ? "Retrying?" : "Try again"}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View className="bg-white rounded-2xl px-6 pt-6 pb-7">
        <SelectField
          label="ORGANIZATION"
          placeholder="Select organization..."
          value={organization}
          options={orgOptions}
          isLoading={loadingOrgs}
          onChange={setOrganization}
        />
        <SelectField
          label="DOCUMENT TYPE"
          placeholder="Select type..."
          value={docType}
          options={docTypeOptions}
          isLoading={loadingDocTypes}
          onChange={setDocType}
        />
        <SelectField
          label="CATEGORY"
          placeholder="Select category..."
          value={category}
          options={categoryOptions}
          isLoading={loadingCategories}
          onChange={setCategory}
        />

        <View className="mb-4">
          <Text className="text-vistaNavy text-xs font-extrabold mb-2">
            DOCUMENT TITLE
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter document title..."
            placeholderTextColor="#94A3B8"
            className="h-10 border border-slate-200 rounded-lg px-3 bg-white text-xs font-semibold text-vistaNavy"
          />
        </View>

        <SelectField
          label="ACADEMIC YEAR"
          placeholder="Auto-selected from active year"
          value={academicYear}
          options={academicYear ? [academicYear] : []}
          disabled
          onChange={() => {}}
        />

        <SelectField
          label="SUBMITTED BY"
          placeholder="Select"
          value={submittedBy}
          options={submittedByOptions}
          isLoading={loadingOrgUsers}
          disabled={!organization}
          onChange={setSubmittedBy}
        />

        {ocrNotice?.template ? (
          <View className="bg-slate-50 rounded-lg p-3 mb-4">
            <Text className="text-vistaNavy text-xs font-extrabold">
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
          <View className="bg-slate-50 rounded-lg p-3 mb-4">
            <Text className="text-amber-600 text-xs font-semibold">
              Couldn't confidently match a known form template — please fill in
              the fields manually.
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleAttachDocument}
          disabled={isBusy}
          className="h-28 rounded-md items-center justify-center mb-4 bg-slate-50"
          style={{
            borderWidth: 1,
            borderColor: "#DDE7F0",
            borderStyle: "dashed",
          }}
        >
          {autofillMutation.isPending ? (
            <>
              <ActivityIndicator />
              <Text className="text-slate-400 text-xs font-semibold mt-2">
                Reading document…
              </Text>
            </>
          ) : (
            <>
              <View className="relative mb-1">
                <Feather name="camera" size={28} color="#9AAAC0" />
                <View className="absolute -right-1 -top-1 bg-slate-50 rounded-full">
                  <Feather name="plus" size={12} color="#9AAAC0" />
                </View>
              </View>
              <Text className="text-slate-400 text-xs font-semibold">
                Attach
              </Text>
              <Text className="text-slate-400 text-xs font-semibold">
                Document (Optional)
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isBusy}
          className={`bg-[#FFC342] h-10 items-center justify-center ${isBusy ? "opacity-70" : ""}`}
        >
          {
            <Text className="text-white font-extrabold text-base">Submit</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
