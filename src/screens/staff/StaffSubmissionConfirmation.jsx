import { AppAlert as Alert } from '../../components/common/AppDialog';
import { Text } from "../../components/common/FontText";
import { useState } from "react";
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { panelStyles, useStaffLayout } from "../../theme/layout";
import { submissionsService } from "../../services/submissionsService";
import DraftAttachmentPreview from '../../components/submissions/DraftAttachmentPreview';
import { type } from '../../theme/tokens';
import VistaProcessing from '../../components/common/VistaProcessing';

export default function StaffSubmissionConfirmation({ navigation, route }) {
  const screenLayout = useStaffLayout();
  const { draft, file: initialFile, labels = {} } = route.params || {};
  const [file, setFile] = useState(initialFile);
  const [busy, setBusy] = useState(false);
  const [createdSubmission, setCreatedSubmission] = useState(null);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (busy || createdSubmission) return;
    setBusy(true);
    setError("");
    try {
      const submission = await submissionsService.createSubmission(draft);
      setCreatedSubmission(submission);
      if (file)
        await submissionsService.uploadSubmissionDocument(
          submission.submission_id,
          file,
        );
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
      setError(
        e.message ||
          "Could not create the submission. Check your connection and retry.",
      );
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    ["Title", draft?.title],
    ["Organization", labels.organization],
    ["Document type", labels.docType],
    ["Category", labels.category],
    ["Academic year", labels.academicYear],
    ["Submitted by", labels.submittedBy],
    ["Priority", draft?.priority_escalation ? 'Priority review' : 'Standard review'],
    ...(draft?.description ? [["Description", draft.description]] : []),
  ];
  return (
    <View className="flex-1 bg-[#F4F6FA]" style={screenLayout.top}>
      <ScrollView
        className="flex-1"
        style={screenLayout.horizontal}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={busy}
          className="flex-row items-center self-start rounded-full bg-white border border-slate-200 px-4 py-2 min-h-[48px] mb-3"
        >
          <Feather name="arrow-left" size={16} color="#1E3A68" />
          <Text className="text-vistaNavy font-bold ml-2">Edit entry</Text>
        </TouchableOpacity>
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 rounded-full bg-[#E5EEF9] items-center justify-center mr-3">
            <Feather name="clipboard" size={19} color="#245EA9" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-500 text-xs font-medium">
              Final check
            </Text>
            <Text style={type.title} className="text-vistaNavy">
              Review submission
            </Text>
          </View>
        </View>
        <Text className="text-slate-600 leading-5 mb-5">
          Confirm the details below. Your submission is created only after you tap the button.
        </Text>

        <View style={panelStyles.card} className="bg-white border border-slate-200 shadow-sm">
          <Text style={type.sectionTitle} className="text-vistaNavy mb-2">
            Submission details
          </Text>
          {rows.map(([label, value], index) => (
            <View
              key={label}
              className={`py-2 ${index < rows.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <Text className="text-slate-500 text-xs font-medium">
                {label}
              </Text>
              <Text className="text-vistaNavy text-[13px] font-medium mt-1">
                {value || "—"}
              </Text>
            </View>
          ))}
          <DraftAttachmentPreview file={file} onRemove={!busy && !createdSubmission ? () => setFile(null) : undefined} />
        </View>
        {error ? (
          <View className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
            <View className="flex-row items-start">
              <Feather name="alert-circle" size={18} color="#B91C1C" />
              <Text className="text-red-800 font-semibold ml-2 flex-1">{error}</Text>
            </View>
            {createdSubmission ? (
              <Text className="text-red-700 text-xs mt-2">
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
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await submissionsService.uploadSubmissionDocument(
                  createdSubmission.submission_id,
                  file,
                );
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
                setError(
                  e.message || "Attachment upload failed. Please retry.",
                );
              } finally {
                setBusy(false);
              }
            }}
            className="bg-[#245EA9] rounded-xl p-4 mt-4 items-center"
          >
            {busy ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Retry attachment upload</Text>}
          </TouchableOpacity>
        ) : null}
        {createdSubmission && !error ? (
          <View className="mt-5 items-center">
            <Feather name="check-circle" size={34} color="#15803D" />
            <Text className="text-green-800 font-bold mt-2">
              Submission created successfully
            </Text>
          </View>
        ) : null}
        {!createdSubmission ? (
          <TouchableOpacity
            onPress={confirm}
            disabled={busy}
            className={`rounded-xl min-h-[48px] px-3 py-2 mt-3 items-center shadow-sm ${busy ? "bg-[#D6A83B]" : "bg-[#FFC342]"}`}
          >
            {busy ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#142D55" />
                <Text className="text-[#142D55] font-medium ml-2">Creating submission…</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-[#142D55] font-medium text-[13px]">Confirm and submit</Text>
                <Feather name="arrow-right" size={17} color="#142D55" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>
        ) : null}
        {!createdSubmission ? (
          <Text className="text-slate-500 text-xs text-center mt-3">
            You can go back to edit before confirming.
          </Text>
        ) : null}
      </ScrollView>
      <VistaProcessing visible={busy} />
    </View>
  );
}
