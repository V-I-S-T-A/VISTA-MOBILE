// Shared presentation values. Status identifiers and API behavior live elsewhere.
export const colors = {
  background: '#F3F3F3', surface: '#FFFFFF', text: '#1E3A68', muted: '#64748B',
  blue: '#1a59a5', navy: '#142B52', yellow: '#FFC342', border: '#E1E8F0',
  profileBlue: '#245EA9',
  field: '#F7F9FC', danger: '#B91C1C', backdrop: '#14284B80',
  ticket: '#393A70', ticketText: '#E8E7FA', ticketMuted: '#D6D5EE',
  onYellow: '#513600', green: '#52B764', onGreen: '#103F20',
  listSurface: '#FAFBFF', prioritySurface: '#F1EAFE', priorityText: '#6D28D9', priorityOnTicket: '#DDD0FF',
  warningSurface: '#FFF4D5', warningText: '#765700',
  selectedSurface: '#E8EFF8', disabledText: '#64748B', skeleton: '#DFE6EE',
  pendingText: '#875100',
  onBrand: '#FFFFFF', placeholder: '#64748B', focus: '#1A59A5',
  disabledSurface: '#EEF2F6', divider: '#EEF2F6',
  onProfile: '#FFFFFF', onProfileMuted: '#E1EAF7',
  success: '#15803D', warning: '#875100',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, section: 24 };
// One semantic palette for badges and muted ticket-inspired list accents.
export const statusTones = {
  pending: { background: '#FFF0C2', foreground: colors.pendingText, accent: '#AA8B59' },
  under_review: { background: '#DBEAFE', foreground: '#1D4ED8', accent: '#77759F' },
  approved: { background: '#DCFCE7', foreground: '#15803D', accent: '#779B82' },
  rejected: { background: '#FEE2E2', foreground: colors.danger, accent: '#B47E85' },
  resubmission_required: { background: '#FFEDD5', foreground: '#C2410C', accent: '#AC886B' },
  default: { background: '#F3F4F6', foreground: '#4B5563', accent: '#87899A' },
};
export const cardTones = {
  ...statusTones,
  priority: { accent: colors.priorityText },
};
// Original VISTA summary colors; status and priority indicators retain their own palettes.
export const dashboardTones = {
  total: { background: colors.blue, foreground: colors.onBrand },
  pending: { background: colors.yellow, foreground: colors.onBrand },
  approved: { background: colors.green, foreground: colors.onBrand },
  rejected: { background: colors.danger, foreground: colors.onBrand },
};
export const dashboardLayout = { singleColumnFontScale: 1.4, artSize: 88, artScale: 0.8, artSpace: 56 };
export const dashboardArt = { paper: '#F7F3E9', paperEdge: '#DAD7CB', line: '#BFC8C3', gold: '#D8AD55', goldLight: '#EDCB83', goldEdge: '#BB9142', ink: '#738A91', seal: '#F2D4CB', clock: colors.blue, clockLight: '#94BCE5', clockInk: colors.navy };
export const radii = { field: 16, button: 24, card: 20, sheet: 28, pill: 999, listCard: 20, chip: 12 };
export const compact = { inset: 8, gutter: 8, leadingInset: 12, paddingHorizontal: 12, paddingVertical: 8, rowGap: 4, iconGap: 4, avatar: 30, accent: 3, chipInset: 8, chipHeight: 32, inputHeight: 40, touch: 48, footerGap: 16, navHeight: 56 };
export const sizes = { touch: 48, input: 48, avatar: 34, avatarHeader: 32, avatarProfile: 84, accountHeader: 56, icon: 18, navIcon: 22, modalWidth: 340, contentWidth: 600, scrollBottom: 110 };
export const loginLayout = { heroMinHeight: 260, heroMaxHeight: 360, heroRatio: 0.45, artWidth: 252, artHeight: 168, logoSize: 32, formWidth: 340, fieldHeight: 52, decorationSize: 16 };
export const form = { paddingHorizontal: 12, paddingVertical: 8, labelGap: 4, fieldGap: 8, sectionGap: 12 };
export const notificationLayout = { avatar: 30, padding: 8, paddingHorizontal: 12, paddingVertical: 8, previewLines: 1, titleLines: 1, unread: 6, radius: radii.listCard, gap: 8 };
export const sheetLayout = { maxHeight: '80%', handleWidth: 36, handleHeight: 4, padding: 16, gap: 8, duration: 220 };
export const nav = { padding: 4, radius: 32, background: colors.blue, selected: colors.yellow, inactive: colors.onBrand, indicator: 48, actionSize: 60, actionIcon: 30, actionRing: 1.5, actionLift: 10, ring: 0, lift: 0, bottomGap: 8, hideGap: 24, scroll: { hideDistance: 8, revealDistance: 8, topEdge: 8 } };
export const type = {
  regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_700Bold',
  title: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, lineHeight: 26, letterSpacing: -0.5 },
  heading: { fontFamily: 'DMSans_700Bold', fontSize: 16, lineHeight: 22 },
  sectionTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  cardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 18 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 21 },
  meta: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 18 },
  field: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  listTitle: { fontFamily: 'DMSans_500Medium', fontSize: 14, lineHeight: 19 },
  notificationTitle: { fontFamily: 'DMSans_500Medium', fontSize: 14, lineHeight: 19 },
  notificationPreview: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 17 },
  notificationHeading: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, lineHeight: 26 },
  notificationBadge: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 16 },
  notificationMeta: { fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 16 },
  listOrg: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 17 },
  listDate: { fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 16 },
  listMeta: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 17 },
  miniBadge: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 16 },
  badge: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 16 },
  compactLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16 },
  button: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  navigationTitle: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
  display: { fontFamily: 'DMSans_700Bold', fontSize: 24, lineHeight: 32 },
  conversation: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 19 },
  number: { fontFamily: 'DMSans_700Bold', fontSize: 28, lineHeight: 34, letterSpacing: -0.7, fontVariant: ['tabular-nums'] },
};

