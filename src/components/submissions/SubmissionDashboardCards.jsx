import { typography } from "../../theme/layout";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import VistaIcon from '../common/VistaIcon';
import { Text } from "../common/FontText";
import { MAIN_BLUE, MAIN_YELLOW } from "../../constants/colors";
import { DashboardCardsSkeleton } from '../common/Skeleton';

function DashboardCard({ onPress, className, style, children }) {
  const Card = onPress ? TouchableOpacity : View;

  return (
    <Card
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      className={className}
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
  totalLabel = "Total Submissions",
  approvedLabel = "Approved",
  totalOnPress,
  pendingOnPress,
  approvedOnPress,
  showTotalLoader = false,
}) {
  if (isLoading) return <DashboardCardsSkeleton />;
  return (
    <>
      <DashboardCard
        onPress={totalOnPress}
        className="rounded-2xl p-3 flex-row justify-between items-end mb-3"
        style={{ backgroundColor: MAIN_BLUE, borderRadius: 18, borderCurve: "continuous" }}
      >
        <View className="flex-1 min-w-0">
          <Text className="text-white text-sm mb-1 font-bold" style={{ color: '#FFFFFF' }}>
            {totalLabel}
          </Text>
          {isLoading && showTotalLoader ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-4xl font-bold" style={[typography.number, { color: '#FFFFFF' }]}>
              {isLoading ? "—" : total}
            </Text>
          )}
        </View>
        <VistaIcon name="folder" size={24} color="#FFFFFF" style={{ marginBottom: 4, marginRight: 2 }} />
      </DashboardCard>

      <View className="flex-row gap-3 mb-4">
        <DashboardCard
          onPress={pendingOnPress}
          className="flex-1 rounded-2xl p-3 flex-row justify-between items-end"
          style={{ backgroundColor: MAIN_YELLOW, borderRadius: 18, borderCurve: "continuous" }}
        >
          <View className="flex-1 min-w-0">
            <Text className="text-white text-xs mb-1 font-bold" style={{ color: '#FFFFFF' }}>
              Pending
            </Text>
            <Text className="text-white text-4xl font-bold" style={[typography.number, { color: '#FFFFFF' }]}>
              {isLoading ? "—" : pending}
            </Text>
          </View>
          <VistaIcon name="clock" size={24} color="#FFFFFF" style={{ marginBottom: 4, marginRight: 2 }} />
        </DashboardCard>

        <DashboardCard
          onPress={approvedOnPress}
          className="flex-1 rounded-2xl p-3 flex-row justify-between items-end"
          style={{ backgroundColor: '#52B764', borderRadius: 18, borderCurve: "continuous" }}
        >
          <View className="flex-1 min-w-0">
            <Text className="text-white text-xs mb-1 font-bold" style={{ color: '#FFFFFF' }}>
              {approvedLabel}
            </Text>
            <Text className="text-white text-4xl font-bold" style={[typography.number, { color: '#FFFFFF' }]}>
              {isLoading ? "—" : approved}
            </Text>
          </View>
          <VistaIcon name="check-square" size={24} color="#FFFFFF" style={{ marginBottom: 4, marginRight: 2 }} />
        </DashboardCard>
      </View>
    </>
  );
}
