import { PullRefreshScrollView as ScrollView } from '../../components/common/PullRefresh';
import useBottomNavScroll from '../../hooks/useBottomNavScroll';
import { useBottomNavClearance } from '../../theme/layout';
import RecentSubmissionsHeading from '../../components/submissions/RecentSubmissionsHeading';
import { Text } from "../../components/common/FontText";
import { ActivityIndicator, TouchableOpacity, View, RefreshControl } from "react-native";
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
import { isConnectionError } from '../../lib/connectivityState.cjs';

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
      {
        queryKey: ["student-submissions", "count", userId, "rejected"],
        queryFn: () => submissionsService.listSubmissions({ page_size: 1, status: "rejected" }),
        enabled: !!user,
      },
    ],
  });
  return {
    loading: results.some((result) => result.isLoading && !result.data),
    total: results[0].data?.count ?? (isConnectionError(results[0].error) ? '—' : 0),
    pending: results[1].data?.count ?? (isConnectionError(results[1].error) ? '—' : 0),
    approved: results[2].data?.count ?? (isConnectionError(results[2].error) ? '—' : 0),
    rejected: results[3].data?.count ?? (isConnectionError(results[3].error) ? '—' : 0),
  };
}

export default function StudentHomeScreen({ navigation }) {
  const navScroll = useBottomNavScroll(navigation);
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
      <ScrollView {...navScroll.scrollProps}
        scrollHeader={<View className="pt-2"><StudentHeader /></View>}
        alwaysBounceVertical overScrollMode="always"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1"
        style={screenLayout.horizontal}
        contentContainerStyle={{ paddingBottom: footerClearance }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeading title="Student Org. Dashboard" subtitle={firstName ? `Welcome back, ${firstName}` : 'Welcome back!'} />

        <SubmissionDashboardCards
          isLoading={counts.loading}
          total={counts.total}
          pending={counts.pending}
          approved={counts.approved}
          rejected={counts.rejected}
          totalLabel="Total"
          approvedLabel="Approved"
          totalOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'All Status' })}
          pendingOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'Pending' })}
          approvedOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'Approved' })}
          rejectedOnPress={() => navigation.navigate('StudentTracker', { statusFilter: 'Rejected' })}
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
      <StudentBottomNav scrollBehavior={navScroll}
        activeTab="home"
        onHomePress={() => navigation.navigate("StudentHome")}
        onTrackerPress={() => navigation.navigate("StudentTracker")}
      />
    </View>
  );
}
