import { panelStyles } from '../../../../theme/layout';
import { colors, compact, radii, type } from '../../../../theme/tokens';
import SubmissionListCard from '../../../../components/submissions/SubmissionListCard';
import { Text } from "../../../../components/common/FontText";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { SubmissionListSkeleton } from '../../../../components/common/Skeleton';
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSubmissions } from "../../../../hooks/useSubmissions";
import SubmissionPagination from "../../../../components/submissions/SubmissionPagination";
import StaleWarningBanner from '../../../../components/common/StaleWarningBanner';
import ContentState from '../../../../components/common/ContentState';

const STATUS_TO_PARAM = {
  Pending: "pending",
  "Under Review": "under_review",
  Approved: "approved",
  Rejected: "rejected",
  "Resubmission Required": "resubmission_required",
};

export default function SubmissionHistoryList({
  searchQuery = "",
  statusFilter = "All Status",
  academicYearId = null,
  onClearFilter = null,
}) {
  const navigation = useNavigation();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, academicYearId]);

  const params = { page, page_size: 30 };
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (statusFilter !== "All Status")
    params.status = STATUS_TO_PARAM[statusFilter];
  if (academicYearId)
    params.academic_year_id = academicYearId;

  const { data, isLoading, isError, error, refetch } = useSubmissions(params);
  const submissions = data?.results ?? [];
  const hasData = submissions.length > 0;
  const isAuthError = [401, 403].includes(error?.status || error?.response?.status);

  if (isLoading && !hasData) {
    return (
      <SubmissionListSkeleton count={5} />
    );
  }

  if (isError && (!hasData || isAuthError)) {
    return (
      <ContentState variant="error" title="Could not load submission history" error={error} onRetry={refetch} />
    );
  }

  if (submissions.length === 0) {
    return (
      <ContentState title={searchQuery.trim() || academicYearId || statusFilter !== 'All Status' ? 'No matching submissions' : 'No submissions yet'} message={academicYearId
            ? "No submissions found for the selected academic year and status."
            : searchQuery.trim() || statusFilter !== 'All Status' ? "Try another search or filter." : "Your submission history will appear here."}>
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
    <View>
      {isError && hasData && !isAuthError ? <StaleWarningBanner /> : null}
      {submissions.map(item => <SubmissionListCard key={item.submission_id} submission={item} compact showSubmitterEmail onPress={() => navigation.navigate("ReviewPanelDetails", { submission: item })} />)}
      {(data?.total_pages ?? 1) > 1 && (
        <SubmissionPagination
          variant="history"
          currentPage={page}
          totalPages={data.total_pages}
          onPageChange={setPage}
        />
      )}
    </View>
  );
}
