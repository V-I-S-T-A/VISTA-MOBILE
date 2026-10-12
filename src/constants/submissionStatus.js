export const STATUS_META = {
  pending: {
    label: "Pending",
    bg: "#FEF3C7",
    text: "#92400E",
    dot: "#F59E0B",
  },
  under_review: {
    label: "Under Review",
    bg: "#DBEAFE",
    text: "#1D4ED8",
    dot: "#3B82F6",
  },
  approved: {
    label: "Approved",
    bg: "#DCFCE7",
    text: "#15803D",
    dot: "#22C55E",
  },
  rejected: {
    label: "Rejected",
    bg: "#FEE2E2",
    text: "#B91C1C",
    dot: "#EF4444",
  },
  resubmission_required: {
    label: "Resubmission Required",
    bg: "#FFEDD5",
    text: "#C2410C",
    dot: "#F97316",
  },
};

const FALLBACK = {
  label: "—",
  bg: "#F3F4F6",
  text: "#4B5563",
  dot: "#9CA3AF",
};

export function getStatusMeta(status) {
  if (!status) return FALLBACK;
  return (
    STATUS_META[status] || {
      ...FALLBACK,
      label: String(status).replace(/_/g, " "),
    }
  );
}
