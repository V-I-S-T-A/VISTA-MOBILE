import { PullRefreshScrollView as ScrollView } from '../../../components/common/PullRefresh';
import { useBottomNavClearance } from '../../../theme/layout';
import RecentSubmissionsHeading from '../../../components/submissions/RecentSubmissionsHeading';
import UserAvatar from '../../../components/common/UserAvatar';
import { typography, panelStyles } from "../../../theme/layout";
import PageHeading from "../../../components/common/PageHeading";
import { Text } from "../../../components/common/FontText";
import { View, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SubmissionListSkeleton } from '../../../components/common/Skeleton';
import { Feather, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { useSubmissions } from "../../../hooks/useSubmissions";
import { submissionsService } from "../../../services/submissionsService";
import AccountHeader from "../../../components/common/AccountHeader";
import SubmissionListCard from "../../../components/submissions/SubmissionListCard";
import SubmissionDashboardCards from "../../../components/submissions/SubmissionDashboardCards";
import { MAIN_BLACK } from "../../../constants/colors";
import { useScreenRefresh } from "../../../hooks/useScreenRefresh";
import StaleWarningBanner from '../../../components/common/StaleWarningBanner';
import { isConnectionError } from '../../../lib/connectivityState.cjs';

function StaffHomeHeader() {
  const navigation = useNavigation();
  const { user } = useAuth();

  return (
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity onPress={() => navigation.navigate("StaffProfile")}>
        <UserAvatar uri={user?.image_url} size={34} />
      </TouchableOpacity>
      <Image
        source={require("../../../assets/logo.webp")}
        className="w-14 h-14"
        resizeMode="contain"
      />
      <TouchableOpacity>
        <Feather name="sliders" size={23} color="#111827" />
      </TouchableOpacity>
    </View>
  );
}

function useSubmissionCounts() {
  const { user } = useAuth();
  const userId = user?.user_id || 'guest';
  const results = useQueries({
    queries: [
      {
        queryKey: ["submissions", "count", userId, "all"],
        queryFn: () => submissionsService.listSubmissions({ page_size: 1 }),
        enabled: !!user,
      },
      {
        queryKey: ["submissions", "count", userId, "pending"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "pending",
          }),
        enabled: !!user,
      },
      {
        queryKey: ["submissions", "count", userId, "approved"],
        queryFn: () =>
          submissionsService.listSubmissions({
            page_size: 1,
            status: "approved",
          }),
        enabled: !!user,
      },
      {
        queryKey: ["submissions", "count", userId, "rejected"],
        queryFn: () => submissionsService.listSubmissions({ page_size: 1, status: "rejected" }),
        enabled: !!user,
      },
    ],
  });

  const [all, pending, approved, rejected] = results;
  const isLoading = results.some((r) => r.isLoading && !r.data);

  return {
    isLoading,
    total: all.data?.count ?? (isConnectionError(all.error) ? '—' : 0),
    pending: pending.data?.count ?? (isConnectionError(pending.error) ? '—' : 0),
    approved: approved.data?.count ?? (isConnectionError(approved.error) ? '—' : 0),
    rejected: rejected.data?.count ?? (isConnectionError(rejected.error) ? '—' : 0),
  };
}

function SubmissionSummary() {
  const navigation = useNavigation();
  const { isLoading, total, pending, approved, rejected } = useSubmissionCounts();

  const openReviews = (statusFilter) =>
    navigation.navigate("StaffReviewPanel", { statusFilter });

  return (
    <SubmissionDashboardCards
      isLoading={isLoading}
      total={total}
      pending={pending}
      approved={approved}
      rejected={rejected}
      totalOnPress={() => openReviews("All Status")}
      pendingOnPress={() => openReviews("Pending")}
      approvedOnPress={() => openReviews("Approved")}
      rejectedOnPress={() => openReviews("Rejected")}
      showTotalLoader
    />
  );
}

function RecentSubmissions() {
  const navigation = useNavigation();
  const { data, isLoading, isError, error } = useSubmissions({ page_size: 5 });
  const submissions = data?.results ?? [];
  const hasData = submissions.length > 0;
  const isAuthError = [401, 403].includes(error?.status || error?.response?.status);

  return (
    <>
      <RecentSubmissionsHeading onViewAll={() => navigation.navigate("StaffReviewPanel")} />

      {isLoading && !hasData ? (
        <SubmissionListSkeleton compact />
      ) : isError && (!hasData || isAuthError) ? (
        <Text style={[typography.body, panelStyles.inlineState]}>
          Could not load recent submissions.
        </Text>
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
                navigation.navigate("ReviewPanelDetails", { submission })
              }
            />
          ))}
        </>
      )}
    </>
  );
}

export default function StaffHomeContent({ navScroll }) {
  const footerClearance = useBottomNavClearance();
  const { user } = useAuth();
  const firstName = user?.first_name?.trim();
  const { refreshing, onRefresh } = useScreenRefresh([["submissions"]]);
  return (
    <View className="flex-1">
    <ScrollView {...navScroll?.scrollProps}
      scrollHeader={<View className="pt-2"><AccountHeader profileRoute="StaffProfile" /></View>}
      alwaysBounceVertical overScrollMode="always"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      className="flex-1"
      contentContainerStyle={{ paddingBottom: footerClearance }}
      showsVerticalScrollIndicator={false}
    >
      <PageHeading title="Staff Dashboard" subtitle={firstName ? `Welcome back, ${firstName}` : 'Welcome back!'} />

      <SubmissionSummary />
      <RecentSubmissions />
    </ScrollView>
    </View>
  );
}
