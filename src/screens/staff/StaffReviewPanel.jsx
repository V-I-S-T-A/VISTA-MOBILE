import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import StaffReviewBanner from "./reviewPanel/StaffReviewBanner";
import StaffReviewSearch from "./reviewPanel/StaffReviewSearch";
import StaffReviewList from "./reviewPanel/StaffReviewList";
import SubmissionPagination from "../../components/submissions/SubmissionPagination";
import { useSubmissions } from "../../hooks/useSubmissions";

const STATUS_TO_PARAM = {
  Pending: "pending",
  "Under Review": "under_review",
  Approved: "approved",
  Rejected: "rejected",
  "Resubmission Required": "resubmission_required",
};

const FILTER_OPTIONS = [
  "All Status",
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Resubmission Required",
];

const getInitialFilter = (route) =>
  FILTER_OPTIONS.includes(route?.params?.statusFilter)
    ? route.params.statusFilter
    : "All Status";

export default function StaffReviewPanel({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => getInitialFilter(route));

  useEffect(() => {
    const requestedFilter = route?.params?.statusFilter;
    if (!FILTER_OPTIONS.includes(requestedFilter)) return;
    setStatusFilter(requestedFilter);
    setPage(1);
    navigation.setParams({ statusFilter: undefined });
  }, [navigation, route?.params?.statusFilter]);

  const params = { page };
  if (searchQuery.trim()) params.search = searchQuery.trim();
  if (statusFilter !== "All Status") {
    params.status = STATUS_TO_PARAM[statusFilter];
  }

  const { data, isLoading, isError, refetch } = useSubmissions(params);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-5 pt-4">
        <StaffReviewHeader />
        <StaffReviewBanner />
        <StaffReviewSearch
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusChange}
        />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <StaffReviewList
            submissions={data?.results ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onOpen={(submission) =>
              navigation.navigate("ReviewPanelDetails", { submission })
            }
          />
        </ScrollView>
        <SubmissionPagination
          currentPage={page}
          totalPages={data?.total_pages ?? 1}
          onPageChange={setPage}
        />
      </View>

      <StaffBottomNav
        activeTab="reports"
        onHomePress={() => navigation?.navigate("StaffHome")}
        onProfilePress={() => navigation?.navigate("StaffDocumentEntry")}
        onReportsPress={() => navigation?.navigate("StaffReviewPanel")}
        onCloudPress={() => navigation?.navigate("GDriveSync")}
      />
    </View>
  );
}
