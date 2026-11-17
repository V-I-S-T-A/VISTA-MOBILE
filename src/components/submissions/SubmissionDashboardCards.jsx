import { typography } from "../../theme/layout";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import DashboardCardIllustration from './DashboardCardIllustration';
import { Text } from "../common/FontText";
import { DashboardCardsSkeleton } from '../common/Skeleton';
import { dashboardLayout, dashboardTones, radii, type, space, motion } from '../../theme/tokens';

function DashboardCard({ onPress, style, label, count, children }) {
  const Card = onPress ? TouchableOpacity : View;

  return (
    <Card
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      activeOpacity={motion.pressedOpacity}
      accessibilityLabel={`${label}: ${count ?? 'Unavailable'} submissions`}
      accessibilityHint={onPress ? 'Opens submission history with this filter selected' : undefined}
      style={style}
    >
      {children}
    </Card>
  );
}

export default function SubmissionDashboardCards({
  isLoading,
  total,
  pending,
  approved,
  rejected,
  totalLabel = "Total Submissions",
  approvedLabel = "Approved",
  totalOnPress,
  pendingOnPress,
  approvedOnPress,
  rejectedOnPress,
  showTotalLoader = false,
}) {
  const { fontScale } = useWindowDimensions();
  if (isLoading) return <DashboardCardsSkeleton />;
  const columns = fontScale >= dashboardLayout.singleColumnFontScale ? 1 : 2;
  const artScale = dashboardLayout.artScale / (columns === 2 ? Math.max(1, fontScale) : 1);
  const artSize = dashboardLayout.artSize * artScale;
  const cards = [
      { key: 'total', label: totalLabel, count: total, icon: 'folder', onPress: totalOnPress },
      { key: 'pending', label: 'Pending', count: pending, icon: 'clock', onPress: pendingOnPress },
      { key: 'approved', label: approvedLabel, count: approved, icon: 'check-square', onPress: approvedOnPress },
      { key: 'rejected', label: 'Rejected', count: rejected, icon: 'x-square', onPress: rejectedOnPress },
  ];
  const rows = Array.from({ length: Math.ceil(cards.length / columns) }, (_, index) => cards.slice(index * columns, (index + 1) * columns));
  return (
    <View style={{ gap: space.md, marginBottom: space.lg }}>
      {rows.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: space.md, alignItems: 'stretch' }}>
          {row.map(card => {
            const tone = dashboardTones[card.key];
            return <DashboardCard key={card.key} onPress={card.onPress} label={card.label} count={card.count}
              style={{ flex: 1, minWidth: 0, aspectRatio: 1, padding: space.md, overflow: 'hidden',
                backgroundColor: tone.background, borderRadius: radii.card, borderCurve: 'continuous' }}>
              <Text style={{ ...type.sectionTitle, minHeight: type.sectionTitle.lineHeight * 2 * fontScale, color: tone.foreground }}>{card.label}</Text>
              <View style={{ flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.xs, marginTop: space.xs }}>
                <Text style={[typography.number, { flexShrink: 1, color: tone.foreground }]}>{card.count ?? '—'}</Text>
                <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                  style={{ width: artSize, height: artSize, alignSelf: 'flex-end', flexShrink: 0 }}>
                  <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
                    <DashboardCardIllustration kind={card.key} scale={artScale} />
                  </View>
                </View>
              </View>
            </DashboardCard>;
          })}
        </View>
      ))}
    </View>
  );
}
