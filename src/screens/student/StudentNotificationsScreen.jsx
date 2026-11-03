import AppButton from '../../components/common/AppButton';
import AccountHeader from '../../components/common/AccountHeader';
import { useStaffLayout, useBottomNavClearance } from '../../theme/layout';
import { useCallback, useRef, useState } from "react";
import NotificationTabs, { filterNotifications } from '../../components/students/NotificationTabs';
import { NotificationsSkeleton } from '../../components/common/Skeleton';
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import VistaIcon from '../../components/common/VistaIcon';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import { Text } from "../../components/common/FontText";
import StudentNotificationListItem from "../../components/students/StudentNotificationListItem";
import {
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useStudentNotifications";
import { useScreenRefresh } from "../../hooks/useScreenRefresh";
import StudentBottomNav from '../../components/students/StudentBottomNav';
import StaffBottomNav from '../../components/staff/StaffBottomNav';
import { openDocumentEntryWithAttachment } from '../../utils/openDocumentEntryWithAttachment';
import NotificationDetailSheet from '../../components/students/NotificationDetailSheet';
import { colors, space, type, sizes, radii } from '../../theme/tokens';
import StaleWarningBanner from '../../components/common/StaleWarningBanner';

export default function NotificationsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const screenLayout = useStaffLayout();
  const footerClearance = useBottomNavClearance();
  const { role } = useAuth();
  const { data, isPending, isError, error, isFetching, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const { refreshing, onRefresh } = useScreenRefresh([["notifications"]]);
  const [tab, setTab] = useState('All');
  const [selected, setSelected] = useState(null);
  const selectedTrigger = useRef(null);
  const [markingAll, setMarkingAll] = useState(false);
  const notifications = filterNotifications(data?.results || [], tab);

  const unreadItems = (data?.results || []).filter((item) => !item.is_read);
  const hasUnread = unreadItems.length > 0;
  const hasData = (data?.results || []).length > 0;
  const isAuthError = [401, 403].includes(error?.status || error?.response?.status);

  const handleMarkAllAsRead = useCallback(async () => {
    const unread = (data?.results || []).filter((item) => !item.is_read);
    if (!unread.length || markingAll) return;
    setMarkingAll(true);
    try {
      await Promise.allSettled(
        unread.map((item) => markRead.mutateAsync(item.notification_id))
      );
    } finally {
      setMarkingAll(false);
    }
  }, [data?.results, markRead, markingAll]);

  const openNotification = useCallback(async (item) => {
    setSelected(item);
    if (!item.is_read) {
      try {
        await markRead.mutateAsync(item.notification_id);
      } catch {
        // Keep the detail sheet and linked submission available when marking read fails.
      }
    }
  }, [markRead]);

  const staffActiveTab = (() => {
    if (route?.params?.previousTab) return route.params.previousTab;
    const navState = navigation?.getState?.();
    const prevRoute = navState?.routes?.[navState.index - 1]?.name;
    const routeToTab = {
      StaffHome: 'home',
      StaffDocumentEntry: 'profile',
      StaffReviewPanel: 'reports',
      GDriveSync: 'cloud',
    };
    return (prevRoute && routeToTab[prevRoute]) || 'home';
  })();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* 1. Page Header: Dashboard Top Header Row */}
      <View style={[screenLayout.horizontal, { paddingTop: 8 }]}>
        <AccountHeader profileRoute={role === ROLES.STUDENT ? 'StudentProfile' : 'StaffProfile'} />

        {/* 2. Notifications Heading */}
        <Text accessibilityRole="header" style={{ ...type.title, color: '#142B52' }}>
          Notifications
        </Text>

        {/* 3. Subtitle */}
        <Text
          style={{
            ...type.body,
            color: '#64748B',
            marginTop: 4,
            marginBottom: 2,
          }}
        >
          Submission and Drive updates from the past 30 days
        </Text>

        {/* 4. Notification Filters */}
        <NotificationTabs
          variant="compact"
          showCounts
          items={data?.results || []}
          value={tab}
          onChange={setTab}
          style={{ marginVertical: 0 }}
        />

        {/* 5. Section Heading & Mark All As Read */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 6 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: 'DMSans_600SemiBold',
              fontSize: 12,
              lineHeight: 16,
              color: '#142B52',
              includeFontPadding: false,
            }}
          >
            Recent Notifications
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
            disabled={!hasUnread || markingAll}
            onPress={handleMarkAllAsRead}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 2 }}
          >
            <Text
              style={{
                fontFamily: type.bold,
                fontSize: 10,
                lineHeight: 14,
                color: hasUnread ? colors.blue : '#94A3B8',
                opacity: markingAll ? 0.6 : 1,
                includeFontPadding: false,
              }}
            >
              {markingAll ? 'Marking read...' : 'Mark all as read'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List content / Skeleton / Error / Empty */}
      {isPending && !hasData ? (
        <View style={screenLayout.horizontal}><NotificationsSkeleton /></View>
      ) : isError && (!hasData || isAuthError) ? (
        <View style={[screenLayout.horizontal, { paddingVertical: space.xxl, gap: space.sm, alignItems: 'flex-start' }]}>
          <VistaIcon name="alert-circle" size={18} color={colors.danger} />
          <Text accessibilityRole="alert" style={{ ...type.notificationTitle, color: colors.text }}>Could not load notifications</Text>
          <Text style={{ ...type.body, color: colors.muted }}>Check your connection and try again.</Text>
          <AppButton label="Try again" busy={isFetching} onPress={() => refetch()} />
        </View>
      ) : (
        <>
          {isError && hasData && !isAuthError ? (
            <View style={screenLayout.horizontal}>
              <StaleWarningBanner />
            </View>
          ) : null}
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.notification_id}
            renderItem={({ item }) => (
              <StudentNotificationListItem
                notification={item}
                onPress={trigger => { selectedTrigger.current = trigger; openNotification(item); }}
              />
            )}
            contentContainerStyle={{
              ...screenLayout.horizontal,
              paddingTop: 0,
              paddingBottom: footerClearance,
              flexGrow: 1,
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'flex-start', paddingVertical: 24, gap: space.sm }}>
                <VistaIcon name="bell" size={18} color={colors.muted} />
                <Text style={{ ...type.notificationTitle, color: colors.text }}>You’re all caught up</Text>
                <Text style={{ ...type.body, color: colors.muted }}>New updates will appear here.</Text>
              </View>
            }
          />
        </>
      )}
      {role === ROLES.STUDENT ? (
        <StudentBottomNav
          activeTab="notifications"
          onHomePress={() => navigation.navigate('StudentHome')}
          onTrackerPress={() => navigation.navigate('StudentTracker')}
        />
      ) : role === ROLES.STAFF ? (
        <StaffBottomNav
          activeTab={staffActiveTab}
          onHomePress={() => navigation.navigate('StaffHome')}
          onProfilePress={() => navigation.navigate('StaffDocumentEntry')}
          onScanPress={() => openDocumentEntryWithAttachment(navigation)}
          onReportsPress={() => navigation.navigate('StaffReviewPanel')}
          onCloudPress={() => navigation.navigate('GDriveSync')}
        />
      ) : null}
      <NotificationDetailSheet
        returnFocusRef={selectedTrigger}
        notification={selected}
        onClose={() => setSelected(null)}
        onOpenSubmission={() => {
          const item = selected;
          selectedTrigger.current = null;
          setSelected(null);
          if (item?.submission_id) {
            navigation.navigate(role === ROLES.STUDENT ? 'StudentSubmissionDetails' : 'ReviewPanelDetails', {
              submission: { submission_id: item.submission_id },
            });
          }
        }}
      />
    </View>
  );
}
