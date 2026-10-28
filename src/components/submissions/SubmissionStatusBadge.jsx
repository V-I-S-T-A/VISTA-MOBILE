import { Text } from "../common/FontText";
import { View } from "react-native";

export const SUBMISSION_STATUS = {
  pending: { label: "Pending", background: "#FFF0C2", foreground: "#A66500" },
  under_review: {
    label: "Under Review",
    background: "#DBEAFE",
    foreground: "#1D4ED8",
  },
  approved: { label: "Approved", background: "#DCFCE7", foreground: "#15803D" },
  rejected: { label: "Rejected", background: "#FEE2E2", foreground: "#B91C1C" },
  resubmission_required: {
    label: "Resubmission Required",
    background: "#FFEDD5",
    foreground: "#C2410C",
  },
};

export function getSubmissionStatus(status) {
  const key = typeof status === "string" ? status.toLowerCase() : "";
  return (
    SUBMISSION_STATUS[key] || {
      label: status ? "Unknown status" : "Status unavailable",
      background: "#F3F4F6",
      foreground: "#4B5563",
    }
  );
}

export default function SubmissionStatusBadge({ status, size = "regular" }) {
  const style = getSubmissionStatus(status);
  const compact = size === "small";
  const isResubmission = status?.toLowerCase() === "resubmission_required";

  return (
    <View
      className={`self-start shrink rounded-full ${compact ? "px-2.5 py-1" : "px-3.5 py-2"}`}
      style={{ backgroundColor: style.background }}
    >
      <Text
        className={`font-bold ${isResubmission ? "text-xs text-center" : compact ? "text-xs" : "text-sm"}`}
        style={{ color: style.foreground }}
      >
        {style.label}
      </Text>
    </View>
  );
}
