import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import SelectField from "../../../../components/staff/SelectField";
import { useUpdateSubmissionStatus } from "../../../../hooks/useSubmissions";

const STATUS_TRANSITIONS = {
  pending: ["under_review", "rejected", "resubmission_required"],
  under_review: ["approved", "rejected", "resubmission_required"],
  resubmission_required: ["under_review", "pending", "approved", "rejected"],
  approved: ["under_review", "resubmission_required", "rejected"],
  rejected: ["under_review", "resubmission_required", "approved"],
};

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  resubmission_required: "Resubmission Required",
};

export default function ReviewDetailsActionCard({ submission, isLoading }) {
  const [nextStatus, setNextStatus] = useState(null);
  const [remarks, setRemarks] = useState("");
  const updateStatus = useUpdateSubmissionStatus();

  const allowed = STATUS_TRANSITIONS[submission?.status] || [];
  const options = allowed.map((s) => ({ id: s, label: STATUS_LABELS[s] }));

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
      <Text className="text-vistaNavy text-xs font-bold tracking-wider mb-2 mt-1">
        DOCUMENT STATUS — currently {STATUS_LABELS[submission?.status] || "—"}
      </Text>

      <SelectField
        label=""
        placeholder="Select status.."
        value={nextStatus}
        options={options}
        disabled={isLoading || allowed.length === 0}
        onChange={setNextStatus}
      />

      <Text className="text-vistaNavy text-xs font-bold tracking-wider mb-2 mt-4">
        REVIEWER REMARKS
      </Text>
      <View className="border border-gray-200 rounded-xl p-4 h-32 mb-6">
        <TextInput
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Enter detailed notes or revision requirements..."
          placeholderTextColor="#9ca3af"
          multiline
          className="text-sm text-gray-800 h-full"
          style={{ textAlignVertical: "top" }}
        />
      </View>

      <TouchableOpacity
        onPress={handleUpdate}
        disabled={updateStatus.isPending}
        className={`bg-[#FFC342] rounded-xl py-3.5 items-center justify-center ${updateStatus.isPending ? "opacity-70" : ""}`}
      >
        {updateStatus.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-extrabold text-[15px]">
            Update Status
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
