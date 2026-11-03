import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, compact, radii, sizes, type, nav } from './tokens';
import { getStableRestingBottom } from '../components/common/BottomNavFrame';

export function useBottomNavClearance() {
  const insets = useSafeAreaInsets();
  const dimensions = typeof useWindowDimensions === 'function' ? useWindowDimensions() : null;
  const restingBottom = getStableRestingBottom(insets, dimensions);
  return compact.navHeight + Math.max(restingBottom, compact.iconGap) + compact.footerGap;
}

// One spacing system for staff screens; keep readable content centered on tablets.
export const layout = {
  background: colors.background,
  gutter: 20,
  maxContentWidth: sizes.contentWidth,
  sectionGap: 16,
  cardRadius: radii.card,
  controlHeight: sizes.touch,
  scrollBottom: sizes.scrollBottom,
};

export function useStaffLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gutter = width < 360 ? 16 : layout.gutter;
  const horizontal = Math.max(gutter, (width - layout.maxContentWidth) / 2);
  return {
    top: { paddingTop: insets.top },
    horizontal: { paddingLeft: Math.max(horizontal, insets.left), paddingRight: Math.max(horizontal, insets.right) },
    body: { paddingTop: insets.top, paddingLeft: Math.max(horizontal, insets.left), paddingRight: Math.max(horizontal, insets.right) },
  };
}

// Soft, continuous surfaces and a compact DM Sans hierarchy shared across staff UI.
export const surfaces = {
  card: {
    backgroundColor: colors.surface, borderRadius: radii.card, borderCurve: "continuous",
    borderWidth: 1, borderColor: colors.border,
    shadowColor: "#183A60", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045, shadowRadius: 12, elevation: 1,
  },
  field: { borderRadius: radii.field, backgroundColor: colors.field, borderColor: colors.border },
};
// Shared shell and hit areas; route-specific bars retain their own actions.
export const navigationStyles = {
  shell: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: sizes.contentWidth, alignSelf: 'center', padding: nav.padding, borderRadius: nav.radius, borderCurve: 'continuous', backgroundColor: colors.blue, elevation: 2 },
  item: { flex: 1, minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  selected: { backgroundColor: nav.selectedSurface },
};
export const typography = {
  title: { ...type.title, fontWeight: 'normal' },
  body: { ...type.body, color: colors.muted },
  section: { ...type.heading, fontWeight: 'normal', letterSpacing: -0.25 },
  number: { fontFamily: "DMSans_700Bold", fontWeight: "normal", fontSize: 28, lineHeight: 32, letterSpacing: -0.7, fontVariant: ["tabular-nums"] },
};

// Opt-in ticket-balanced panels and list states; do not apply to compact conversations.
export const panelStyles = { card: { padding: 12, marginBottom: 12, borderRadius: radii.card }, state: { paddingVertical: 24, alignItems: 'center' }, inlineState: { paddingVertical: 12 }, touch: { minHeight: sizes.touch, minWidth: sizes.touch, justifyContent: 'center' } };
