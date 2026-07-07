import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

const submissions = [
  {
    id: 1,
    title: "SITE(Society of Inf...",
    email: "angelo.SITE@gmail.com",
    date: "29 JAN 2026",
    status: "Pending",
  },
  {
    id: 2,
    title: "SITE(Society of Info...",
    email: "",
    date: "",
    status: null,
  },
  {
    id: 3,
    title: "SITE(Society of Info...",
    email: "",
    date: "",
    status: null,
  },
];

function StaffHomeHeader() {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Image
        source={require("../../../assets/default_user.jpg")}
        className="w-10 h-10 rounded-full"
      />
      <Image
        source={require("../../../assets/logo.png")}
        className="w-14 h-14"
        resizeMode="contain"
      />
      <TouchableOpacity>
        <Feather name="sliders" size={23} color="#111827" />
      </TouchableOpacity>
    </View>
  );
}

function SubmissionSummary() {
  return (
    <>
      <View className="bg-vistaNavy rounded-2xl p-5 flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-white/80 text-sm mb-1">Total Submissions</Text>
          <Text className="text-white text-3xl font-bold">128</Text>
        </View>
        <View className="bg-white/20 rounded-xl p-3">
          <Feather name="folder" size={26} color="white" />
        </View>
      </View>

      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-vistaYellow rounded-2xl p-4 flex-row justify-between items-center">
          <View>
            <Text className="text-white/90 text-sm mb-1">Pending</Text>
            <Text className="text-white text-2xl font-bold">42</Text>
          </View>
          <Feather name="clock" size={22} color="white" />
        </View>
        <View className="flex-1 bg-vistaYellow rounded-2xl p-4 flex-row justify-between items-center">
          <View>
            <Text className="text-white/90 text-sm mb-1">Completed</Text>
            <Text className="text-white text-2xl font-bold">86</Text>
          </View>
          <Feather name="check-square" size={22} color="white" />
        </View>
      </View>
    </>
  );
}

function RecentSubmissionItem({ item }) {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 flex-row justify-between items-center">
      <View className="flex-1">
        <Text className="text-gray-800 font-semibold" numberOfLines={1}>
          {item.title}
        </Text>
        {item.email ? (
          <Text className="text-gray-400 text-xs mt-1">{item.email}</Text>
        ) : null}
        {item.date ? (
          <Text className="text-gray-400 text-xs">{item.date}</Text>
        ) : null}
      </View>
      {item.status && (
        <View className="bg-vistaYellow/90 rounded-full px-3 py-1">
          <Text className="text-white text-xs font-semibold">{item.status}</Text>
        </View>
      )}
    </View>
  );
}

function RecentSubmissions() {
  return (
    <>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-vistaNavy font-bold text-base">
          Recent Submissions
        </Text>
        <TouchableOpacity>
          <Text className="text-vistaNavy text-sm">View All</Text>
        </TouchableOpacity>
      </View>

      {submissions.map((item) => (
        <RecentSubmissionItem key={item.id} item={item} />
      ))}
    </>
  );
}

export default function StaffHomeContent() {
  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <StaffHomeHeader />

      <Text className="text-2xl font-bold text-vistaNavy">Staff Dashboard</Text>
      <Text className="text-gray-500 mb-4">Welcome back!</Text>

      <SubmissionSummary />
      <RecentSubmissions />
    </ScrollView>
  );
}