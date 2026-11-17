import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, compact, radii, sizes, type, nav, space, shadows } from './tokens';
import { getStableRestingBottom } from '../components/common/BottomNavFrame';

export function useBottomNavClearance() {
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const restingBottom = getStableRestingBottom(insets, dimensions);
  return compact.navHeight + Math.max(restingBottom, nav.bottomGap) + compact.footerGap;
}

// One spacing system for staff screens; keep readable content centered on tablets.
export const layout = {
  background: colors.background,
  gutter: space.xl,
  maxContentWidth: sizes.contentWidth,
  sectionGap: space.lg,
  cardRadius: radii.card,
  controlHeight: sizes.touch,
  scrollBottom: sizes.scrollBottom,
};

// First-render size estimates and the screen itself must use identical gutters.
export function getContentHorizontalInsets(width, insets) {
  const gutter = width < 360 ? space.lg : layout.gutter;
  const horizontal = Math.max(gutter, (width - layout.maxContentWidth) / 2);
  return { paddingLeft: Math.max(horizontal, insets.left), paddingRight: Math.max(horizontal, insets.right) };
}

export function useStaffLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontal = getContentHorizontalInsets(width, insets);
  return {
    top: { paddingTop: insets.top },
    horizontal,
    body: { paddingTop: insets.top, ...horizontal },
  };
}

// Soft, continuous surfaces and a compact DM Sans hierarchy shared across staff UI.
export const surfaces = {
  card: {
    backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous",
    borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  field: { borderRadius: radii.field, backgroundColor: colors.field, borderColor: colors.border },
};
// Shared shell and hit areas; route-specific bars retain their own actions.
export const navigationStyles = {
  shell: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: sizes.contentWidth, alignSelf: 'center', paddingVertical: nav.padding, paddingHorizontal: space.xs, minHeight: compact.navHeight, borderRadius: nav.radius, borderCurve: 'continuous', backgroundColor: nav.background, ...shadows.navigation },
  item: { flex: 1, minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  indicator: { minWidth: nav.indicator, height: nav.indicator, borderRadius: radii.pill, flexDirection: 'row', gap: space.xs, paddingHorizontal: space.sm, alignItems: 'center', justifyContent: 'center' },
  action: { minWidth: nav.actionSize, width: nav.actionSize, height: nav.actionSize, marginVertical: -(nav.actionSize - sizes.touch) / 2, borderWidth: nav.actionRing, borderColor: colors.onBrand, backgroundColor: nav.background, ...shadows.indicator },
};
export const typography = {
  title: { ...type.title, fontWeight: 'normal' },
  body: { ...type.body, color: colors.muted },
  section: { ...type.heading, fontWeight: 'normal', letterSpacing: -0.25 },
  number: { ...type.number, fontWeight: 'normal' },
};

// Opt-in ticket-balanced panels and list states; do not apply to compact conversations.
export const panelStyles = { card: { padding: 12, marginBottom: 12, borderRadius: radii.card }, state: { paddingVertical: 24, alignItems: 'center' }, inlineState: { paddingVertical: 12 }, touch: { minHeight: sizes.touch, minWidth: sizes.touch, justifyContent: 'center' } };
