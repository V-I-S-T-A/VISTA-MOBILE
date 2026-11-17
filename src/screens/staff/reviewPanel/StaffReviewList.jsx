import { panelStyles } from '../../../theme/layout';
import { colors, compact, radii, type } from '../../../theme/tokens';
import { Text } from "../../../components/common/FontText";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import SubmissionListCard from "../../../components/submissions/SubmissionListCard";
import { SubmissionListSkeleton } from '../../../components/common/Skeleton';
import StaleWarningBanner from '../../../components/common/StaleWarningBanner';
import ContentState from '../../../components/common/ContentState';

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
      <ContentState variant="error" title="Could not load submissions" error={error} onRetry={onRetry} />
    );
  }

  if (submissions.length === 0) {
    return (
      <ContentState title="No submissions to review" message={academicYearId
            ? "No submissions found for the selected academic year and status."
            : "Submissions will appear here when they’re sent for review."}>
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
      </ContentState>
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
