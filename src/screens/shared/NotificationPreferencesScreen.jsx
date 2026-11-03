import { useState, useEffect } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import { colors, radii, type } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

const PROFILE_BLUE = '#245EA9';

function StatusPill({ label = 'Enabled' }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2.5,
        borderRadius: radii.chip,
        backgroundColor: colors.selectedSurface,
      }}
    >
      <Text
        style={{
          fontFamily: 'DMSans_700Bold',
          fontSize: 10.5,
          color: colors.blue,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function NotificationPreferencesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const isStudent = role === ROLES.STUDENT;
  const [refreshing, setRefreshing] = useState(false);
  const [pushStatus, setPushStatus] = useState('Active');

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status, granted }) => {
      setPushStatus(granted || status === 'granted' ? 'Active' : 'Disabled');
    }).catch(() => {});
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const { status, granted } = await Notifications.getPermissionsAsync();
      setPushStatus(granted || status === 'granted' ? 'Active' : 'Disabled');
    } catch {
      // Graceful error handling
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: PROFILE_BLUE, paddingTop: insets.top }}>
      {/* Symmetrical Header */}
      <SettingsHeader
        title="Notification Preferences"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a59a5', '#fdc849']}
            tintColor="#FFFFFF"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 2,
          paddingBottom: Math.max(insets.bottom, 16) + 12,
        }}
      >
        {/* Section 1 — Delivery Channels */}
        <SettingsSection title="DELIVERY CHANNELS">
          <SettingsRow
            icon="smartphone"
            label="Push Notifications"
            description="Native Android push alerts via Firebase (FCM)"
            showChevron={false}
            rightElement={<StatusPill label={pushStatus} />}
            hasDivider
          />
          <SettingsRow
            icon="bell"
            label="In-App Alerts"
            description="Notification center with unread status badges"
            showChevron={false}
            rightElement={<StatusPill label="Enabled" />}
            hasDivider
          />
          <SettingsRow
            icon="mail"
            label="Email Dispatches"
            description="Automated Gmail dispatches for official status changes"
            showChevron={false}
            rightElement={<StatusPill label="Enabled" />}
          />
        </SettingsSection>

        {/* Section 2 — Trigger Events */}
        <SettingsSection title="TRIGGER EVENTS">
          <SettingsRow
            icon="check-circle"
            label="Status Transitions"
            description="Alerts when moved to On Process, Approved, Rejected, or Returned"
            showChevron={false}
            rightElement={<StatusPill label="Enabled" />}
            hasDivider
          />
          <SettingsRow
            icon="message-square"
            label="Staff Remarks"
            description="Updates when staff attach official evaluation notes"
            showChevron={false}
            rightElement={<StatusPill label="Enabled" />}
            hasDivider
          />
          <SettingsRow
            icon="corner-down-right"
            label="Conversation Replies"
            description="Alerts for threaded discussion replies"
            showChevron={false}
            rightElement={<StatusPill label="Enabled" />}
          />
        </SettingsSection>

        {/* Section 3 — Notification Inbox */}
        <SettingsSection title="NOTIFICATION INBOX">
          <SettingsRow
            icon="inbox"
            label="Open Notification Center"
            description="View unread alerts, priority flags, and history"
            onPress={() =>
              navigation.navigate(isStudent ? 'StudentNotifications' : 'StaffNotifications')
            }
          />
        </SettingsSection>

        {/* Informational Policy Note */}
        <View style={{ paddingHorizontal: 6, marginTop: 6 }}>
          <Text
            style={{
              ...type.meta,
              fontSize: 10.5,
              lineHeight: 15,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
            }}
          >
            Under VISTA policy, genuine submission transitions automatically notify eligible recipients across
            in-app, native push, and email channels.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
