import { useState, useRef } from 'react';
import { ScrollView, View, Linking, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import UserAvatar from '../../components/common/UserAvatar';
import AppBottomSheet from '../../components/common/AppBottomSheet';
import AppButton from '../../components/common/AppButton';
import { colors, type, radii, sizes, space, settingsTones, settingsLayout } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { queryClient } from '../../lib/queryClient';
import { ROLES } from '../../constants/roles';
import { CONTACT_EMAIL, APP_VERSION } from '../../data/legalContent';
import { useUpdateManager } from '../../components/common/UpdateManager';
import { useToast } from '../../components/common/Toast';

const FAQ_ITEMS = [
  {
    q: 'What does "On Process" status mean?',
    a: 'Every newly created submission starts in "On Process" (Under Review). It means your documents have been successfully persisted in PostgreSQL and queued for review by the Office of Student Affairs.',
  },
  {
    q: 'How long does a review typically take?',
    a: 'Normal review times range from 2 to 5 business days, depending on submission volume and required administrative endorsements.',
  },
  {
    q: 'Can I edit a submission after sending?',
    a: 'Direct edits are locked once submitted to maintain audit integrity. If OSA reviewers require updates, they will set the status to "Resubmission Required" and you can reply with replacement files.',
  },
  {
    q: 'Who can view my organization’s submissions?',
    a: 'Only authorized members of your organization and OSA staff reviewers can view the submission. Peer members have "View Only" access, while the original submitter can reply to staff remarks.',
  },
  {
    q: 'Why didn’t I receive a push notification?',
    a: 'Verify that notifications are enabled for VISTA in your device settings. All status updates also appear in your in-app Notification Center and institutional email inbox.',
  },
];

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, role, updateUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const updateManager = useUpdateManager();
  const toast = useToast();

  const handleCheckForUpdates = async () => {
    if (checkingUpdates) return;
    setCheckingUpdates(true);
    try {
      const release = await updateManager?.checkNow();
      if (!release) toast.info('VISTA is up to date.');
    } catch (error) {
      toast.error(error?.message || 'Could not check for updates. Try again later.');
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (user?.user_id) {
        const freshUser = await authService.me();
        if (freshUser) {
          updateUser(freshUser);
          queryClient.invalidateQueries({ queryKey: ['profile', user.user_id] });
        }
      }
    } catch {
      // Retain existing state on network error
    } finally {
      setRefreshing(false);
    }
  };

  const [faqOpen, setFaqOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState({});

  const faqTrigger = useRef(null);
  const contactTrigger = useRef(null);
  const reportTrigger = useRef(null);

  const isStudent = role === ROLES.STUDENT;

  const toggleFaq = (idx) => {
    setExpandedFaq((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleOpenEmail = (subject = 'VISTA Support Inquiry', body = '') => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`).catch(() => {});
  };

  const handleReportIssue = () => {
    const diagnostics = `\n\n--- Diagnostics ---\nApp Version: ${APP_VERSION}\nPlatform: ${Platform.OS} (${Platform.Version})\nUser Role: ${role || 'unknown'}\nUser ID: ${user?.user_id || 'N/A'}`;
    handleOpenEmail('VISTA Technical Issue Report', `Please describe the issue you encountered:\n${diagnostics}`);
    setReportOpen(false);
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.(isStudent ? 'StudentHome' : 'StaffHome');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <SettingsHeader
        title="Settings"
        onBack={handleBack}
        showVistaIcon
        variant="grouped"
      />

      <ScrollView
        alwaysBounceVertical overScrollMode="always"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.blue, colors.yellow]}
            tintColor={colors.blue}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.lg,
          paddingBottom: Math.max(insets.bottom, space.lg) + space.md,
        }}
      >
        <View
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface,
            borderWidth: 1, borderColor: colors.border, borderRadius: settingsLayout.cardRadius,
            padding: space.lg, marginBottom: space.xxl }}>
          <UserAvatar uri={user?.image_url} size={settingsLayout.profileAvatar} />
          <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
            <Text style={{ ...type.sectionTitle, color: colors.navy }}>{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your account'}</Text>
            {user?.email ? <Text numberOfLines={1} style={{ ...type.meta, color: colors.muted }}>{user.email}</Text> : null}
          </View>
        </View>
        {/* Section 1 — Preferences */}
        <SettingsSection title="Preferences" variant="grouped">
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.notification}
            icon="bell"
            label="Notifications"
            description="Push and in-app alerts"
            onPress={() => navigation.navigate('NotificationPreferences')}
          />
        </SettingsSection>

        <SettingsSection title="App updates" variant="grouped">
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.update}
            busy={checkingUpdates}
            showChevron={false}
            icon="download"
            label={checkingUpdates ? 'Checking for updates…' : 'Check for updates'}
            description="Get the latest version of VISTA Mobile"
            onPress={handleCheckForUpdates}
          />
        </SettingsSection>

        {/* Section 2 — Help & Support */}
        <SettingsSection title="Help & support" variant="grouped">
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.guide}
            icon="play-circle"
            label="View app tour"
            description="Explore VISTA's Student and Staff features"
            hasDivider
            onPress={() => navigation.navigate('AppTour')}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.guide}
            icon="book-open"
            label="User Guide"
            description={
              isStudent
                ? 'Student submission and tracking manual'
                : 'OSA staff review and processing manual'
            }
            hasDivider
            onPress={() => navigation.navigate('UserGuide')}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.help}
            icon="help-circle"
            triggerRef={faqTrigger}
            label="Frequently Asked Questions"
            description="Answers to common questions"
            hasDivider
            onPress={() => setFaqOpen(true)}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.support}
            icon="mail"
            triggerRef={contactTrigger}
            label="Contact OSA Support"
            description="Office of Student Affairs assistance"
            hasDivider
            onPress={() => setContactOpen(true)}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.issue}
            icon="alert-circle"
            triggerRef={reportTrigger}
            label="Report a Technical Issue"
            description="Report bugs or connection problems"
            onPress={() => setReportOpen(true)}
          />
        </SettingsSection>

        {/* Section 3 — Legal & Information */}
        <SettingsSection title="Legal & information" variant="grouped">
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.privacy}
            icon="shield"
            label="Privacy Policy"
            description="How VISTA handles your information"
            hasDivider
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'privacy' })}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.document}
            icon="file-text"
            label="Terms of Service"
            description="Responsibilities and usage terms"
            hasDivider
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'terms' })}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.community}
            icon="award"
            label="Community & Submission Guidelines"
            description="Submission authenticity and etiquette"
            hasDivider
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'guidelines' })}
          />
          <SettingsRow
            variant="grouped"
            iconColor={settingsTones.about}
            icon="info"
            label="About VISTA"
            description="Platform purpose, version & build"
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'about' })}
          />
        </SettingsSection>

        {/* Footer Branding: Version and Office Caption */}
        <View style={{ alignItems: 'center', marginTop: space.xs, marginBottom: space.xs }}>
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: type.meta.fontSize,
              lineHeight: type.meta.lineHeight,
              color: colors.muted,
              textAlign: 'center',
            }}
          >
            VISTA Mobile v{APP_VERSION}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: type.meta.fontSize,
              lineHeight: type.meta.lineHeight,
              color: colors.muted,
              marginTop: space.xs,
              textAlign: 'center',
            }}
          >
            USTP Office of Student Affairs
          </Text>
        </View>
      </ScrollView>

      {/* Frequently Asked Questions Bottom Sheet */}
      <AppBottomSheet
        visible={faqOpen}
        title="Frequently Asked Questions"
        onClose={() => setFaqOpen(false)}
        returnFocusRef={faqTrigger}
      >
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 6, paddingBottom: 8 }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = !!expandedFaq[idx];
              return (
                <TouchableOpacity
                  key={idx}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => toggleFaq(idx)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.field,
                    borderRadius: radii.chip,
                    padding: space.md,
                    minHeight: sizes.touch,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: 'DMSans_600SemiBold',
                        fontSize: type.field.fontSize,
                        color: colors.navy,
                        flex: 1,
                        marginRight: 6,
                      }}
                    >
                      {item.q}
                    </Text>
                    <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.muted} />
                  </View>
                  {isOpen ? (
                    <Text
                      style={{
                        ...type.body,
                        fontSize: type.body.fontSize,
                        lineHeight: type.body.lineHeight,
                        color: colors.text,
                        marginTop: 5,
                        paddingTop: 5,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      {item.a}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <AppButton label="Close" onPress={() => setFaqOpen(false)} variant="secondary" />
      </AppBottomSheet>

      {/* Contact OSA Support Bottom Sheet */}
      <AppBottomSheet
        visible={contactOpen}
        title="Contact OSA Support"
        onClose={() => setContactOpen(false)}
        returnFocusRef={contactTrigger}
      >
        <View style={{ gap: 8, paddingBottom: 10 }}>
          <View
            style={{
              backgroundColor: colors.field,
              borderRadius: radii.chip,
              padding: space.lg,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="map-pin" size={14} color={colors.blue} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: type.field.fontSize, color: colors.navy, flex: 1 }}>
                Student Center Building, Ground Floor
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="clock" size={14} color={colors.blue} />
              <Text style={{ ...type.body, fontSize: type.meta.fontSize, color: colors.muted }}>
                Monday – Friday: 8:00 AM – 5:00 PM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="mail" size={14} color={colors.blue} />
              <Text style={{ ...type.body, fontSize: type.meta.fontSize, color: colors.blue }}>
                {CONTACT_EMAIL}
              </Text>
            </View>
          </View>
          <AppButton
            label="Send Email to OSA"
            onPress={() => {
              handleOpenEmail('VISTA Inquiry — Office of Student Affairs');
              setContactOpen(false);
            }}
          />
          <AppButton label="Cancel" onPress={() => setContactOpen(false)} variant="secondary" />
        </View>
      </AppBottomSheet>

      {/* Report Technical Issue Bottom Sheet */}
      <AppBottomSheet
        visible={reportOpen}
        title="Report Technical Issue"
        onClose={() => setReportOpen(false)}
        returnFocusRef={reportTrigger}
      >
        <View style={{ gap: 8, paddingBottom: 10 }}>
          <Text style={{ ...type.body, fontSize: type.meta.fontSize, lineHeight: type.meta.lineHeight, color: colors.text }}>
            Encountered a bug, display glitch, or network problem? Sending a report will include basic diagnostics
            to help resolve it quickly.
          </Text>
          <View
            style={{
              backgroundColor: colors.field,
              borderRadius: radii.chip,
              padding: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ ...type.meta, fontSize: type.meta.fontSize, color: colors.muted }}>
              App: VISTA Mobile v{APP_VERSION} ({Platform.OS})
            </Text>
            <Text style={{ ...type.meta, fontSize: type.meta.fontSize, color: colors.muted, marginTop: 1.5 }}>
              Account: {user?.email || 'N/A'} ({role || 'guest'})
            </Text>
          </View>
          <AppButton label="Compose Issue Report" onPress={handleReportIssue} />
          <AppButton label="Cancel" onPress={() => setReportOpen(false)} variant="secondary" />
        </View>
      </AppBottomSheet>
    </View>
  );
}
