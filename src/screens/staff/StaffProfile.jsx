import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function StaffProfile({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, tokens, updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
      };

      const data = await authService.updateMe({
        data: payload,
        accessToken: tokens?.access,
      });

      updateUser(data);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setForm({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        phone: "",
        dob: "",
        gender: "",
      });
    }
    navigation.goBack();
  };

  const avatarUrl = user?.image_url 
    ? { uri: user.image_url }
    : require("../../assets/default_user.jpg");

  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      {/* Top Header */}
      <View className="px-5 pt-4 pb-20">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 w-10 h-10 justify-center"
        >
          <Feather name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Main Content Card */}
      <View className="flex-1 bg-[#1e5aa0] rounded-t-[40px] px-6 pt-16 mt-6 pb-6">
        
        {/* Profile Avatar overlapping the boundary */}
        <View className="absolute -top-16 left-0 right-0 items-center">
          <View className="relative">
            <Image
              source={avatarUrl}
              className="w-32 h-32 rounded-full border-4 border-[#F3F3F3] bg-gray-300"
            />
            {/* Camera Icon - visual only for now */}
            <View className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-sm border border-gray-100">
              <Feather name="camera" size={16} color="#333" />
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-white text-2xl font-bold mb-6 mt-2">
            Edit Profile
          </Text>

          <View className="flex flex-col">
            <TextInput
              value={form.firstName}
              onChangeText={(val) => handleChange("firstName", val)}
              placeholder="First Name"
              placeholderTextColor="#9ca3af"
              className="bg-white rounded-full px-5 h-[48px] text-gray-800 font-medium mb-4"
            />

            <TextInput
              value={form.lastName}
              onChangeText={(val) => handleChange("lastName", val)}
              placeholder="Last Name"
              placeholderTextColor="#9ca3af"
              className="bg-white rounded-full px-5 h-[48px] text-gray-800 font-medium mb-4"
            />

            <TextInput
              value={form.email}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              className="bg-white rounded-full px-5 h-[48px] text-gray-800 font-medium opacity-80 mb-4"
            />

            {/* Phone Number Field */}
            <View className="bg-white rounded-full px-5 h-[48px] flex-row items-center mb-4">
              <Text className="text-[18px]">🇵🇭</Text>
              <Text className="text-gray-700 font-medium ml-2 mr-3">+63</Text>
              <View className="w-[1px] h-6 bg-gray-300 mr-3" />
              <TextInput
                value={form.phone}
                onChangeText={(val) => handleChange("phone", val)}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor="#9ca3af"
                className="flex-1 text-gray-800 font-medium h-full p-0"
              />
            </View>

            {/* DOB and Gender */}
            <View className="flex-row mb-4">
              <TextInput
                value={form.dob}
                onChangeText={(val) => handleChange("dob", val)}
                placeholder="Date of Birth"
                placeholderTextColor="#9ca3af"
                className="bg-white rounded-full px-5 h-[48px] text-gray-800 font-medium flex-1 mr-3"
              />
              <TextInput
                value={form.gender}
                onChangeText={(val) => handleChange("gender", val)}
                placeholder="Gender"
                placeholderTextColor="#9ca3af"
                className="bg-white rounded-full px-5 h-[48px] text-gray-800 font-medium flex-1"
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-2 pt-2 pb-6">
              <TouchableOpacity
                onPress={handleUpdate}
                disabled={isSubmitting}
                className="bg-[#FFC342] rounded-full h-[48px] items-center justify-center flex-1 shadow-sm mr-3"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#5a3d00" />
                ) : (
                  <Text className="text-[#5a3d00] font-bold text-sm">Update Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancel}
                className="bg-white rounded-full h-[48px] items-center justify-center flex-1 shadow-sm"
              >
                <Text className="text-[#1e5aa0] font-bold text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
