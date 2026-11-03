import { Text } from "../common/FontText";
import { StyleSheet, View } from "react-native";
import { type, radii, statusTones } from "../../theme/tokens";
import { Feather } from '@expo/vector-icons';

export const SUBMISSION_STATUS = {
  pending: { label: "Pending", ...statusTones.pending },
  under_review: { label: "Under Review", ...statusTones.under_review },
  approved: { label: "Approved", ...statusTones.approved },
  rejected: { label: "Rejected", ...statusTones.rejected },
  resubmission_required: { label: "Resubmission Required", ...statusTones.resubmission_required },
};

export function getSubmissionStatus(status) {
  const key = typeof status === "string" ? status.toLowerCase() : "";
  return (
    SUBMISSION_STATUS[key] || {
      label: status ? "Unknown status" : "Status unavailable",
      ...statusTones.default,
    }
  );
}

export default function SubmissionStatusBadge({ status, size = "regular", showIcon = false }) {
  const statusStyle = getSubmissionStatus(status);
  const mini = size === 'mini';
  const compact = size === "small" || mini;
  return (
    <View
      accessible
      accessibilityLabel={statusStyle.label}
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.background,
          paddingHorizontal: mini ? 6 : compact ? 6 : 12,
          paddingVertical: mini ? 2 : compact ? 2 : 6,
          borderRadius: mini ? 8 : radii.pill,
        },
        showIcon && { flexDirection: 'row', alignItems: 'center', gap: 3 },
      ]}
    >
      {showIcon ? (
        <Feather
          name={{ approved: 'check', rejected: 'x', under_review: 'clock', pending: 'clock', resubmission_required: 'rotate-ccw' }[status] || 'info'}
          size={mini ? 9 : 11}
          color={statusStyle.foreground}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: statusStyle.foreground },
          mini
            ? { fontFamily: type.medium, fontSize: 9.5, lineHeight: 13, includeFontPadding: false }
            : compact && { ...type.badge },
        ]}
      >
        {statusStyle.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexShrink: 1, maxWidth: '100%', minWidth: 0, borderRadius: radii.pill },
  label: { ...type.label, textAlign: 'center', flexShrink: 1 },
});
