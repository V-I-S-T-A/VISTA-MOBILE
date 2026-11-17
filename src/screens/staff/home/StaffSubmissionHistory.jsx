import { PullRefreshScrollView as ScrollView } from '../../../components/common/PullRefresh';
import useBottomNavScroll from '../../../hooks/useBottomNavScroll';
import { useEffect, useRef, useState } from "react";
import SubmissionSummaryTabs from '../../../components/submissions/SubmissionSummaryTabs';
import { View, RefreshControl } from "react-native";
import { useStaffLayout, useBottomNavClearance } from "../../../theme/layout";
import StaffBottomNav from "../../../components/staff/StaffBottomNav";
import SubPageHeader from "../../../components/common/SubPageHeader";
import SubmissionHistoryTop from "./submissionHistory/SubmissionHistoryTop";
import StaffReviewSearch from "../reviewPanel/StaffReviewSearch";
import SubmissionHistoryList from "./submissionHistory/SubmissionHistoryList";
import { openDocumentEntryWithAttachment } from "../../../utils/openDocumentEntryWithAttachment";
import { useScreenRefresh } from "../../../hooks/useScreenRefresh";
import AcademicYearFilterSheet from '../../../components/submissions/AcademicYearFilterSheet';

const filters = ['All Status', 'Pending', 'Approved', 'Rejected'];
export default function StaffSubmissionHistory({ navigation, route }) {
  const navScroll = useBottomNavScroll(navigation);
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
      <View style={screenLayout.horizontal}>
        <SubPageHeader />
      </View>
      <ScrollView {...navScroll.scrollProps}
        alwaysBounceVertical overScrollMode="always"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        style={screenLayout.horizontal}
        contentContainerStyle={{ paddingBottom: footerClearance }}
        showsVerticalScrollIndicator={false}
      >
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

      <StaffBottomNav scrollBehavior={navScroll}
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
