import { useScreenRefresh } from '../../hooks/useScreenRefresh';
import { ScrollView, View, Linking, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import { colors, radii, type, space, sizes, settingsLayout } from '../../theme/tokens';
import { LEGAL_DOCUMENTS, CONTACT_EMAIL, APP_VERSION } from '../../data/legalContent';

export default function LegalDocumentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const documentType = route?.params?.documentType || 'privacy';

  const doc = LEGAL_DOCUMENTS[documentType] || LEGAL_DOCUMENTS.privacy;
  const { refreshing, onRefresh: handleRefresh } = useScreenRefresh([]);

  const handleEmailSupport = () => {
    const subject = encodeURIComponent(`Legal Inquiry: ${doc.title}`);
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}`).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <SettingsHeader
        variant="grouped"
        title={doc.title}
        subtitle={doc.eyebrow}
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
        {/* Hero Meta Card */}
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
          {/* Eyebrow & Status Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm, marginBottom: space.md }}>
            <Text
              style={{
                ...type.meta,
                fontFamily: 'DMSans_600SemiBold',
                fontSize: type.meta.fontSize,
                flexShrink: 1,
                letterSpacing: 0.6,
                color: colors.blue,
                textTransform: 'uppercase',
              }}
            >
              {doc.eyebrow}
            </Text>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2.5,
                borderRadius: radii.chip,
                backgroundColor: doc.isDraft ? colors.warningSurface : colors.selectedSurface,
              }}
            >
              <Text
                style={{
                  ...type.notificationBadge,
                  fontFamily: 'DMSans_700Bold',
                  fontSize: type.meta.fontSize,
                  color: doc.isDraft ? colors.warning : colors.blue,
                }}
              >
                {doc.status}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              ...type.heading,
              fontSize: type.navigationTitle.fontSize,
              lineHeight: type.navigationTitle.lineHeight,
              fontFamily: 'DMSans_700Bold',
              color: colors.navy,
              marginBottom: 6,
            }}
          >
            {doc.title}
          </Text>

          {/* Summary Box */}
          <View
            style={{
              backgroundColor: colors.selectedSurface,
              borderRadius: radii.chip,
              padding: 10,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                ...type.body,
                fontSize: type.meta.fontSize,
                lineHeight: type.meta.lineHeight,
                color: colors.text,
              }}
            >
              {doc.summary}
            </Text>
          </View>

          {/* Metadata Footer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Feather name="calendar" size={11} color={colors.muted} />
            <Text style={{ ...type.meta, fontSize: type.meta.fontSize, color: colors.muted }}>
              {doc.lastUpdated}
            </Text>
          </View>
        </View>

        {/* Section Cards */}
        {doc.sections.map((section) => (
          <View
            key={section.number}
            style={{
              backgroundColor: colors.surface,
              borderRadius: settingsLayout.cardRadius,
              borderWidth: 1,
              borderColor: colors.border,
              padding: space.lg,
              marginBottom: space.lg,
            }}
          >
            {/* Section Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: radii.field,
                  backgroundColor: colors.selectedSurface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 9,
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
              <Text
                style={{
                  fontFamily: 'DMSans_700Bold',
                  fontSize: type.field.fontSize,
                  lineHeight: type.field.lineHeight,
                  color: colors.navy,
                  flex: 1,
                }}
              >
                {section.title.replace(/^\d+\.\s*/, '')}
              </Text>
            </View>

            {/* Paragraphs */}
            {section.paragraphs
              ? section.paragraphs.map((p, idx) => (
                  <Text
                    key={idx}
                    style={{
                      ...type.body,
                      fontSize: type.field.fontSize,
                      lineHeight: type.field.lineHeight,
                      color: colors.text,
                      marginBottom: idx < section.paragraphs.length - 1 ? 8 : 0,
                    }}
                  >
                    {p}
                  </Text>
                ))
              : null}

            {/* Bullets */}
            {section.bullets ? (
              <View style={{ gap: 5, marginTop: 4 }}>
                {section.bullets.map((b, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: type.field.fontSize, lineHeight: type.field.lineHeight, color: colors.blue, marginRight: 7 }}>
                      •
                    </Text>
                    <Text
                      style={{
                        ...type.body,
                        fontSize: type.field.fontSize,
                        lineHeight: type.field.lineHeight,
                        color: colors.text,
                        flex: 1,
                      }}
                    >
                      {b}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {/* Contact Assistance Footer Card */}
        <View
          style={{
            backgroundColor: colors.selectedSurface,
            borderRadius: settingsLayout.cardRadius,
            borderWidth: 1,
            borderColor: colors.border,
            padding: space.lg,
            marginTop: 4,
            marginBottom: space.lg,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: settingsLayout.cardRadius,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            }}
          >
            <Feather name="help-circle" size={16} color={colors.blue} />
          </View>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: type.field.fontSize, color: colors.navy }}>
            Questions About This Policy?
          </Text>
          <Text
            style={{
              ...type.body,
              fontSize: type.meta.fontSize,
              lineHeight: type.meta.lineHeight,
              color: colors.muted,
              textAlign: 'center',
              marginTop: 2,
              marginBottom: 8,
            }}
          >
            For inquiries regarding student organization data handling, contact the Office of Student Affairs.
          </Text>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: type.meta.fontSize, color: colors.blue, marginTop: 2, marginBottom: 6 }}>
            {CONTACT_EMAIL}
          </Text>
          <TouchableOpacity
            onPress={handleEmailSupport}
            accessibilityRole="button"
            accessibilityLabel="Send email inquiry regarding policy"
            style={{
              minHeight: sizes.touch,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderRadius: radii.pill,
              backgroundColor: colors.blue,
            }}
          >
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: type.meta.fontSize, color: colors.onBrand }}>
              Email Project Admin
            </Text>
          </TouchableOpacity>
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
