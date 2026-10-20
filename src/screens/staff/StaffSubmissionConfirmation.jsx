import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { submissionsService } from "../../services/submissionsService";

export default function StaffSubmissionConfirmation({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { draft, file, labels = {} } = route.params || {};
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
    ...(draft?.description ? [["Description", draft.description]] : []),
  ];
  return (
    <View className="flex-1 bg-[#F4F6FA]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={busy}
          className="flex-row items-center self-start rounded-full bg-white border border-slate-200 px-4 py-2 mb-6"
        >
          <Feather name="arrow-left" size={16} color="#1E3A68" />
          <Text className="text-vistaNavy font-bold ml-2">Edit entry</Text>
        </TouchableOpacity>
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 rounded-full bg-[#E5EEF9] items-center justify-center mr-3">
            <Feather name="clipboard" size={19} color="#245EA9" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">
              Final check
            </Text>
            <Text className="text-2xl font-extrabold text-vistaNavy">
              Review submission
            </Text>
          </View>
        </View>
        <Text className="text-slate-600 leading-5 mb-5">
          Confirm the details below. Your submission is created only after you tap the button.
        </Text>

        <View className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <Text className="text-vistaNavy text-base font-extrabold mb-4">
            Submission details
          </Text>
          {rows.map(([label, value], index) => (
            <View
              key={label}
              className={`py-3 ${index < rows.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                {label}
              </Text>
              <Text className="text-vistaNavy text-sm font-semibold mt-1">
                {value || "—"}
              </Text>
            </View>
          ))}
          <View className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-slate-200">
              <Feather
                name={file ? (file.type?.includes("pdf") ? "file-text" : "image") : "paperclip"}
                size={18}
                color={file ? "#245EA9" : "#94A3B8"}
              />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                Attachment
              </Text>
              <Text numberOfLines={2} className="text-vistaNavy text-sm font-semibold mt-1">
                {file?.name || "No file attached"}
              </Text>
            </View>
            <Text className={`text-xs font-bold ${file ? "text-green-700" : "text-slate-500"}`}>
              {file ? "Attached" : "Optional"}
            </Text>
          </View>
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
            className={`rounded-2xl p-4 mt-5 items-center shadow-sm ${busy ? "bg-[#D6A83B]" : "bg-[#FFC342]"}`}
          >
            {busy ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#142D55" />
                <Text className="text-[#142D55] font-extrabold ml-2">Creating submission…</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-[#142D55] font-extrabold text-base">Confirm and submit</Text>
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
    </View>
  );
}
