import { Image, Text, View } from "react-native";

export default function ReviewDetailsSubmitter({
  submission,
  showDocumentType = false,
}) {
  const organizationImage = submission?.org_image_url
    ? { uri: submission.org_image_url }
    : null;
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
    <View className="bg-white rounded-3xl p-5 mb-5 border border-gray-300 shadow-sm">
      <View className="flex-row items-center mb-5">
        <View className="w-12 h-12 rounded-full bg-[#1e5aa015] items-center justify-center mr-4 overflow-hidden">
          {organizationImage ? (
            <Image
              source={organizationImage}
              className="w-12 h-12"
              resizeMode="contain"
            />
          ) : null}
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-gray-500 text-[10px] font-bold tracking-wider mb-1">
            SUBMITTER DETAILS
          </Text>
          <Text
            className="text-vistaNavy text-lg font-bold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {submission?.submitted_by_name || "Unknown"}
          </Text>
        </View>
      </View>

      <View className="h-[1px] bg-gray-100 w-full mb-5" />

      <View>
        {details
          .filter(([, value]) => value)
          .map(([label, value], index) => (
            <View
              key={label}
              className={`flex-row justify-between items-center ${index ? "mt-3" : ""}`}
            >
              <Text className="text-gray-600 text-xs">{label}</Text>
              <Text
                className="text-vistaNavy font-bold text-xs flex-1 text-right ml-4"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {value}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}
