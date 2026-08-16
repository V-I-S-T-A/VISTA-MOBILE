import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import StaffBottomNav from "../../components/staff/StaffBottomNav";
import StaffReviewHeader from "./reviewPanel/StaffReviewHeader";
import StaffReviewBanner from "./reviewPanel/StaffReviewBanner";
import StaffReviewList from "./reviewPanel/StaffReviewList";
import StaffReviewPagination from "./reviewPanel/StaffReviewPagination";
import { useSubmissions } from "../../hooks/useSubmissions";

export default function StaffReviewPanel({ navigation }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useSubmissions({ page });

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <StaffReviewHeader />
        <StaffReviewBanner />
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
