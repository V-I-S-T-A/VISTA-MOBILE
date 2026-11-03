import { useEffect, useRef, useState } from "react";
import SubmissionSummaryTabs from '../../../components/submissions/SubmissionSummaryTabs';
import { View, ScrollView, RefreshControl } from "react-native";
import { useStaffLayout, useBottomNavClearance } from "../../../theme/layout";
import StaffBottomNav from "../../../components/staff/StaffBottomNav";
import StaffReviewHeader from "../reviewPanel/StaffReviewHeader";
import SubmissionHistoryTop from "./submissionHistory/SubmissionHistoryTop";
import StaffReviewSearch from "../reviewPanel/StaffReviewSearch";
import SubmissionHistoryList from "./submissionHistory/SubmissionHistoryList";
import { openDocumentEntryWithAttachment } from "../../../utils/openDocumentEntryWithAttachment";
import { useScreenRefresh } from "../../../hooks/useScreenRefresh";
import AcademicYearFilterSheet from '../../../components/submissions/AcademicYearFilterSheet';

const filters = ['All Status', 'Pending', 'Approved', 'Rejected'];
export default function StaffSubmissionHistory({ navigation, route }) {
  const screenLayout = useStaffLayout();
  const footerClearance = useBottomNavClearance();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => filters.includes(route?.params?.statusFilter) ? route.params.statusFilter : 'All Status');
  const [academicYearId, setAcademicYearId] = useState(() => route?.params?.academicYearId || null);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    if (!filters.includes(route?.params?.statusFilter)) return;
    setStatusFilter(route.params.statusFilter); setSearchQuery('');
    navigation.setParams({ statusFilter: undefined });
  }, [navigation, route?.params?.statusFilter]);

  const { refreshing, onRefresh } = useScreenRefresh([["submissions"]]);

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={screenLayout.top}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1 pt-2"
        style={screenLayout.horizontal}
        contentContainerStyle={{ paddingBottom: footerClearance }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <SubmissionHistoryTop />
        <SubmissionSummaryTabs
          staff
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <StaffReviewSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onFilterPress={() => setFilterSheetVisible(true)}
          isFilterActive={!!academicYearId}
          filterButtonRef={filterButtonRef}
          filterButtonVariant="blue"
        />
        <SubmissionHistoryList 
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          academicYearId={academicYearId}
          onClearFilter={() => setAcademicYearId(null)}
        />
      </ScrollView>

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
        onApply={(id) => setAcademicYearId(id)}
        onReset={() => setAcademicYearId(null)}
        returnFocusRef={filterButtonRef}
      />
    </View>
  );
}
