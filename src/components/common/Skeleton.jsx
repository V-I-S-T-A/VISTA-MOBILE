import { View, useWindowDimensions } from 'react-native';
import { surfaces } from '../../theme/layout';
import { colors, compact, radii, type, notificationLayout, sizes, form, space, reviewControls } from '../../theme/tokens';

// Base placeholder component using consistent design tokens
export function Skeleton({ width = '100%', height = 14, radius = 8, style, light = false }) {
  const bg = light ? 'rgba(255, 255, 255, 0.22)' : colors.skeleton;
  return (
    <View
      accessible={false}
      style={[{ width, height, borderRadius: radius, backgroundColor: bg }, style]}
    />
  );
}

const Card = ({ children, style }) => (
  <View style={[surfaces.card, { padding: 16, marginBottom: 16 }, style]}>
    {children}
  </View>
);

const Lines = ({ light = false }) => (
  <>
    <Skeleton width="68%" light={light} style={{ marginBottom: 10 }} />
    <Skeleton height={11} width="90%" light={light} style={{ marginBottom: 8 }} />
    <Skeleton height={11} width="55%" light={light} />
  </>
);

// 1. Submission List Skeleton — Matches SubmissionListCard.jsx
export function SubmissionListSkeleton({ count = 3 }) {
  const { fontScale } = useWindowDimensions();
  return (
    <View accessibilityLabel="Loading submissions" accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: compact.paddingHorizontal || 11,
            paddingVertical: compact.paddingVertical || 7.5,
            marginBottom: compact.gutter || 5,
            borderRadius: radii.listCard || 14,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Avatar */}
          <Skeleton width={compact.avatar || 30} height={compact.avatar || 30} radius={(compact.avatar || 30) / 2} />
          {/* Content Column */}
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Skeleton width="75%" height={type.listTitle.lineHeight * fontScale} radius={4} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Skeleton width="48%" height={type.listMeta.lineHeight * fontScale} radius={3} />
              <Skeleton width={56} height={(type.badge.lineHeight + 4) * fontScale} radius={6} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Skeleton width="34%" height={type.listMeta.lineHeight * fontScale} radius={3} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// 2. Dashboard Summary Cards Skeleton — Matches SubmissionDashboardCards.jsx
export function DashboardCardsSkeleton() {
  return (
    <View accessibilityLabel="Loading dashboard totals" accessibilityRole="progressbar">
      {/* Primary Card */}
      <View
        style={{
          borderRadius: 18,
          padding: 12,
          backgroundColor: '#023C69',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 12,
          minHeight: 88,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
          <Skeleton width="50%" height={14} radius={4} light />
          <Skeleton width={70} height={36} radius={6} light />
        </View>
        <Skeleton width={38} height={38} radius={10} light />
      </View>

      {/* Secondary Cards Row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              borderRadius: 18,
              padding: 12,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              minHeight: 78,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Skeleton width="65%" height={12} radius={3} />
              <Skeleton width={45} height={26} radius={6} />
            </View>
            <Skeleton width={28} height={28} radius={8} />
          </View>
        ))}
      </View>
    </View>
  );
}

// 3. Notifications Skeleton — Matches StudentNotificationListItem.jsx
export function NotificationsSkeleton({ count = 4 }) {
  return (
    <View accessibilityLabel="Loading notifications" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            paddingHorizontal: notificationLayout.paddingHorizontal || 11,
            paddingVertical: notificationLayout.paddingVertical || 7.5,
            marginBottom: notificationLayout.gap || 5,
            borderRadius: notificationLayout.radius || 14,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          {/* Avatar icon */}
          <Skeleton
            width={notificationLayout.avatar || 30}
            height={notificationLayout.avatar || 30}
            radius={(notificationLayout.avatar || 30) / 2}
          />
          {/* Content */}
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Skeleton width="65%" height={12} radius={4} />
              <Skeleton width={6} height={6} radius={3} />
            </View>
            <Skeleton width="88%" height={11} radius={3} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Skeleton width={52} height={14} radius={4} />
              <Skeleton width={42} height={10} radius={3} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// 4. Track Details Skeleton — Matches SubmissionTicket.jsx + Conversation
export function TrackDetailsSkeleton({ staff = false }) {
  return (
    <View accessibilityLabel="Loading submission details" accessibilityRole="progressbar" style={{ gap: 12 }}>
      {/* Ticket Banner (Cosmic Purple look) */}
      <View
        style={{
          borderRadius: 20,
          padding: 16,
          backgroundColor: '#1C1033',
          minHeight: 140,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="35%" height={18} radius={6} light />
          <Skeleton width={80} height={22} radius={11} light />
        </View>
        <Skeleton width="80%" height={22} radius={6} light />
        <Skeleton width="50%" height={14} radius={4} light />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Skeleton width="40%" height={12} radius={4} light />
          <Skeleton width="30%" height={12} radius={4} light />
        </View>
      </View>

      {/* Submitter & Documents Info Card */}
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={40} height={40} radius={20} />
          <View style={{ flex: 1, gap: 4 }}>
            <Skeleton width="45%" height={14} radius={4} />
            <Skeleton width="60%" height={12} radius={3} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Skeleton width="45%" height={28} radius={8} />
          <Skeleton width="35%" height={28} radius={8} />
        </View>
      </View>

      {/* Staff Action Card if staff */}
      {staff ? (
        <View
          style={{
            borderRadius: 16,
            padding: 14,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 10,
          }}
        >
          <Skeleton width="40%" height={14} radius={4} />
          <Skeleton height={42} radius={12} />
        </View>
      ) : null}

      {/* Official Remarks / Conversation Card */}
      <View
        style={{
          borderRadius: 16,
          padding: 14,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: 10,
        }}
      >
        <Skeleton width="50%" height={15} radius={4} />
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Skeleton width={32} height={32} radius={16} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="40%" height={12} radius={3} />
            <Skeleton height={50} radius={12} />
          </View>
        </View>
      </View>

      {/* Reply Composer Skeleton Bar */}
      <View
        style={{
          borderRadius: 24,
          height: 48,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          justifyContent: 'space-between',
        }}
      >
        <Skeleton width="60%" height={16} radius={4} />
        <Skeleton width={32} height={32} radius={16} />
      </View>
    </View>
  );
}

// Alias DetailsSkeleton to TrackDetailsSkeleton for backwards compatibility
export const DetailsSkeleton = TrackDetailsSkeleton;

// 5. Profile Skeleton — Matches EditProfileScreen.jsx with increased white header height
export function ProfileSkeleton() {
  return (
    <View
      style={{ flex: 1, backgroundColor: '#F3F3F3' }}
      accessibilityLabel="Loading profile"
      accessibilityRole="progressbar"
    >
      {/* Header icon placeholders matching current Back and Settings positions */}
      <View
        style={{
          paddingTop: 8,
          paddingBottom: 20,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton width={24} height={24} radius={12} />
        <Skeleton width={24} height={24} radius={12} />
      </View>

      {/* Blue Panel positioned lower to match EditProfileScreen marginTop: 44 */}
      <View
        style={{
          flex: 1,
          backgroundColor: '#245EA9',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          marginTop: 44,
          paddingHorizontal: 16,
          paddingTop: 68,
        }}
      >
      {/* Floating Centered Avatar */}
      <View
        style={{
          position: 'absolute',
          top: -34,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Skeleton
          width={sizes.avatarProfile || 68}
          height={sizes.avatarProfile || 68}
          radius={(sizes.avatarProfile || 68) / 2}
          style={{ borderWidth: 3, borderColor: '#FFFFFF' }}
        />
      </View>

      {/* Title */}
      <Skeleton width={120} height={22} radius={6} light style={{ marginBottom: 16 }} />

      {/* Form Fields */}
      <View style={{ gap: 12, marginBottom: 16 }}>
        <Skeleton height={reviewControls.fieldHeight || 42} radius={22} style={{ backgroundColor: '#FFFFFF' }} />
        <Skeleton height={reviewControls.fieldHeight || 42} radius={22} style={{ backgroundColor: '#FFFFFF' }} />
        <Skeleton height={reviewControls.fieldHeight || 42} radius={22} style={{ backgroundColor: '#FFFFFF' }} />
      </View>

      {/* Account Info / Role Box */}
      <View
        style={{
          borderRadius: 20,
          height: 68,
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          padding: 12,
          gap: 6,
          marginBottom: 16,
        }}
      >
        <Skeleton width="35%" height={12} radius={3} light />
        <Skeleton width="60%" height={14} radius={4} light />
      </View>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <Skeleton width="48%" height={42} radius={22} style={{ backgroundColor: '#FFFFFF' }} />
        <Skeleton width="48%" height={42} radius={22} style={{ backgroundColor: '#FFFFFF' }} />
      </View>

      {/* Version */}
      <Skeleton width={100} height={12} radius={4} light style={{ alignSelf: 'center' }} />
      </View>
    </View>
  );
}

// 6. Settings Skeleton — Matches SettingsScreen.jsx
export function SettingsSkeleton() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#245EA9',
        paddingHorizontal: 16,
        paddingTop: 12,
      }}
      accessibilityLabel="Loading settings"
      accessibilityRole="progressbar"
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Skeleton width={24} height={24} radius={12} light />
        <Skeleton width={90} height={20} radius={6} light />
        <Skeleton width={24} height={24} radius={6} light />
      </View>

      {/* Section 1 */}
      <Skeleton width={80} height={11} radius={3} light style={{ marginBottom: 6, marginLeft: 4 }} />
      <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={20} height={20} radius={4} />
          <View style={{ flex: 1, gap: 4 }}>
            <Skeleton width="50%" height={14} radius={4} />
            <Skeleton width="70%" height={11} radius={3} />
          </View>
          <Skeleton width={14} height={14} radius={4} />
        </View>
      </View>

      {/* Section 2 */}
      <Skeleton width={95} height={11} radius={3} light style={{ marginBottom: 6, marginLeft: 4 }} />
      <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 16, gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={20} height={20} radius={4} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="45%" height={14} radius={4} />
              <Skeleton width="65%" height={11} radius={3} />
            </View>
            <Skeleton width={14} height={14} radius={4} />
          </View>
        ))}
      </View>

      {/* Section 3 */}
      <Skeleton width={85} height={11} radius={3} light style={{ marginBottom: 6, marginLeft: 4 }} />
      <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Skeleton width={20} height={20} radius={4} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="50%" height={14} radius={4} />
              <Skeleton width="60%" height={11} radius={3} />
            </View>
            <Skeleton width={14} height={14} radius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

// 7. Dropdown & Selection Skeleton — Matches SelectField & Filter Sheets
export function DropdownSkeleton({ count = 3 }) {
  return (
    <View accessibilityLabel="Loading options" accessibilityRole="progressbar" style={{ paddingHorizontal: 12, paddingVertical: 4 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            borderBottomWidth: i === count - 1 ? 0 : 1,
            borderBottomColor: '#E2E8F0',
          }}
        >
          <Skeleton width={18} height={18} radius={9} />
          <Skeleton width={`${55 + (i % 3) * 12}%`} height={14} radius={4} />
        </View>
      ))}
    </View>
  );
}

// 8. Form, Timeline, Drive Skeletons (Preserved existing utilities)
export function FormSkeleton({ compact = false }) {
  if (compact) {
    return (
      <Card style={{ padding: 8 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Skeleton width="40%" height={type.label.lineHeight} style={{ marginBottom: form.labelGap }} />
            <Skeleton height={sizes.input} radius={radii.field} />
          </View>
        ))}
        <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
        <Skeleton height={sizes.touch} radius={radii.pill} />
      </Card>
    );
  }
  return (
    <Card style={{ padding: 20 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={{ marginBottom: 18 }}>
          <Skeleton width="40%" height={11} style={{ marginBottom: 10 }} />
          <Skeleton height={46} radius={16} />
        </View>
      ))}
      <Skeleton height={110} radius={16} style={{ marginBottom: 18 }} />
      <Skeleton height={44} radius={24} />
    </Card>
  );
}

export function TimelineSkeleton() {
  return (
    <View accessibilityLabel="Loading status history" accessibilityRole="progressbar">
      {[0, 1].map((i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 24 }}>
          <View style={{ width: 32, alignItems: 'center' }}>
            <Skeleton width={14} height={14} radius={7} />
            <Skeleton width={2} height={132} style={{ marginTop: 6 }} />
          </View>
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Lines />
            <View style={{ flexDirection: 'row', marginTop: 18, alignItems: 'center' }}>
              <Skeleton width={32} height={32} radius={16} />
              <Skeleton width="55%" style={{ marginLeft: 10 }} />
            </View>
            <Skeleton height={64} radius={16} style={{ marginTop: 14 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function DriveSkeleton() {
  return (
    <Card style={{ padding: space.md, marginBottom: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm }}>
        <Skeleton width={sizes.avatar} height={sizes.avatar} radius={radii.field} />
        <Skeleton width="55%" height={type.cardTitle.lineHeight} />
      </View>
      <Skeleton height={sizes.touch} radius={radii.field} style={{ marginBottom: space.sm }} />
      <Skeleton height={64} radius={radii.field} />
      <Skeleton width="65%" height={type.meta.lineHeight} style={{ marginTop: space.sm }} />
    </Card>
  );
}
