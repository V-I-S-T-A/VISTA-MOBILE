import { ScrollView, View, useWindowDimensions } from 'react-native';
import useDashboardGrid from '../../hooks/useDashboardGrid';
import TicketBanner from '../submissions/TicketBanner';
import { surfaces, panelStyles, useStaffLayout } from '../../theme/layout';
import { colors, radii, type, notificationLayout, sizes, form, space, reviewControls, dashboardLayout, dashboardTones, settingsLayout, profileLayout, stateLayout } from '../../theme/tokens';

// Static placeholders need no timers or animation loops while data is loading.
const loadingProps = label => ({ accessible: true, accessibilityLabel: label, accessibilityRole: 'progressbar', accessibilityState: { busy: true } });
export function Skeleton({ width = '100%', height = type.meta.lineHeight, radius = space.xs, style, light = false }) {
  return <View accessible={false} style={[{ width, height, borderRadius: radius, backgroundColor: light ? '#FFFFFF38' : colors.skeleton }, style]} />;
}

export function SubmissionListSkeleton({ count = 3 }) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale > 1.2;
  const row = { flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'stretch' : 'center', justifyContent: 'space-between', gap: stacked ? 2 : space.xs };
  return <View {...loadingProps('Loading submissions')}>
    {Array.from({ length: count }, (_, index) => <View key={index} style={[surfaces.card, {
      flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      paddingHorizontal: notificationLayout.paddingHorizontal, paddingVertical: notificationLayout.paddingVertical,
      marginBottom: notificationLayout.gap, borderRadius: notificationLayout.radius, backgroundColor: colors.listSurface, overflow: 'hidden',
    }]}>
      <Skeleton width={notificationLayout.avatar} height={notificationLayout.avatar} radius={radii.pill} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="75%" height={type.notificationTitle.lineHeight * fontScale} />
        <View style={[row, { marginTop: 1, marginBottom: 3 }]}>
          <View style={{ flex: 1, minWidth: 0 }}><Skeleton width="68%" height={type.listOrg.lineHeight * fontScale} /></View>
          <Skeleton width="35%" height={type.miniBadge.lineHeight * fontScale} />
        </View>
        <View style={row}><Skeleton width="34%" height={type.listDate.lineHeight * fontScale} /></View>
      </View>
    </View>)}
  </View>;
}

export function DashboardCardsSkeleton() {
  return DashboardCardsSkeletonContent(useDashboardGrid());
}

// The dashboard owns measurement across loading/content; standalone consumers
// use the wrapper above. This renderer does not mount a second grid hook.
export function DashboardCardsSkeletonContent({ columns, fontScale, onLayout }) {
  const keys = ['total', 'pending', 'approved', 'rejected'];
  const artScale = dashboardLayout.artScale / (columns === 2 ? Math.max(1, fontScale) : 1);
  const artSize = dashboardLayout.artSize * artScale;
  const rows = Array.from({ length: Math.ceil(keys.length / columns) }, (_, index) => keys.slice(index * columns, (index + 1) * columns));
  return <View {...loadingProps('Loading dashboard totals')} onLayout={onLayout} style={{ gap: space.md, marginBottom: space.lg }}>
    {rows.map((row, index) => <View key={index} style={{ flexDirection: 'row', gap: space.md, alignItems: 'stretch' }}>
      {row.map(key => <View key={key} style={{ flex: 1, minWidth: 0, aspectRatio: 1, padding: space.md, overflow: 'hidden', borderRadius: radii.card, borderCurve: 'continuous', backgroundColor: dashboardTones[key].background }}>
        <Skeleton light width="80%" height={type.sectionTitle.lineHeight * 2 * fontScale} />
        <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.xs, marginTop: space.xs }}>
          <Skeleton light width="35%" height={type.number.lineHeight * fontScale} />
          <Skeleton light width={artSize} height={artSize} radius={radii.field} style={{ alignSelf: 'flex-end', flexShrink: 0 }} />
        </View>
      </View>)}
    </View>)}
  </View>;
}

