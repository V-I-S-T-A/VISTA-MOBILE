import { useScreenRefresh } from '../../hooks/useScreenRefresh';
import { ScrollView, View, Linking, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Text } from '../../components/common/FontText';
import SettingsHeader from '../../components/settings/SettingsHeader';
import { colors, radii, type } from '../../theme/tokens';
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
    <View style={{ flex: 1, backgroundColor: colors.profileBlue, paddingTop: insets.top }}>
      {/* Header */}
      <SettingsHeader
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
        {/* Hero Meta Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.listCard,
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
          {/* Eyebrow & Status Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text
              style={{
                ...type.meta,
                fontFamily: 'DMSans_600SemiBold',
                fontSize: type.meta.fontSize,
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
                backgroundColor: doc.isDraft ? '#FFF4D5' : '#E8EFF8',
              }}
            >
              <Text
                style={{
                  ...type.notificationBadge,
                  fontFamily: 'DMSans_700Bold',
                  fontSize: type.meta.fontSize,
                  color: doc.isDraft ? '#875100' : colors.blue,
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
              borderRadius: radii.listCard,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              marginBottom: 10,
              shadowColor: '#183A60',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 5,
              elevation: 1,
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
                      color: '#334155',
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
                        color: '#334155',
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
            borderRadius: radii.listCard,
            borderWidth: 1,
            borderColor: '#CBD5E1',
            padding: 12,
            marginTop: 4,
            marginBottom: 14,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radii.listCard,
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
              paddingVertical: 5,
              paddingHorizontal: 12,
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
              color: colors.onBrand,
              textAlign: 'center',
            }}
          >
            VISTA Mobile v{APP_VERSION}
          </Text>
          <Text
            style={{
              ...type.meta,
              fontSize: type.meta.fontSize,
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
