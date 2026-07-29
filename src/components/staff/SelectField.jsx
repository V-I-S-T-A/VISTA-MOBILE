import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

export default function SelectField({
  label,
  placeholder,
  value, // { id, label } | null
  options, // [{ id, label }]
  isLoading,
  disabled,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-vistaNavy text-xs font-extrabold mb-2">
        {label}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-10 border border-slate-200 rounded-lg px-3 flex-row items-center justify-between ${
          disabled ? "bg-slate-100" : "bg-white"
        }`}
      >
        <Text
          className={`text-xs font-semibold ${value ? "text-vistaNavy" : "text-slate-500"}`}
          numberOfLines={1}
        >
          {value?.label || placeholder}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Feather name="chevron-down" size={22} color="#64748B" />
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="bg-white rounded-t-2xl max-h-[60%] px-4 pt-4 pb-8">
            <Text className="text-vistaNavy font-extrabold text-base mb-3">
              {label}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-3 border-b border-slate-100"
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text className="text-vistaNavy text-sm font-semibold">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-slate-400 text-xs py-4">
                  No options available.
                </Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
