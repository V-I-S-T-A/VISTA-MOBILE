import { useBottomNavClearance } from '../../theme/layout';
import { Text } from "../../components/common/FontText";
import { ActivityIndicator, ScrollView, TouchableOpacity, View, RefreshControl } from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import SubmissionSummaryTabs from '../../components/submissions/SubmissionSummaryTabs';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/students/StudentBottomNav";
import SubmissionListCard from "../../components/submissions/SubmissionListCard";
import SubmissionPagination from "../../components/submissions/SubmissionPagination";
import { useSubmissions } from "../../hooks/useSubmissions";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";
import { panelStyles, useStaffLayout } from '../../theme/layout';
import PageHeading from '../../components/common/PageHeading';
import { SubmissionListSkeleton } from '../../components/common/Skeleton';
import StaleWarningBanner from '../../components/common/StaleWarningBanner';
import StaffReviewSearch from '../staff/reviewPanel/StaffReviewSearch';
import AcademicYearFilterSheet from '../../components/submissions/AcademicYearFilterSheet';
import { colors, compact, radii, type } from '../../theme/tokens';

const STATUS_TO_PARAM = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
};

const FILTER_OPTIONS = ['All Status', 'Pending', 'Approved', 'Rejected'];

export default function StudentTrackerScreen({ navigation, route }) {
  const footerClearance = useBottomNavClearance();
  const insets = useSafeAreaInsets();
  const screenLayout = useStaffLayout();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState(() =>
    FILTER_OPTIONS.includes(route?.params?.statusFilter)
      ? route.params.statusFilter
      : 'All Status'
  );
  const [academicYearId, setAcademicYearId] = useState(() => route?.params?.academicYearId || null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    const requested = route?.params?.statusFilter;
    if (!FILTER_OPTIONS.includes(requested)) return;
    setFilter(requested);
    setSearchQuery('');
    setPage(1);
    navigation.setParams({ statusFilter: undefined });
  }, [navigation, route?.params?.statusFilter]);

  const changeFilter = value => {
    setFilter(value);
    setSearchQuery('');
    setPage(1);
  };

  const handleSearchChange = value => {
    setSearchQuery(value);
    setPage(1);
  };

  const params = { page };
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (filter !== 'All Status') {
    params.status = STATUS_TO_PARAM[filter];
  }
  if (academicYearId) {
    params.academic_year_id = academicYearId;
  }

  const { data, isLoading, isError, error, refetch } = useSubmissions(params);
  const submissions = data?.results ?? [];
  const { refreshing, onRefresh } = useScreenRefresh([["submissions"]]);
  const hasData = submissions.length > 0;
  const isAuthError = [401, 403].includes(error?.status || error?.response?.status);

  const selectedYearLabel = useMemo(() => {
    if (!academicYearId) return null;
    const match = submissions.find(s => String(s.academic_year_id) === String(academicYearId));
    return match?.academic_year || null;
  }, [academicYearId, submissions]);

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        className="flex-1 pt-2"
        style={screenLayout.horizontal}
        contentContainerStyle={{ paddingBottom: footerClearance }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHeader />
        <PageHeading compact title="Review Tracker" subtitle="Reviewing processing status." style={{ marginBottom: 2 }} />
        <SubmissionSummaryTabs
          showRejected
          value={filter}
          onChange={changeFilter}
        />
        <StaffReviewSearch
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          onFilterPress={() => setFilterSheetVisible(true)}
          isFilterActive={!!academicYearId}
          activeFilterLabel={selectedYearLabel}
          filterButtonRef={filterButtonRef}
        />
        {isLoading && !hasData ? (
          <SubmissionListSkeleton count={5} />
        ) : isError && (!hasData || isAuthError) ? (
          <View style={panelStyles.state}>
            <Text className="text-gray-500 mb-3">
              Could not load submissions.
            </Text>
            <TouchableOpacity
              onPress={refetch}
              style={panelStyles.touch} className="bg-vistaNavy rounded-full px-4 py-2"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : submissions.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
            <Text className="text-gray-500 text-center" style={{ ...type.body, color: colors.muted }}>
              {academicYearId
                ? "No submissions found for the selected academic year and status."
                : searchQuery.trim()
                ? "No submissions match your search."
                : "No submissions to track yet."}
            </Text>
            {academicYearId ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear academic year filter"
                onPress={() => {
                  setAcademicYearId(null);
                  setPage(1);
                }}
                style={{
                  minHeight: compact.touch,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: radii.chip,
                  backgroundColor: colors.selectedSurface,
                }}
              >
                <Text style={{ ...type.compactLabel, color: colors.blue }}>Clear Filter</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            {isError && hasData && !isAuthError ? <StaleWarningBanner /> : null}
            {submissions.map((submission) => (
              <SubmissionListCard
                key={submission.submission_id}
                submission={submission}
                onPress={() =>
                  navigation.navigate("StudentSubmissionDetails", {
                    submission,
                  })
                }
              />
            ))}
            {(data?.total_pages ?? 1) > 1 && (
              <SubmissionPagination
                currentPage={page}
                totalPages={data.total_pages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </ScrollView>
      <StudentBottomNav
        activeTab="tracker"
        onHomePress={() => navigation.navigate("StudentHome")}
        onTrackerPress={() => navigation.navigate("StudentTracker")}
      />
      <AcademicYearFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        selectedId={academicYearId}
        onApply={(id) => {
          setAcademicYearId(id);
          setPage(1);
        }}
        onReset={() => {
          setAcademicYearId(null);
          setPage(1);
        }}
        returnFocusRef={filterButtonRef}
        submissions={submissions}
      />
    </View>
  );
}
