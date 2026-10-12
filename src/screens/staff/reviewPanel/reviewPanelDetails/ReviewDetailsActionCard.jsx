import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import SelectField from "../../../../components/staff/SelectField";
import StatusBadge from "../../../../components/submissions/StatusBadge";
import { getStatusMeta } from "../../../../constants/submissionStatus";
import { useUpdateSubmissionStatus } from "../../../../hooks/useSubmissions";

const STATUS_TRANSITIONS = {
  pending: ["under_review", "rejected", "resubmission_required"],
  under_review: ["approved", "rejected", "resubmission_required"],
  resubmission_required: ["under_review", "pending", "approved", "rejected"],
  approved: ["under_review", "resubmission_required", "rejected"],
  rejected: ["under_review", "resubmission_required", "approved"],
};

export default function ReviewDetailsActionCard({ submission, isLoading }) {
  const [nextStatus, setNextStatus] = useState(null);
  const [remarks, setRemarks] = useState("");
  const updateStatus = useUpdateSubmissionStatus();

  const allowed = STATUS_TRANSITIONS[submission?.status] || [];
  const options = allowed.map((s) => ({
    id: s,
    label: getStatusMeta(s).label,
  }));

  const handleUpdate = () => {
    if (!nextStatus) {
      Alert.alert("Select a status", "Choose the new status before updating.");
      return;
    }
    updateStatus.mutate(
      {
        submissionId: submission.submission_id,
        status: nextStatus.id,
        remarksText: remarks,
      },
      {
        onSuccess: () => {
          Alert.alert("Updated", `Status changed to ${nextStatus.label}.`);
          setNextStatus(null);
          setRemarks("");
        },
        onError: (error) =>
          Alert.alert("Update failed", error.message || "Please try again."),
      },
    );
  };

  return (
    <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm">
      <Text className="text-gray-500 text-xs font-extrabold tracking-wider mb-3">
        DOCUMENT STATUS
      </Text>

      <View className="flex-row items-center mb-5">
        <Text className="text-gray-500 text-sm mr-3">Currently</Text>
        <StatusBadge status={submission?.status} />
      </View>

      <SelectField
        label="UPDATE TO"
        placeholder="Select new status..."
        value={nextStatus}
        options={options}
        disabled={isLoading || allowed.length === 0}
        onChange={setNextStatus}
      />

      <Text className="text-vistaNavy text-xs font-extrabold mb-2">
        REVIEWER REMARKS
      </Text>
      <View className="border border-slate-200 rounded-lg p-3 h-32 mb-6">
        <TextInput
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Enter detailed notes or revision requirements..."
          placeholderTextColor="#94A3B8"
          multiline
          className="text-sm text-vistaNavy h-full"
          style={{ textAlignVertical: "top" }}
        />
      </View>

      <TouchableOpacity
        onPress={handleUpdate}
        disabled={updateStatus.isPending}
        className={`bg-[#FFC342] rounded-xl py-3.5 items-center justify-center ${
          updateStatus.isPending ? "opacity-70" : ""
        }`}
      >
        {updateStatus.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-extrabold text-sm">
            Update Status
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
