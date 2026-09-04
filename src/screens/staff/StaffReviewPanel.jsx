import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import StaffReviewBanner from "./reviewPanel/StaffReviewBanner";
import StaffReviewSearch from "./reviewPanel/StaffReviewSearch";
import StaffReviewList from "./reviewPanel/StaffReviewList";
import StaffReviewPagination from "./reviewPanel/StaffReviewPagination";
import { useSubmissions } from "../../hooks/useSubmissions";

const STATUS_TO_PARAM = {
  Pending: "pending",
  "Under Review": "under_review",
  Approved: "approved",
  Rejected: "rejected",
  "Resubmission Required": "resubmission_required",
};

export default function StaffReviewPanel({ navigation }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

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
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <StaffReviewBanner />
        <StaffReviewSearch
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          statusFilter={statusFilter}
          setStatusFilter={handleStatusChange}
        />
        <StaffReviewList
          submissions={data?.results ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          onOpen={(submission) =>
            navigation.navigate("ReviewPanelDetails", { submission })
          }
        />
        <StaffReviewPagination
          currentPage={page}
          totalPages={data?.total_pages ?? 1}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(data?.total_pages ?? 1, p + 1))}
        />
      </ScrollView>

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
