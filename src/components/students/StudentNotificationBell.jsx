import AppBottomSheet from '../common/AppBottomSheet';
import { TouchableOpacity, View, FlatList, ActivityIndicator, useWindowDimensions } from "react-native";
import { useRef, useState } from 'react';
import NotificationTabs, { filterNotifications } from './NotificationTabs';
import { NotificationsSkeleton } from '../common/Skeleton';
import StudentNotificationListItem from './StudentNotificationListItem';
import { useMarkNotificationRead } from '../../hooks/useStudentNotifications';
import { Feather } from "@expo/vector-icons";
import { sizes } from '../../theme/tokens';
import { useNavigation } from "@react-navigation/native";
import { Text } from "../common/FontText";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import { useNotifications } from "../../hooks/useStudentNotifications";

export default function StudentNotificationBell() {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const { role } = useAuth();
  const { data, isPending, isError, refetch } = useNotifications();
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const returnTrigger = useRef(null);
  const [tab, setTab] = useState('All');
  const markRead = useMarkNotificationRead();
  const items = filterNotifications(data?.results || [], tab).slice(0, 5);
  const openItem = async item => {
    returnTrigger.current = null;
    setOpen(false);
    if (!item.is_read) { try { await markRead.mutateAsync(item.notification_id); } catch {} }
    if (item.submission_id) navigation.navigate(role === ROLES.STUDENT ? 'StudentSubmissionDetails' : 'ReviewPanelDetails', { submission: { submission_id: item.submission_id } });
  };
  const unreadCount = data?.unread_count || 0;

  return (
    <>
    <TouchableOpacity
      ref={trigger}
      onPress={() => { returnTrigger.current = trigger; setTab('All'); setOpen(true); refetch(); }}
      accessibilityRole="button"
      accessibilityLabel={
        unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
      }
      style={{ width: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' }}
    >
      <Feather name="bell" size={23} color="#111827" />
      {unreadCount > 0 ? (
        <View className="absolute -top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 items-center justify-center border-2 border-[#F3F3F3]">
          <Text className="text-white text-[9px] font-extrabold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
    <AppBottomSheet portal returnFocusRef={returnTrigger} visible={open} title="Notifications" onClose={() => setOpen(false)} scroll={false}>
          <Text className="text-slate-500 text-xs">Latest updates · Past 30 days</Text>
          <NotificationTabs value={tab} onChange={setTab} />
          {isPending ? <NotificationsSkeleton /> : isError ? <TouchableOpacity onPress={() => refetch()} style={{ padding: 20 }}><Text>Could not load notifications. Tap to retry.</Text></TouchableOpacity> :
            <FlatList style={{ flexGrow: 0, flexShrink: 1, maxHeight: height * 0.45 }} data={items} keyExtractor={item => item.notification_id} renderItem={({ item }) => <StudentNotificationListItem notification={item} onPress={() => openItem(item)} />}
              ListEmptyComponent={<Text className="text-slate-500 text-center py-6">No {tab === 'All' ? '' : tab.toLowerCase() + ' '}notifications</Text>} />}
          <TouchableOpacity className="bg-[#1A59A5] rounded-full items-center py-3 mt-3" onPress={() => { returnTrigger.current = null; setOpen(false); navigation.navigate(role === ROLES.STUDENT ? 'StudentNotifications' : 'StaffNotifications'); }}><Text className="text-white font-bold">View more notifications</Text></TouchableOpacity>
    </AppBottomSheet>
    </>
  );
}
