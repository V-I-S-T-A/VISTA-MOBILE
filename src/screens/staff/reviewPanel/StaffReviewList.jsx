import { panelStyles } from '../../../theme/layout';
import { colors, compact, radii, type } from '../../../theme/tokens';
import { Text } from "../../../components/common/FontText";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import SubmissionListCard from "../../../components/submissions/SubmissionListCard";
import { SubmissionListSkeleton } from '../../../components/common/Skeleton';
import StaleWarningBanner from '../../../components/common/StaleWarningBanner';

export default function StaffReviewList({
  submissions = [],
  isLoading,
  isError,
  error,
  onRetry,
  onOpen,
  academicYearId = null,
  onClearFilter = null,
}) {
  const hasData = submissions.length > 0;
  const isAuthError = [401, 403].includes(error?.status || error?.response?.status);

  if (isLoading && !hasData) {
    return (
      <SubmissionListSkeleton count={5} />
    );
  }

  if (isError && (!hasData || isAuthError)) {
    return (
      <View style={panelStyles.state}>
        <Text accessibilityRole="alert" style={{ ...type.body, color: colors.muted, marginBottom: compact.gutter }}>Could not load submissions.</Text>
        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel="Retry loading submissions" style={{ minHeight: compact.touch, justifyContent: 'center', paddingHorizontal: compact.gutter, borderRadius: radii.field, backgroundColor: colors.blue }} onPress={onRetry}

        >
          <Text className="text-white font-semibold text-xs">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submissions.length === 0) {
    return (
      <View style={[panelStyles.state, { gap: 8 }]}>
        <Text style={{ ...type.body, color: colors.muted, textAlign: 'center' }}>
          {academicYearId
            ? "No submissions found for the selected academic year and status."
            : "No submissions to review."}
        </Text>
        {academicYearId && onClearFilter ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear academic year filter"
            style={{
              minHeight: compact.touch,
              justifyContent: 'center',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: radii.chip,
              backgroundColor: colors.selectedSurface,
            }}
            onPress={onClearFilter}
          >
            <Text style={{ ...type.compactLabel, color: colors.blue }}>Clear Filter</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mb-4">
      {isError && hasData && !isAuthError ? <StaleWarningBanner /> : null}
      {submissions.map((submission) => (
        <SubmissionListCard
          key={submission.submission_id}
          submission={submission}
          compact
          showSubmitterEmail
          onPress={() => onOpen?.(submission)}
        />
      ))}
    </View>
  );
}
