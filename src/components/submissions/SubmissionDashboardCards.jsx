import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "../common/FontText";
import { MAIN_BLUE, MAIN_YELLOW } from "../../constants/colors";

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
  return (
    <>
      <DashboardCard
        onPress={totalOnPress}
        className="rounded-3xl p-5 flex-row justify-between items-end mb-4"
        style={{ backgroundColor: MAIN_BLUE }}
      >
        <View>
          <Text className="text-white/80 text-lg mb-1 font-bold">
            {totalLabel}
          </Text>
          {isLoading && showTotalLoader ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-5xl font-bold">
              {isLoading ? "—" : total}
            </Text>
          )}
        </View>
        <View
          className="w-16 h-16 rounded-2xl items-center justify-center"
          style={{ backgroundColor: "#073B78" }}
        >
          <Feather name="folder" size={40} color="#A9D0FF" />
        </View>
      </DashboardCard>

      <View className="flex-row gap-3 mb-6">
        <DashboardCard
          onPress={pendingOnPress}
          className="flex-1 rounded-2xl p-4 flex-row justify-between items-end"
          style={{ backgroundColor: MAIN_YELLOW }}
        >
          <View>
            <Text className="text-white/90 text-md mb-1 font-bold">
              Pending
            </Text>
            <Text className="text-white text-5xl font-bold">
              {isLoading ? "—" : pending}
            </Text>
          </View>
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "#E7A600" }}
          >
            <MaterialCommunityIcons
              name="calendar-clock"
              size={40}
              color="#FFD900"
            />
          </View>
        </DashboardCard>

        <DashboardCard
          onPress={approvedOnPress}
          className="flex-1 rounded-2xl p-4 flex-row justify-between items-end"
          style={{ backgroundColor: MAIN_YELLOW }}
        >
          <View>
            <Text className="text-white/90 text-md mb-1 font-bold">
              {approvedLabel}
            </Text>
            <Text className="text-white text-5xl font-bold">
              {isLoading ? "—" : approved}
            </Text>
          </View>
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "#E7A600" }}
          >
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={40}
              color="#FFD900"
            />
          </View>
        </DashboardCard>
      </View>
    </>
  );
}
