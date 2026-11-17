import { useScreenRefresh } from '../../hooks/useScreenRefresh';
import { useState } from 'react';
import { ScrollView, View, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import { colors, radii, type, space, sizes, settingsLayout } from '../../theme/tokens';
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
  const { refreshing, onRefresh: handleRefresh } = useScreenRefresh([]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <SettingsHeader
        variant="grouped"
        title="User Guide"
        subtitle={manual.title}
        onBack={() => navigation.goBack()}
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
          paddingBottom: Math.max(insets.bottom, space.lg) + space.lg,
        }}
      >
        {/* Hero Role Banner */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: settingsLayout.cardRadius,
            borderWidth: 1,
            borderColor: colors.border,
            padding: space.lg,
            marginBottom: space.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2.5,
                borderRadius: radii.chip,
                backgroundColor: colors.selectedSurface,
              }}
            >
              <Text
                style={{
                  ...type.notificationBadge,
                  fontFamily: 'DMSans_700Bold',
                  fontSize: type.meta.fontSize,
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
              style={{ minHeight: sizes.touch, justifyContent: 'center', paddingHorizontal: space.sm }}
            >
              <Text
                style={{
                  ...type.meta,
                  fontFamily: 'DMSans_600SemiBold',
                  fontSize: type.meta.fontSize,
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
              fontSize: type.heading.fontSize,
              lineHeight: type.heading.lineHeight,
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
              fontSize: type.meta.fontSize,
              lineHeight: type.meta.lineHeight,
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
              backgroundColor: colors.field,
              borderRadius: radii.chip,
              paddingHorizontal: 9,
              paddingVertical: 5.5,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Feather name="user-check" size={12} color={colors.blue} style={{ marginRight: 6 }} />
            <Text style={{ ...type.meta, fontSize: type.meta.fontSize, color: colors.navy, flex: 1 }}>
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
                borderRadius: settingsLayout.cardRadius,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
                overflow: 'hidden',
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
                  minHeight: settingsLayout.rowMinHeight,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: space.lg,
                  paddingVertical: space.md,
                  backgroundColor: colors.surface,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: radii.field,
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
                      fontSize: type.meta.fontSize,
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
                      fontSize: type.field.fontSize,
                      lineHeight: type.field.lineHeight,
                      color: colors.navy,
                    }}
                  >
                    {section.title}
                  </Text>
                  {section.summary ? (
                    <Text
                      style={{
                        fontFamily: 'DMSans_400Regular',
                        fontSize: type.meta.fontSize,
                        lineHeight: type.meta.lineHeight,
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
                    paddingHorizontal: space.lg,
                    paddingBottom: 11,
                    paddingTop: 3,
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                  }}
                >
                  <View style={{ gap: space.md, marginTop: space.md }}>
                    {section.steps.map((step, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          paddingVertical: space.xs,
                        }}
                      >
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: radii.chip,
                            backgroundColor: colors.selectedSurface,
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
                            fontSize: type.body.fontSize,
                            lineHeight: type.body.lineHeight,
                            color: colors.text,
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
            borderRadius: settingsLayout.cardRadius,
            borderWidth: 1,
            borderColor: colors.border,
            padding: space.lg,
            marginTop: 4,
            marginBottom: space.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: settingsLayout.cardRadius,
              backgroundColor: colors.selectedSurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="help-circle" size={15} color={colors.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: type.meta.fontSize, color: colors.navy }}>
              Need Additional Help?
            </Text>
            <Text style={{ ...type.meta, fontSize: type.meta.fontSize, lineHeight: type.meta.lineHeight, color: colors.muted, marginTop: 1 }}>
              Visit the Student Center Building Ground Floor or contact OSA support.
            </Text>
          </View>
        </View>

        {/* Footer Branding */}
        <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
          <Text
            style={{
              ...type.meta,
              fontSize: type.meta.fontSize,
              color: colors.muted,
              textAlign: 'center',
            }}
          >
            VISTA Mobile v{APP_VERSION}
          </Text>
          <Text
            style={{
              ...type.meta,
              fontSize: type.meta.fontSize,
              color: colors.muted,
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
