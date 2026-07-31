import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

const STATUS_OPTIONS = [
  "All Status",
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Resubmission Required",
];

export default function SubmissionHistorySearch({ searchQuery, setSearchQuery, statusFilter, setStatusFilter }) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <View className="mb-6 z-50">
      <View className="flex-row items-center justify-between z-50 relative">
        <View className="flex-row items-center bg-[#eef0f3] border border-gray-200 rounded-lg px-3 py-2.5 flex-1 mr-3 h-[42px]">
          <Feather name="search" size={16} color="#9ca3af" className="mr-2" />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search submissions..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-[13px] text-gray-700 ml-1 h-full p-0"
          />
        </View>
        <TouchableOpacity 
          onPress={() => setIsFilterOpen(true)}
          className="bg-[#FFC342] flex-row items-center justify-center rounded-lg px-4 h-[42px] shadow-sm relative z-50"
        >
          <Ionicons name="filter" size={16} color="white" className="mr-2 mt-0.5" />
          <Text className="text-white font-bold text-sm ml-0.5">Filter</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} 
          activeOpacity={1} 
          onPressOut={() => setIsFilterOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View className="absolute top-[230px] right-[20px] bg-white rounded-xl shadow-md border border-gray-100 p-2 w-[180px]">
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity 
                  key={option}
                  onPress={() => {
                    setStatusFilter(option);
                    setIsFilterOpen(false);
                  }}
                  className={`py-2.5 px-3 rounded-lg ${statusFilter === option ? 'bg-[#f8f9fa]' : ''}`}
                >
                  <Text className={`text-[13px] ${statusFilter === option ? 'text-vistaNavy font-bold' : 'text-gray-700 font-medium'}`}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