export function NotificationsSkeleton({ count = 4 }) {
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading notifications')}>
    {Array.from({ length: count }, (_, index) => <View key={index} style={{
      minHeight: sizes.touch, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
      paddingHorizontal: notificationLayout.paddingHorizontal, paddingVertical: notificationLayout.paddingVertical,
      marginBottom: notificationLayout.gap, borderRadius: notificationLayout.radius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    }}>
      <Skeleton width={notificationLayout.avatar} height={notificationLayout.avatar} radius={radii.pill} />
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <Skeleton width="65%" height={type.notificationTitle.lineHeight * fontScale} />
          <Skeleton width={notificationLayout.unread} height={notificationLayout.unread} radius={radii.pill} />
        </View>
        <Skeleton width="88%" height={type.notificationPreview.lineHeight * fontScale} style={{ marginTop: 1, marginBottom: 3 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Skeleton width="34%" height={type.notificationBadge.lineHeight * fontScale} />
          <Skeleton width="24%" height={type.notificationMeta.lineHeight * fontScale} />
        </View>
      </View>
    </View>)}
  </View>;
}

// The bundled banner is available offline; reuse its actual responsive geometry.
export function TrackDetailsSkeleton({ staff = false }) {
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading submission details')}>
    <View style={{ backgroundColor: colors.ticket, borderRadius: radii.card, marginBottom: space.lg }}>
      <View style={{ padding: space.md, gap: 6 }}>
        <TicketBanner />
        <Skeleton light width="60%" height={type.meta.lineHeight * fontScale} style={{ marginTop: 6 }} />
        <Skeleton light width="85%" height={type.navigationTitle.lineHeight * fontScale} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6 }}>
          {[0, 1].map(index => <View key={index} style={{ flexGrow: 1, flexBasis: 115 }}><Skeleton light width="30%" height={type.meta.lineHeight * fontScale} /><Skeleton light width="65%" height={type.field.lineHeight * fontScale} /></View>)}
        </View>
        <View style={{ marginTop: space.xs }}><Skeleton light width="35%" height={type.meta.lineHeight * fontScale} /><Skeleton light width="75%" height={type.field.lineHeight * fontScale} /></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.ticketMuted, paddingTop: space.md, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', flexGrow: 1, flexBasis: 180, minWidth: 0, gap: 10, alignItems: 'center' }}>
            <Skeleton light width={sizes.avatar} height={sizes.avatar} radius={radii.pill} />
            <View style={{ flex: 1, minWidth: 0 }}><Skeleton light width="65%" height={type.field.lineHeight * fontScale} /><Skeleton light width="80%" height={type.meta.lineHeight * fontScale} /><Skeleton light width="55%" height={type.meta.lineHeight * fontScale} style={{ marginTop: 3 }} /></View>
          </View>
          <Skeleton light width={80} height={type.badge.lineHeight * fontScale + space.xs} radius={radii.pill} />
        </View>
      </View>
      <View style={{ borderTopWidth: 1, borderColor: colors.ticketMuted, borderStyle: 'dashed', marginTop: space.xs, height: 1 }}>
        {[-1, 1].map(side => <View key={side} style={{ position: 'absolute', top: -10, ...(side < 0 ? { left: -10 } : { right: -10 }), width: space.xl, height: space.xl, borderRadius: radii.chip, backgroundColor: colors.background }} />)}
      </View>
      <View style={{ padding: space.md, gap: space.sm }}><View style={{ minHeight: staff ? sizes.touch : undefined, flexDirection: 'row', alignItems: 'center', gap: 10, padding: staff ? space.md : 3, borderRadius: radii.field }}>
        <Skeleton light width={sizes.icon} height={sizes.icon} /><View style={{ flex: 1 }}><Skeleton light width="85%" height={(staff ? type.field.lineHeight : type.meta.lineHeight * 2) * fontScale} /></View>
      </View></View>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, marginBottom: 6 }}><Skeleton width="40%" height={type.cardTitle.lineHeight * fontScale} /><Skeleton width="20%" height={type.meta.lineHeight * fontScale} /></View>
    <ConversationSkeleton />
  </View>;
}
export const DetailsSkeleton = TrackDetailsSkeleton;

