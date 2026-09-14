import { Text, View } from "react-native";

export default function SubmissionDetailsCard({ submission }) {
  const rows = [
    ["Organization", submission.org_name],
    ["Email", submission.submitted_by_email],
    [
      "Submitted On",
      submission.submitted_at
        ? new Date(submission.submitted_at).toLocaleDateString()
        : null,
    ],
    ["Document Type", submission.doc_type_name],
  ];
  return (
    <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-300 shadow-sm">
      <Text className="text-gray-500 text-[10px] font-bold tracking-wider mb-1">
        SUBMISSION DETAILS
      </Text>
      <Text className="text-vistaNavy text-lg font-bold mb-5">
        {submission.submitted_by_name || "—"}
      </Text>
      <View className="h-[1px] bg-gray-100 mb-4" />
      {rows
        .filter(([, value]) => value)
        .map(([label, value], index) => (
          <View
            key={label}
            className={`flex-row justify-between items-center ${index ? "mt-3" : ""}`}
          >
            <Text className="text-gray-500 text-sm">{label}</Text>
            <Text
              className="text-vistaNavy font-bold text-sm flex-1 text-right ml-5"
              numberOfLines={1}
            >
              {value}
            </Text>
          </View>
        ))}
    </View>
  );
}
