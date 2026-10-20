import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function SubmissionDocuments({ documents = [] }) {
  const current = documents.filter((doc) => doc?.is_current !== false);
  if (!current.length) return null;
  const openFile = async (doc) => {
    if (!doc.file_url) {
      Alert.alert(
        "File unavailable",
        "This attachment has no file URL. Contact staff for help.",
      );
      return;
    }
    try {
      const supported = await Linking.canOpenURL(doc.file_url);
      if (!supported) throw new Error("No app can open this file link.");
      await Linking.openURL(doc.file_url);
    } catch (e) {
      Alert.alert(
        "Could not open file",
        e.message || "Try again or contact staff.",
      );
    }
  };
  return (
    <View className="bg-white rounded-2xl p-4 mb-5 border border-gray-200">
      <Text className="text-vistaNavy text-sm font-extrabold mb-3">
        ATTACHMENT{current.length > 1 ? "S" : ""}
      </Text>
      {current.map((doc) => {
        const isPdf =
          (doc.mime_type || "").includes("pdf") ||
          (doc.file_name || "").toLowerCase().endsWith(".pdf");
        return (
          <TouchableOpacity
            key={doc.document_id || doc.file_url || doc.file_name}
            onPress={() => openFile(doc)}
            className="flex-row items-center bg-slate-50 rounded-xl p-3 mb-2"
          >
            <Feather
              name={isPdf ? "file-text" : "image"}
              size={21}
              color="#245EA9"
            />
            <Text
              numberOfLines={1}
              className="flex-1 mx-3 text-vistaNavy font-semibold"
            >
              {doc.file_name || "Attached document"}
            </Text>
            <Feather name="external-link" size={17} color="#64748B" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
