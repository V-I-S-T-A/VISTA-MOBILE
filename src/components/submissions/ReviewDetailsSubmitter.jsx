import { surfaces } from "../../theme/layout";
import { Text } from "../common/FontText";
import { View } from "react-native";
import UserAvatar from '../common/UserAvatar';

export default function ReviewDetailsSubmitter({
  submission,
  showDocumentType = false,
}) {
  const details = [
    ["Organization", submission?.org_name],
    ["Email", submission?.submitted_by_email],
    [
      "Submitted On",
      submission?.submitted_at
        ? new Date(submission.submitted_at).toLocaleDateString()
        : null,
    ],
    ...(showDocumentType
      ? [["Document Type", submission?.doc_type_name]]
      : []),
  ];

  return (
    <View className="bg-white rounded-3xl p-4 mb-4 border border-gray-300 " style={surfaces.card}>
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 rounded-full bg-[#1e5aa015] items-center justify-center mr-4 overflow-hidden">
          <UserAvatar uri={submission?.org_image_url} size={48} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-gray-500 text-xs font-bold tracking-wider mb-1">
            SUBMITTER DETAILS
          </Text>
          <Text
            className="text-vistaNavy text-base font-bold"
          >
            {submission?.submitted_by_name || "Unknown"}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 w-full mb-4" />

      <View>
        {details
          .filter(([, value]) => value)
          .map(([label, value], index) => (
            <View
              key={label}
              className={`flex-row justify-between items-start ${index ? "mt-3" : ""}`}
            >
              <Text className="text-gray-500 text-xs leading-5 shrink" style={{ maxWidth: "32%" }}>{label}</Text>
              <Text
                className="text-vistaNavy font-semibold text-xs leading-5 flex-1 text-right ml-3"
              >
                {value}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}