// Keep motion and depth restrained; compatible with the existing RN 0.81 renderer.
export const shadows = { card: { boxShadow: '0 2px 8px rgba(20, 43, 82, 0.04)' }, raised: { boxShadow: '0 4px 16px rgba(20, 43, 82, 0.10)' }, navigation: { boxShadow: '0 6px 24px rgba(20, 43, 82, 0.12)' }, indicator: { boxShadow: '0 3px 8px rgba(26, 89, 165, 0.18)' } };
export const motion = { pressedOpacity: 0.72, disabledOpacity: 0.5, fast: 150, tab: 180, page: 180, pressIn: 90, pressOut: 130, pressedScale: 0.96, modalScale: 0.98, sheet: sheetLayout.duration };
export const composerLayout = { minHeight: 48, maxHeight: 112, padding: 8, gap: 8 };

// Opt-in geometry for dense review/archive tools; default forms stay unchanged.
export const reviewControls = { fieldHeight: 42, attachmentHeight: 44, actionHeight: 42, optionHeight: 40, segmentHeight: 36, touch: 48, radius: 10, padding: 10, gap: 8, icon: 16, value: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 }, label: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 16 }, action: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 18 }, heading: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, lineHeight: 18 }, sheetTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, lineHeight: 20 } };

// Opt-in inset settings groups; existing blue settings subpages retain their styling.
export const settingsLayout = { iconSize: space.xxxl, iconRadius: space.sm, rowMinHeight: compact.touch + space.lg, separatorWidth: 1 };
export const settingsTones = { notification: colors.danger, update: colors.blue, guide: colors.blue, help: colors.profileBlue, support: colors.success, issue: colors.warning, privacy: colors.success, document: colors.blue, community: colors.navy, about: colors.muted };