export function ConversationSkeleton({ count = 2 }) {
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading conversation')}>
    {Array.from({ length: count }, (_, index) => <View key={index} style={[surfaces.card, { paddingVertical: space.sm, paddingHorizontal: space.md, marginBottom: space.sm }]}>
      <Skeleton height={type.meta.lineHeight * fontScale + space.sm} radius={radii.field} />
      <View style={{ paddingTop: space.xs }}>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', marginBottom: space.xs }}><Skeleton width={28} height={28} radius={radii.pill} /><View style={{ flex: 1 }}><Skeleton width="65%" height={type.notificationTitle.lineHeight * fontScale} /><Skeleton width="75%" height={type.meta.lineHeight * fontScale} style={{ marginTop: 2 }} /></View></View>
        <Skeleton width="85%" height={type.conversation.lineHeight * fontScale} />
        <View style={{ minHeight: sizes.touch, flexDirection: 'row', gap: space.sm, alignItems: 'center', paddingHorizontal: space.xs }}><Skeleton width="20%" height={type.meta.lineHeight * fontScale} /><Skeleton width="35%" height={type.meta.lineHeight * fontScale} /></View>
      </View>
    </View>)}
  </View>;
}

export function RepliesSkeleton({ count = 2, canReply = true }) {
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading replies')}>
    {Array.from({ length: count }, (_, index) => <View key={index} style={{ paddingVertical: 2, paddingRight: 10 }}>
      <Skeleton width="50%" height={type.notificationTitle.lineHeight * fontScale} /><Skeleton width="85%" height={type.conversation.lineHeight * fontScale} />
      {canReply ? <View style={{ minHeight: sizes.touch, justifyContent: 'center' }}><Skeleton width="20%" height={type.meta.lineHeight * fontScale} /></View> : null}
    </View>)}
  </View>;
}

export function ProfileSkeleton({ hasOrganization = false, bottomInset = 0 }) {
  const layout = useStaffLayout();
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading profile')} style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={[layout.horizontal, { paddingTop: profileLayout.headerPaddingTop, paddingBottom: profileLayout.headerPaddingBottom, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
      {[0, 1].map(index => <View key={index} style={{ width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginLeft: index === 0 ? -space.sm : 0, marginRight: index === 1 ? -space.sm : 0 }}><Skeleton width={sizes.icon} height={sizes.icon} radius={radii.pill} /></View>)}
    </View>
    <View style={{ flex: 1, backgroundColor: colors.profileBlue, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card, marginTop: profileLayout.panelTopGap }}>
      <View style={{ position: 'absolute', top: profileLayout.avatarTop, left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ width: sizes.avatarProfile, height: sizes.avatarProfile }}>
          <Skeleton width={sizes.avatarProfile} height={sizes.avatarProfile} radius={radii.pill} style={{ borderWidth: 3, borderColor: colors.surface }} />
          <Skeleton width={space.xxxl} height={space.xxxl} radius={radii.pill} style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} />
        </View>
      </View>
      <View style={[{ flex: 1 }, layout.horizontal]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingTop: profileLayout.contentTop, paddingBottom: Math.max(bottomInset, space.lg) + space.lg, width: '100%', maxWidth: sizes.contentWidth, alignSelf: 'center' }}>
          <View>
            <Skeleton light width="45%" height={type.title.lineHeight * fontScale} style={{ marginBottom: space.lg }} />
            {[0, 1, 2].map(index => <View key={index} style={{ minHeight: sizes.touch, justifyContent: 'center' }}><Skeleton height={Math.max(reviewControls.fieldHeight, reviewControls.value.lineHeight * fontScale + space.sm + 2)} radius={radii.field} style={{ backgroundColor: colors.surface, marginBottom: index === 2 ? space.lg : space.md }} /></View>)}
            {hasOrganization ? <View style={{ borderRadius: radii.card, paddingHorizontal: space.lg, paddingVertical: space.md, marginBottom: space.lg }}>
              <Skeleton light width="35%" height={type.meta.lineHeight * fontScale} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.sm, gap: 10 }}><Skeleton light width={sizes.avatar} height={sizes.avatar} radius={radii.pill} /><Skeleton light width="60%" height={type.field.lineHeight * fontScale} /></View>
            </View> : null}
            <View style={{ flexDirection: 'row', gap: space.md, marginBottom: space.sm }}>{[0, 1].map(index => <Skeleton key={index} light width={null} height={Math.max(profileLayout.actionHeight, type.field.lineHeight * fontScale)} radius={radii.button} style={{ flex: 1 }} />)}</View>
            <View style={{ minHeight: sizes.touch, marginTop: space.xs, alignItems: 'center', justifyContent: 'center' }}><Skeleton light width="45%" height={type.field.lineHeight * fontScale} /></View>
          </View>
          <View style={{ marginTop: 'auto', paddingTop: space.xl }}><Skeleton light height={Math.max(profileLayout.logoutHeight, type.field.lineHeight * fontScale)} radius={radii.button} /></View>
        </ScrollView>
      </View>
    </View>
  </View>;
}

