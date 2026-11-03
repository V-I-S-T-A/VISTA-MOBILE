import { View, ScrollView, RefreshControl } from "react-native";
import { useStaffLayout, useBottomNavClearance } from "../../theme/layout";
import { useEffect, useMemo, useRef, useState } from "react";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import StaffReviewBanner from "./reviewPanel/StaffReviewBanner";
import StaffReviewSearch from "./reviewPanel/StaffReviewSearch";
import StaffReviewList from "./reviewPanel/StaffReviewList";
import SubmissionPagination from "../../components/submissions/SubmissionPagination";
import { useSubmissions } from "../../hooks/useSubmissions";
import { openDocumentEntryWithAttachment } from "../../utils/openDocumentEntryWithAttachment";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";
import SubmissionSummaryTabs from '../../components/submissions/SubmissionSummaryTabs';
import AcademicYearFilterSheet from '../../components/submissions/AcademicYearFilterSheet';

const STATUS_TO_PARAM = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
};

const FILTER_OPTIONS = [
  "All Status",
  "Pending",
  "Approved",
  "Rejected",
];

const getInitialFilter = (route) =>
  FILTER_OPTIONS.includes(route?.params?.statusFilter)
    ? route.params.statusFilter
    : "All Status";

export default function StaffReviewPanel({ navigation, route }) {
  const screenLayout = useStaffLayout();
  const footerClearance = useBottomNavClearance();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => getInitialFilter(route));
  const [academicYearId, setAcademicYearId] = useState(() => route?.params?.academicYearId || null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    const requestedFilter = route?.params?.statusFilter;
    if (!FILTER_OPTIONS.includes(requestedFilter)) return;
    setStatusFilter(requestedFilter);
    setSearchQuery('');
    setPage(1);
    navigation.setParams({ statusFilter: undefined });
  }, [navigation, route?.params?.statusFilter]);

  const params = { page };
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (statusFilter !== "All Status") {
    params.status = STATUS_TO_PARAM[statusFilter];
  }
  if (academicYearId) {
    params.academic_year_id = academicYearId;
  }

  const { data, isLoading, isError, error, refetch } = useSubmissions(params);
  const { refreshing, onRefresh } = useScreenRefresh([["submissions"]]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const selectedYearLabel = useMemo(() => {
    if (!academicYearId) return null;
    const match = (data?.results ?? []).find(s => String(s.academic_year_id) === String(academicYearId));
    return match?.academic_year || null;
  }, [academicYearId, data?.results]);

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={screenLayout.top}>
      <View className="flex-1 pt-2" style={screenLayout.horizontal}>
        <StaffReviewHeader showSettings />
        <StaffReviewBanner />
        <SubmissionSummaryTabs
          staff
          value={statusFilter}
          onChange={handleStatusChange}
        />
        <StaffReviewSearch
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusChange}
          onFilterPress={() => setFilterSheetVisible(true)}
          isFilterActive={!!academicYearId}
          activeFilterLabel={selectedYearLabel}
          filterButtonRef={filterButtonRef}
        />
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: footerClearance, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <StaffReviewList
            submissions={data?.results ?? []}
            isLoading={isLoading}
            isError={isError}
            error={error}
            academicYearId={academicYearId}
            onClearFilter={() => {
              setAcademicYearId(null);
              setPage(1);
            }}
            onRetry={refetch}
            onOpen={(submission) =>
              navigation.navigate("ReviewPanelDetails", { submission })
            }
          />
        {(data?.total_pages ?? 1) > 1 && (
          <SubmissionPagination
            currentPage={page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        )}
        </ScrollView>

      </View>

      <StaffBottomNav
        activeTab="reports"
        onScanPress={() => openDocumentEntryWithAttachment(navigation)}
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation?.navigate("GDriveSync")}
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
        submissions={data?.results ?? []}
      />
    </View>
  );
}
