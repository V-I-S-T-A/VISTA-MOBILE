import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

const documentFields = [
  { label: "ORGANIZATION", placeholder: "Select organization..." },
  { label: "DOCUMENT TYPE", placeholder: "Select type..." },
  { label: "CATEGORY", placeholder: "Select type..." },
  { label: "DOCUMENT TITLE", placeholder: "Enter document title..." },
  { label: "ACADEMIC YEAR", placeholder: "Enter academic year..." },
  { label: "SUBMITTED BY", placeholder: "Select" },
];

function DocumentEntryHeader() {
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

function DocumentField({ label, placeholder }) {
  return (
    <View className="mb-4">
      <Text className="text-vistaNavy text-xs font-extrabold mb-2">
        {label}
      </Text>
      <TouchableOpacity className="h-10 border border-slate-200 rounded-lg px-3 flex-row items-center justify-between bg-white">
        <Text className="text-slate-500 text-xs font-semibold">
          {placeholder}
        </Text>
        <Feather name="chevron-down" size={22} color="#64748B" />
      </TouchableOpacity>
    </View>
  );
}

function UploadBox() {
  return (
    <TouchableOpacity
      className="h-28 rounded-md items-center justify-center mb-4 bg-slate-50"
      style={{ borderWidth: 1, borderColor: "#DDE7F0", borderStyle: "dashed" }}
    >
      <View className="relative mb-1">
        <Feather name="camera" size={28} color="#9AAAC0" />
        <View className="absolute -right-1 -top-1 bg-slate-50 rounded-full">
          <Feather name="plus" size={12} color="#9AAAC0" />
        </View>
      </View>
      <Text className="text-slate-400 text-xs font-semibold">Attach</Text>
      <Text className="text-slate-400 text-xs font-semibold">
        Document(Required)
      </Text>
    </TouchableOpacity>
  );
}

export default function StaffDocumentEntryContent({ onLogPhysicalDocPress }) {
  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <DocumentEntryHeader />

      <Text className="text-2xl font-extrabold text-vistaNavy">
        Document Entry
      </Text>
      <Text className="text-vistaNavy text-sm font-semibold mb-4">
        Registration Portal.
      </Text>

      <View className="bg-white rounded-2xl px-6 pt-6 pb-7">
        {documentFields.map((field) => (
          <DocumentField key={field.label} {...field} />
        ))}

        <UploadBox />

        <TouchableOpacity
          onPress={onLogPhysicalDocPress}
          className="bg-[#FFC342] h-10 items-center justify-center"
        >
          <Text className="text-white font-extrabold text-base">
            Log Physical Doc
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}