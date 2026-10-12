import { View, Text } from "react-native";

function DetailRow({ label, value, first = false }) {
  return (
    <View
      className={`flex-row justify-between items-center ${first ? "" : "mt-3"}`}
    >
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text
        className="text-vistaNavy font-bold text-sm flex-1 text-right ml-5"
        numberOfLines={1}
      >
        {value || "—"}
      </Text>
    </View>
  );
}

export default function ReviewDetailsSubmitter({ submission }) {
  const initials = (submission?.org_name || "N/A").slice(0, 4).toUpperCase();

  const rows = [
    ["Organization", submission?.org_name],
    ["Email", submission?.submitted_by_email],
    ["Document Type", submission?.doc_type_name],
    ["Category", submission?.category_name],
    ["Academic Year", submission?.academic_year],
    [
      "Submitted On",
      submission?.submitted_at
        ? new Date(submission.submitted_at).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    ],
  ];

  return (
    <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
      <View className="flex-row items-center mb-5">
        <View className="w-12 h-12 rounded-full bg-[#1e5aa015] items-center justify-center mr-4">
          <Text className="text-[#1e5aa0] font-extrabold text-xs">
            {initials}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-500 text-xs font-extrabold tracking-wider mb-1">
            SUBMITTER DETAILS
          </Text>
          <Text className="text-vistaNavy text-lg font-bold" numberOfLines={1}>
            {submission?.submitted_by_name || "Unknown"}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 w-full mb-5" />

      <View>
        {rows.map(([label, value], index) => (
          <DetailRow
            key={label}
            label={label}
            value={value}
            first={index === 0}
          />
        ))}
      </View>
    </View>
  );
}
