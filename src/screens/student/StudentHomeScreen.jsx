import { useBottomNavClearance } from '../../theme/layout';
import RecentSubmissionsHeading from '../../components/submissions/RecentSubmissionsHeading';
import { Text } from "../../components/common/FontText";
import { ActivityIndicator, TouchableOpacity, View, ScrollView, RefreshControl } from "react-native";
import { SubmissionListSkeleton } from '../../components/common/Skeleton';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueries } from "@tanstack/react-query";
import StudentHeader from "../../components/students/StudentHeader";
import StudentBottomNav from "../../components/students/StudentBottomNav";
import SubmissionListCard from "../../components/submissions/SubmissionListCard";
import SubmissionDashboardCards from "../../components/submissions/SubmissionDashboardCards";
import { useSubmissions } from "../../hooks/useSubmissions";
import { submissionsService } from "../../services/submissionsService";
import { PADDING_HORIZONTAL } from "../../constants/spacing";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";
import { useStaffLayout, typography, panelStyles } from '../../theme/layout';
import PageHeading from '../../components/common/PageHeading';
import { useAuth } from '../../context/AuthContext';
import StaleWarningBanner from '../../components/common/StaleWarningBanner';

function useSubmissionCounts() {
  const { user } = useAuth();
  const userId = user?.user_id || 'guest';
  const results = useQueries({
    queries: [
      {
        queryKey: ["student-submissions", "count", userId, "all"],
        queryFn: () => submissionsService.listSubmissions({ page_size: 1 }),
        enabled: !!user,
      },
      {
        queryKey: ["student-submissions", "count", userId, "pending"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "pending",
          }),
        enabled: !!user,
      },
      {
        queryKey: ["student-submissions", "count", userId, "approved"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "approved",
          }),
        enabled: !!user,
      },
    ],
  });
  return {
    loading: results.some((result) => result.isLoading && !result.data),
    total: results[0].data?.count ?? 0,
    pending: results[1].data?.count ?? 0,
    approved: results[2].data?.count ?? 0,
  };
}

export default function StudentHomeScreen({ navigation }) {
  const footerClearance = useBottomNavClearance();
  const { user } = useAuth();
  const firstName = user?.first_name?.trim();
  const insets = useSafeAreaInsets();
  const screenLayout = useStaffLayout();
  const counts = useSubmissionCounts();
  const { data, isLoading, isError, error } = useSubmissions({ page_size: 5 });
  const submissions = data?.results ?? [];
  const { refreshing, onRefresh } = useScreenRefresh([["student-submissions"], ["submissions"]]);
  const hasData = submissions.length > 0;
  const isAuthError = [401, 403].includes(error?.status || error?.response?.status);

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1 pt-2"
        style={screenLayout.horizontal}
        contentContainerStyle={{ paddingBottom: footerClearance }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHeader />
        <PageHeading title="Student Org. Dashboard" subtitle={firstName ? `Welcome back, ${firstName}` : 'Welcome back!'} />

        <SubmissionDashboardCards
          isLoading={counts.loading}
          total={counts.total}
          pending={counts.pending}
          approved={counts.approved}
          totalLabel="Total"
          approvedLabel="Approved"
          totalOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'All Status' })}
          pendingOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'Pending' })}
          approvedOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'Approved' })}
        />

        <RecentSubmissionsHeading onViewAll={() => navigation.navigate("StudentTracker")} />
        {isLoading && !hasData ? (
          <SubmissionListSkeleton compact />
        ) : isError && (!hasData || isAuthError) ? (
          <Text style={[typography.body, panelStyles.inlineState]}>Could not load submissions.</Text>
        ) : submissions.length === 0 ? (
          <Text style={[typography.body, panelStyles.inlineState]}>No submissions yet.</Text>
        ) : (
          <>
            {isError && hasData && !isAuthError ? <StaleWarningBanner /> : null}
            {submissions.slice(0, 5).map((submission) => (
              <SubmissionListCard
                key={submission.submission_id}
                submission={submission}
                compact
                showSubmitterEmail
                onPress={() =>
                  navigation.navigate("StudentSubmissionDetails", { submission })
                }
              />
            ))}
          </>
        )}
      </ScrollView>
      <StudentBottomNav
        activeTab="home"
        onHomePress={() => navigation.navigate("StudentHome")}
        onTrackerPress={() => navigation.navigate("StudentTracker")}
      />
    </View>
  );
}
