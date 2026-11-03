import { useState } from 'react';
import { ScrollView, View, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import { colors, radii, type } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { getManualForRole } from '../../data/userManualContent';
import { APP_VERSION } from '../../data/legalContent';

export default function UserGuideScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, role } = useAuth();

  const manual = getManualForRole(role);

  // Keep track of which accordion cards are expanded. Initially expand first 2 sections.
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    if (manual.sections.length > 0) initial[manual.sections[0].id] = true;
    if (manual.sections.length > 1) initial[manual.sections[1].id] = true;
    return initial;
  });

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    manual.sections.forEach((s) => {
      all[s.id] = true;
    });
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const areAllExpanded = manual.sections.every((s) => expandedSections[s.id]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 250);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#245EA9', paddingTop: insets.top }}>
      {/* Header */}
      <SettingsHeader
        title="User Guide"
        subtitle={manual.title}
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
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
      >
        {/* Hero Role Banner */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            marginBottom: 10,
            shadowColor: '#183A60',
            shadowOffset: { width: 0, height: 1.5 },
            shadowOpacity: 0.035,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2.5,
                borderRadius: radii.chip,
                backgroundColor: role === 'student' ? '#DBEAFE' : '#E8EFF8',
              }}
            >
              <Text
                style={{
                  ...type.notificationBadge,
                  fontFamily: 'DMSans_700Bold',
                  fontSize: 10,
                  color: colors.blue,
                }}
              >
                {manual.badge}
              </Text>
            </View>
            <TouchableOpacity
              onPress={areAllExpanded ? collapseAll : expandAll}
              accessibilityRole="button"
              accessibilityLabel={areAllExpanded ? 'Collapse all sections' : 'Expand all sections'}
              style={{ paddingVertical: 4, paddingHorizontal: 6 }}
            >
              <Text
                style={{
                  ...type.meta,
                  fontFamily: 'DMSans_600SemiBold',
                  fontSize: 10.5,
                  color: colors.blue,
                }}
              >
                {areAllExpanded ? 'Collapse All' : 'Expand All'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={{
              ...type.heading,
              fontSize: 16,
              lineHeight: 22,
              fontFamily: 'DMSans_700Bold',
              color: colors.navy,
              marginBottom: 3,
            }}
          >
            {manual.title}
          </Text>

          <Text
            style={{
              ...type.body,
              fontSize: 12,
              lineHeight: 16,
              color: colors.muted,
              marginBottom: 8,
            }}
          >
            {manual.subtitle}
          </Text>

          {/* User Account Verification Pill */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 8,
              paddingHorizontal: 9,
              paddingVertical: 5.5,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Feather name="user-check" size={12} color={colors.blue} style={{ marginRight: 6 }} />
            <Text style={{ ...type.meta, fontSize: 10.5, color: colors.navy, flex: 1 }}>
              Authenticated as{' '}
              <Text style={{ fontFamily: 'DMSans_700Bold' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}
              </Text>{' '}
              ({role || 'guest'})
            </Text>
          </View>
        </View>

        {/* Section Accordion Cards */}
        {manual.sections.map((section) => {
          const isExpanded = !!expandedSections[section.id];
          return (
            <View
              key={section.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
                overflow: 'hidden',
                shadowColor: '#183A60',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 5,
                elevation: 1,
              }}
            >
              {/* Accordion Header */}
              <TouchableOpacity
                onPress={() => toggleSection(section.id)}
                accessibilityRole="button"
                accessibilityLabel={`${section.title}, ${isExpanded ? 'expanded' : 'collapsed'}`}
                accessibilityState={{ expanded: isExpanded }}
                activeOpacity={0.7}
                style={{
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 9.5,
                  backgroundColor: colors.surface,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.selectedSurface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 9,
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'DMSans_700Bold',
                      fontSize: 10.5,
                      color: colors.blue,
                    }}
                  >
                    {section.number}
                  </Text>
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      fontFamily: 'DMSans_700Bold',
                      fontSize: 13,
                      lineHeight: 17,
                      color: colors.navy,
                    }}
                  >
                    {section.title}
                  </Text>
                  {section.summary ? (
                    <Text
                      numberOfLines={isExpanded ? 2 : 1}
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        fontSize: 10.5,
                        lineHeight: 14,
                        color: colors.muted,
                        marginTop: 1,
                      }}
                    >
                      {section.summary}
                    </Text>
                  ) : null}
                </View>

                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={colors.muted}
                />
              </TouchableOpacity>

              {/* Accordion Body */}
              {isExpanded ? (
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingBottom: 11,
                    paddingTop: 3,
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                  }}
                >
                  <View style={{ gap: 6, marginTop: 4 }}>
                    {section.steps.map((step, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          backgroundColor: '#F8FAFC',
                          borderRadius: 8,
                          padding: 8,
                          borderWidth: 1,
                          borderColor: '#EDF2F7',
                        }}
                      >
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: '#E8EFF8',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 7,
                            marginTop: 1,
                            flexShrink: 0,
                          }}
                        >
                          <Feather name="check" size={9} color={colors.blue} />
                        </View>
                        <Text
                          style={{
                            ...type.body,
                            fontSize: 11.5,
                            lineHeight: 16,
                            color: '#334155',
                            flex: 1,
                          }}
                        >
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* Footer Support Info */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 12,
            marginTop: 4,
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: '#DBEAFE',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="help-circle" size={15} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 12, color: colors.navy }}>
              Need Additional Help?
            </Text>
            <Text style={{ ...type.meta, fontSize: 10.5, lineHeight: 14, color: colors.muted, marginTop: 1 }}>
              Visit the Student Center Building Ground Floor or contact OSA support.
            </Text>
          </View>
        </View>

        {/* Footer Branding */}
        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
          <Text
            style={{
              ...type.meta,
              fontSize: 11,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            VISTA Mobile v{APP_VERSION}
          </Text>
          <Text
            style={{
              ...type.meta,
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.75)',
              marginTop: 1.5,
              textAlign: 'center',
            }}
          >
            USTP Office of Student Affairs
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