// Retained utility; Settings itself renders its bundled content immediately.
export function SettingsSkeleton() {
  const { fontScale } = useWindowDimensions();
  return <ScrollView {...loadingProps('Loading settings')} style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: space.lg }}>
    <View style={{ flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: settingsLayout.cardRadius, backgroundColor: colors.surface, marginBottom: space.xxl }}><Skeleton width={settingsLayout.profileAvatar} height={settingsLayout.profileAvatar} radius={radii.pill} /><View style={{ flex: 1, gap: space.xs, justifyContent: 'center' }}><Skeleton width="65%" height={type.sectionTitle.lineHeight * fontScale} /><Skeleton width="85%" height={type.meta.lineHeight * fontScale} /></View></View>
    {[1, 1, 4, 4].map((count, index) => <View key={index} style={{ marginBottom: space.xxl }}>
      <Skeleton width="35%" height={type.meta.lineHeight * fontScale} style={{ marginLeft: space.xs, marginBottom: space.sm }} />
      <View style={{ borderRadius: settingsLayout.cardRadius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
        {Array.from({ length: count }, (_, row) => <View key={row} style={{ minHeight: settingsLayout.rowMinHeight, paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md }}><Skeleton width={settingsLayout.iconSize} height={settingsLayout.iconSize} /><View style={{ flex: 1 }}><Skeleton width="65%" height={type.field.lineHeight * fontScale} /><Skeleton width="85%" height={type.meta.lineHeight * fontScale} style={{ marginTop: space.xs }} /></View><Skeleton width={sizes.icon} height={sizes.icon} /></View>)}
      </View>
    </View>)}
  </ScrollView>;
}

// Select sheets are text-only; academic years use radios, Drive uses chevrons.
export function DropdownSkeleton({ count = 3, variant = 'select', compact: dense = false }) {
  const { fontScale } = useWindowDimensions();
  const academicYear = variant === 'academicYear', drive = variant === 'drive';
  const lineHeight = academicYear ? type.body.lineHeight : dense ? reviewControls.value.lineHeight : type.field.lineHeight;
  return <View {...loadingProps('Loading options')} style={{ gap: academicYear ? space.xs : 0 }}>
    {Array.from({ length: count }, (_, index) => <View key={index} style={{ minHeight: sizes.touch, justifyContent: 'center' }}><View style={{ minHeight: dense ? reviewControls.optionHeight : sizes.touch, paddingHorizontal: academicYear ? space.md : dense ? reviewControls.padding : 0, paddingVertical: dense ? space.xs : drive ? space.md : form.paddingVertical, flexDirection: 'row', alignItems: 'center', gap: space.md, borderBottomWidth: academicYear ? 0 : 1, borderBottomColor: colors.border }}>
      {academicYear ? <Skeleton width={sizes.icon} height={sizes.icon} radius={radii.chip} /> : null}
      <View style={{ flex: 1 }}><Skeleton width={(55 + (index % 3) * 12) + '%'} height={lineHeight * fontScale} /></View>
      {drive ? <Skeleton width={reviewControls.icon} height={reviewControls.icon} /> : null}
    </View></View>)}
  </View>;
}

export function FormSkeleton({ compact: dense = false, hasAttachment = false }) {
  const { fontScale } = useWindowDimensions();
  const fieldHeight = Math.max(dense ? reviewControls.fieldHeight : sizes.input, (dense ? reviewControls.value.lineHeight : type.field.lineHeight) * fontScale + (dense ? space.sm : form.paddingVertical * 2) + 2);
  return <View {...loadingProps('Loading document entry')} style={{ backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: 'continuous', padding: space.lg }}>
    {Array.from({ length: 6 }, (_, index) => <View key={index} style={{ marginBottom: form.fieldGap }}><Skeleton width="40%" height={type.label.lineHeight * fontScale} style={{ marginBottom: form.labelGap }} /><View style={{ minHeight: sizes.touch, justifyContent: 'center' }}><Skeleton height={fieldHeight} radius={dense ? reviewControls.radius : radii.field} /></View></View>)}
    <View style={{ minHeight: reviewControls.fieldHeight, marginBottom: form.fieldGap, paddingHorizontal: reviewControls.padding, paddingVertical: space.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, borderWidth: 1, borderColor: colors.border, borderRadius: reviewControls.radius, backgroundColor: colors.field }}><Skeleton width="50%" height={reviewControls.value.lineHeight * fontScale} /><Skeleton width={sizes.touch} height={sizes.avatarHeader} radius={radii.pill} /></View>
    {hasAttachment ? <Skeleton height={reviewControls.attachmentHeight} radius={reviewControls.radius} style={{ marginBottom: form.fieldGap }} /> : <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.lg, paddingHorizontal: space.md }}><Skeleton width={stateLayout.compactArtSize} height={stateLayout.compactArtSize} radius={radii.card} /><Skeleton width="65%" height={type.heading.lineHeight * fontScale} /><Skeleton width="90%" height={type.body.lineHeight * 2 * fontScale} /></View>}
    <View style={{ minHeight: sizes.touch, justifyContent: 'center', marginBottom: form.fieldGap }}><Skeleton height={reviewControls.attachmentHeight} radius={reviewControls.radius} /></View>
    <View style={{ minHeight: sizes.touch, justifyContent: 'center' }}><Skeleton height={Math.max(dense ? reviewControls.actionHeight : sizes.touch, type.button.lineHeight * fontScale + space.sm)} radius={dense ? reviewControls.radius : radii.button} /></View>
  </View>;
}

