// Shared presentation values. Status identifiers and API behavior live elsewhere.
export const colors = {
  background: '#F3F3F3', surface: '#FFFFFF', text: '#1E3A68', muted: '#64748B',
  blue: '#1a59a5', navy: '#142B52', yellow: '#FFC342', border: '#E1E8F0',
  profileBlue: '#245EA9',
  field: '#F7F9FC', danger: '#B91C1C', backdrop: '#14284B80',
  ticket: '#393A70', ticketText: '#E8E7FA', ticketMuted: '#D6D5EE',
  onYellow: '#513600', green: '#52B764', onGreen: '#103F20',
  listSurface: '#FAFBFF', prioritySurface: '#FFF4D5', priorityText: '#765700',
  selectedSurface: '#E8EFF8', disabledText: '#64748B', skeleton: '#DFE6EE',
  pendingText: '#875100',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
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
  priority: { accent: '#C5A45C' },
};
export const radii = { field: 12, card: 18, sheet: 24, pill: 999, listCard: 14, chip: 9 };
export const compact = { inset: 6, gutter: 5, leadingInset: 11, paddingHorizontal: 11, paddingVertical: 7.5, rowGap: 2.5, iconGap: 4, avatar: 30, accent: 3, chipInset: 8, chipHeight: 28, inputHeight: 36, touch: 48, footerGap: 16, navHeight: 48 };
export const sizes = { touch: 48, input: 48, avatar: 34, avatarHeader: 32, avatarProfile: 84, icon: 18, navIcon: 18, modalWidth: 340, contentWidth: 600, scrollBottom: 110 };
export const form = { paddingHorizontal: 12, paddingVertical: 8, labelGap: 4, fieldGap: 8, sectionGap: 12 };
export const notificationLayout = { avatar: 30, padding: 8, paddingHorizontal: 11, paddingVertical: 7.5, previewLines: 1, titleLines: 1, unread: 6, radius: 14, gap: 5 };
export const sheetLayout = { maxHeight: '80%', handleWidth: 36, handleHeight: 4, padding: 16, gap: 8, duration: 220 };
export const nav = { padding: 0, radius: 24, selected: colors.yellow, selectedSurface: '#FFFFFF08', inactive: '#FFFFFF' };
export const type = {
  regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_700Bold',
  title: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, lineHeight: 26, letterSpacing: -0.5 },
  heading: { fontFamily: 'DMSans_700Bold', fontSize: 16, lineHeight: 22 },
  sectionTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  cardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 18 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 20 },
  meta: { fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 16 },
  label: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16 },
  field: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  listTitle: { fontFamily: 'DMSans_500Medium', fontSize: 12.5, lineHeight: 16 },
  notificationTitle: { fontFamily: 'DMSans_500Medium', fontSize: 12.5, lineHeight: 16 },
  notificationPreview: { fontFamily: 'DMSans_400Regular', fontSize: 11.5, lineHeight: 15 },
  notificationHeading: { fontFamily: 'DMSans_600SemiBold', fontSize: 20, lineHeight: 26 },
  notificationBadge: { fontFamily: 'DMSans_500Medium', fontSize: 9.5, lineHeight: 13 },
  notificationMeta: { fontFamily: 'DMSans_400Regular', fontSize: 10, lineHeight: 14 },
  listOrg: { fontFamily: 'DMSans_400Regular', fontSize: 10.5, lineHeight: 14 },
  listDate: { fontFamily: 'DMSans_400Regular', fontSize: 10, lineHeight: 14 },
  listMeta: { fontFamily: 'DMSans_400Regular', fontSize: 10.5, lineHeight: 14.5 },
  miniBadge: { fontFamily: 'DMSans_500Medium', fontSize: 9.5, lineHeight: 13 },
  badge: { fontFamily: 'DMSans_500Medium', fontSize: 10, lineHeight: 14 },
  compactLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 16 },
};

// Opt-in geometry for dense review/archive tools; default forms stay unchanged.
export const reviewControls = { fieldHeight: 42, attachmentHeight: 44, actionHeight: 42, optionHeight: 40, segmentHeight: 36, touch: 48, radius: 10, padding: 10, gap: 8, icon: 16, value: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 }, label: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 16 }, action: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 18 }, heading: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, lineHeight: 18 }, sheetTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, lineHeight: 20 } };
