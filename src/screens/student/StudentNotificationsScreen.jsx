import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import { Text } from "../../components/common/FontText";
import StudentNotificationListItem from "../../components/student/StudentNotificationListItem";
import {
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useStudentNotifications";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const { data, isPending, isError, isFetching, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const { refreshing, onRefresh } = useScreenRefresh([["notifications"]]);
  const notifications = data?.results || [];

  const openNotification = useCallback(async (item) => {
    if (!item.is_read) {
      try {
        await markRead.mutateAsync(item.notification_id);
      } catch {
        // Keep navigation available when marking read fails.
      }
    }
    if (item.submission_id) {
      navigation.navigate(
        role === ROLES.STUDENT ? "StudentSubmissionDetails" : "ReviewPanelDetails",
        { submission: { submission_id: item.submission_id } },
      );
    }
  }, [markRead, navigation, role]);

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-4 pb-3 bg-white border-b border-slate-100">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="w-10 h-10 items-center justify-center mr-2"
          >
            <Feather name="chevron-left" size={25} color="#1E3A68" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-vistaNavy text-xl font-extrabold">Notifications</Text>
            <Text className="text-slate-500 text-xs mt-1">Submission and Drive updates from the past 30 days</Text>
          </View>
          {data ? (
            <View className="bg-[#EAF0FA] rounded-full px-3 py-2">
              <Text className="text-vistaNavy text-xs font-bold">
                {data.unread_count || 0} unread
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#245EA9" />
          <Text className="text-slate-500 text-sm mt-3">Loading notifications…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={30} color="#B45309" />
          <Text className="text-vistaNavy font-bold mt-3 text-center">Could not load notifications</Text>
          <Text className="text-slate-500 text-sm mt-2 text-center">Check your connection and try again.</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            disabled={isFetching}
            className="bg-vistaNavy rounded-xl px-5 py-3 mt-4"
          >
            {isFetching ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-sm">Try again</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notification_id}
          renderItem={({ item }) => (
            <StudentNotificationListItem
              notification={item}
              onPress={() => openNotification(item)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 30, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <View className="w-14 h-14 rounded-2xl bg-[#EAF0FA] items-center justify-center">
                <Feather name="bell" size={24} color="#245EA9" />
              </View>
              <Text className="text-vistaNavy font-bold mt-4">You’re all caught up</Text>
              <Text className="text-slate-500 text-sm mt-1 text-center">New updates will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