// Legacy status-history utility retained for existing imports.
export function TimelineSkeleton() {
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading status history')}>
    {[0, 1].map(index => <View key={index} style={{ flexDirection: 'row', marginBottom: index === 0 ? space.xxl : 0 }}>
      <View style={{ width: space.xxxl, alignItems: 'center' }}><Skeleton width={space.xxl} height={space.xxl} radius={radii.pill} /></View>
      <View style={{ flex: 1, paddingLeft: space.sm }}><Skeleton width="55%" height={space.xxl * fontScale} /><Skeleton width="65%" height={type.field.lineHeight * fontScale} style={{ marginTop: 2 }} /><Skeleton width="50%" height={type.field.lineHeight * fontScale} style={{ marginTop: space.sm }} />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', marginTop: space.md }}><Skeleton width={space.xxxl} height={space.xxxl} radius={radii.pill} /><View style={{ flex: 1 }}><Skeleton width="35%" height={type.meta.lineHeight * fontScale} /><Skeleton width="65%" height={type.field.lineHeight * fontScale} /></View></View>
      </View>
    </View>)}
  </View>;
}

export function DriveSkeleton() {
  const { fontScale } = useWindowDimensions();
  return <View {...loadingProps('Loading Google Drive connection')} style={[surfaces.card, panelStyles.card]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm }}><Skeleton width={space.xxxl} height={space.xxxl} radius={radii.field} /><View style={{ flex: 1, gap: space.xs }}><Skeleton width="55%" height={type.sectionTitle.lineHeight * fontScale} /><Skeleton width="80%" height={type.meta.lineHeight * fontScale} /></View></View>
    <View style={{ padding: space.md, marginBottom: space.sm }}><Skeleton width="75%" height={type.meta.lineHeight * fontScale} /></View>
    <Skeleton height={Math.max(sizes.touch, type.meta.lineHeight * fontScale + space.xxl)} radius={radii.field} style={{ marginBottom: space.md }} /><Skeleton height={Math.max(sizes.touch, type.meta.lineHeight * fontScale + space.xxl)} radius={radii.field} />
  </View>;
}
