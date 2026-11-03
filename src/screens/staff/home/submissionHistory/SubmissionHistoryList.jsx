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

  const params = { page };
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
      <View style={panelStyles.state}>
        <Text accessibilityRole="alert" style={{ ...type.body, color: colors.muted, marginBottom: compact.gutter }}>
          Could not load submission history.
        </Text>
        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel="Retry loading submissions" style={{ minHeight: compact.touch, justifyContent: 'center' }} onPress={refetch}
          className="bg-vistaNavy rounded-full px-4 py-2"
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
            : "No submissions found."}
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
    <View className="mb-2">
      {isError && hasData && !isAuthError ? <StaleWarningBanner /> : null}
      {submissions.map(item => <SubmissionListCard key={item.submission_id} submission={item} compact showSubmitterEmail onPress={() => navigation.navigate("ReviewPanelDetails", { submission: item })} />)}
      {(data?.total_pages ?? 1) > 1 && (
        <SubmissionPagination
          currentPage={page}
          totalPages={data.total_pages}
          onPageChange={setPage}
        />
      )}
    </View>
  );
}
