import { Text, View } from "react-native";
import { getStatusMeta } from "../../constants/submissionStatus";

export default function StatusBadge({ status, size = "md", className = "" }) {
  const meta = getStatusMeta(status);
  const large = size === "lg";

  return (
    <View
      className={`flex-row items-center self-start rounded-full ${
        large ? "px-4 py-2" : "px-3 py-1.5"
      } ${className}`}
      style={{ backgroundColor: meta.bg }}
    >
      <View
        className={`rounded-full ${large ? "w-2.5 h-2.5 mr-2" : "w-2 h-2 mr-1.5"}`}
        style={{ backgroundColor: meta.dot }}
      />
      <Text
        className={`font-extrabold ${large ? "text-sm" : "text-xs"}`}
        style={{ color: meta.text }}
      >
        {meta.label}
      </Text>
    </View>
  );
}
