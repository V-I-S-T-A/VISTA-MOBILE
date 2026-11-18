import { useState } from 'react';
import { Text } from "../common/FontText";
import { TouchableOpacity, View } from 'react-native';
import { Feather } from "@expo/vector-icons";
import AttachmentPreview from './AttachmentPreview';

export default function SubmissionDocuments({ documents = [] }) {
  const [selected, setSelected] = useState(null);
  const current = documents.filter((doc) => doc?.is_current !== false);
  if (!current.length) return null;
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
            accessibilityRole="button"
            accessibilityLabel={`Preview ${doc.file_name || 'attached document'}`}
            onPress={() => setSelected(doc)}
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
            <Feather name="eye" size={17} color="#64748B" />
          </TouchableOpacity>
        );
      })}
      {!selected || current.some(doc => doc === selected) ? <AttachmentPreview document={selected} onClose={() => setSelected(null)} /> : null}
    </View>
  );
}
