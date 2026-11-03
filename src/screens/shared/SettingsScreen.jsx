import { useState, useRef } from 'react';
import { ScrollView, View, Linking, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import SettingsSection from '../../components/settings/SettingsSection';
import SettingsRow from '../../components/settings/SettingsRow';
import AppBottomSheet from '../../components/common/AppBottomSheet';
import AppButton from '../../components/common/AppButton';
import { colors, type } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { queryClient } from '../../lib/queryClient';
import { ROLES } from '../../constants/roles';
import { CONTACT_EMAIL, APP_VERSION } from '../../data/legalContent';

const PROFILE_BLUE = '#245EA9';

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
    <View style={{ flex: 1, backgroundColor: PROFILE_BLUE, paddingTop: insets.top }}>
      {/* 1. Symmetrical Top Header: Back arrow & Title in white, VISTA icon on right */}
      <SettingsHeader
        title="Settings"
        onBack={handleBack}
        showVistaIcon
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
        {/* Section 1 — Preferences */}
        <SettingsSection title="PREFERENCES">
          <SettingsRow
            icon="bell"
            label="Notifications"
            description="Push and in-app alerts"
            onPress={() => navigation.navigate('NotificationPreferences')}
          />
        </SettingsSection>

        {/* Section 2 — Help & Support */}
        <SettingsSection title="HELP & SUPPORT">
          <SettingsRow
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
            icon="help-circle"
            label="Frequently Asked Questions"
            description="Answers to common questions"
            hasDivider
            onPress={() => setFaqOpen(true)}
          />
          <SettingsRow
            icon="mail"
            label="Contact OSA Support"
            description="Office of Student Affairs assistance"
            hasDivider
            onPress={() => setContactOpen(true)}
          />
          <SettingsRow
            icon="alert-circle"
            label="Report a Technical Issue"
            description="Report bugs or connection problems"
            onPress={() => setReportOpen(true)}
          />
        </SettingsSection>

        {/* Section 3 — Legal & Information */}
        <SettingsSection title="LEGAL & INFORMATION">
          <SettingsRow
            icon="shield"
            label="Privacy Policy"
            description="How VISTA handles your information"
            hasDivider
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'privacy' })}
          />
          <SettingsRow
            icon="file-text"
            label="Terms of Service"
            description="Responsibilities and usage terms"
            hasDivider
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'terms' })}
          />
          <SettingsRow
            icon="award"
            label="Community & Submission Guidelines"
            description="Submission authenticity and etiquette"
            hasDivider
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'guidelines' })}
          />
          <SettingsRow
            icon="info"
            label="About VISTA"
            description="Platform purpose, version & build"
            onPress={() => navigation.navigate('LegalDocument', { documentType: 'about' })}
          />
        </SettingsSection>

        {/* Footer Branding: Version and Office Caption */}
        <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 4 }}>
          <Text
            style={{
              fontFamily: 'DMSans_500Medium',
              fontSize: 11,
              lineHeight: 15,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            VISTA Mobile v{APP_VERSION}
          </Text>
          <Text
            style={{
              fontFamily: 'DMSans_400Regular',
              fontSize: 10,
              lineHeight: 14,
              color: 'rgba(255, 255, 255, 0.75)',
              marginTop: 1.5,
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
                  onPress={() => toggleFaq(idx)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontFamily: 'DMSans_600SemiBold',
                        fontSize: 12.5,
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
                        fontSize: 11.5,
                        lineHeight: 16,
                        color: '#475569',
                        marginTop: 5,
                        paddingTop: 5,
                        borderTopWidth: 1,
                        borderTopColor: '#E2E8F0',
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
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="map-pin" size={14} color={colors.blue} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12.5, color: colors.navy }}>
                Student Center Building, Ground Floor
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="clock" size={14} color={colors.blue} />
              <Text style={{ ...type.body, fontSize: 11.5, color: colors.muted }}>
                Monday – Friday: 8:00 AM – 5:00 PM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="mail" size={14} color={colors.blue} />
              <Text style={{ ...type.body, fontSize: 11.5, color: colors.blue }}>
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
          <Text style={{ ...type.body, fontSize: 12, lineHeight: 17, color: '#334155' }}>
            Encountered a bug, display glitch, or network problem? Sending a report will include basic diagnostics
            to help resolve it quickly.
          </Text>
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 8,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ ...type.meta, fontSize: 10.5, color: colors.muted }}>
              App: VISTA Mobile v{APP_VERSION} ({Platform.OS})
            </Text>
            <Text style={{ ...type.meta, fontSize: 10.5, color: colors.muted, marginTop: 1.5 }}>
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
