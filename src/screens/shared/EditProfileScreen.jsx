import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [passwordStep, setPasswordStep] = useState("form");
  const [passwordError, setPasswordError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  useEffect(() => {
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
  }, [user]);
  const avatar = selectedImage
    ? { uri: selectedImage }
    : user?.image_url
      ? { uri: user.image_url }
      : require("../../assets/default_user.jpg");
  const pickImage = async (source) => {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow access to select a profile picture.",
      );
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };
  const chooseImage = () =>
    Alert.alert("Profile picture", "Choose a source", [
      { text: "Take photo", onPress: () => pickImage("camera") },
      { text: "Choose from library", onPress: () => pickImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  const save = async () => {
    setSaving(true);
    try {
      const payload = selectedImage ? new FormData() : {};
      if (selectedImage) {
        payload.append("first_name", firstName.trim());
        payload.append("last_name", lastName.trim());
        payload.append("image", {
          uri: selectedImage,
          name: "profile-photo.jpg",
          type: "image/jpeg",
        });
      } else {
        payload.first_name = firstName.trim();
        payload.last_name = lastName.trim();
      }
      const updated = await authService.updateMe(payload);
      updateUser(updated);
      setSelectedImage(null);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };
  const resetPasswordFlow = () => {
    setIsPasswordOpen(false);
    setPasswordStep("form");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setPasswordError("");
  };
  const requestPasswordCode = async () => {
    if (!oldPassword || newPassword.length < 8) {
      Alert.alert(
        "Check your password",
        "Enter your current password and a new password of at least 8 characters.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Confirm your new password.");
      return;
    }
    setPasswordError("");
    setIsSendingCode(true);
    try {
      await authService.requestPasswordChangeCode();
      setPasswordStep("verify");
      setVerificationCode("");
    } catch (error) {
      setPasswordError(error.message || "Could not send a verification code.");
    } finally {
      setIsSendingCode(false);
    }
  };
  const changePassword = async () => {
    if (verificationCode.length !== 6) {
      setPasswordError("Enter the 6-digit verification code from your email.");
      return;
    }
    setPasswordError("");
    setIsChangingPassword(true);
    try {
      await authService.confirmPasswordChange({
        oldPassword,
        newPassword,
        code: verificationCode,
      });
      resetPasswordFlow();
      Alert.alert("Success", "Your password has been changed.");
    } catch (error) {
      setPasswordError(error.message || "Could not change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };
  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      <View className="px-5 pt-4 pb-20">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 w-10"
        >
          <Feather name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <View className="flex-1 bg-[#245EA9] rounded-t-[40px] px-6 pt-16 mt-6">
        <View className="absolute -top-16 left-0 right-0 items-center">
          <View>
            <Image
              source={avatar}
              className="w-32 h-32 rounded-full border-4 border-[#F3F3F3] bg-gray-300"
            />
            <TouchableOpacity
              onPress={chooseImage}
              className="absolute bottom-1 right-1 bg-white rounded-full p-2 border border-gray-100"
            >
              <Feather name="camera" size={17} color="#1E3A68" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <Text className="text-white text-2xl font-bold mb-6 mt-2">
            Edit Profile
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#9ca3af"
            className="bg-white rounded-full px-5 h-[48px] text-gray-800 mb-4"
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#9ca3af"
            className="bg-white rounded-full px-5 h-[48px] text-gray-800 mb-4"
          />
          <TextInput
            value={user?.email || ""}
            editable={false}
            className="bg-white rounded-full px-5 h-[48px] text-gray-800 opacity-80 mb-4"
          />
          {user?.department ? (
            <View className="bg-white/15 rounded-2xl px-5 py-4 mb-6">
              <Text className="text-white/70 text-xs">ORGANIZATION</Text>
              <Text className="text-white font-bold mt-1">
                {user.department}
              </Text>
            </View>
          ) : null}
          <View className="flex-row">
            <TouchableOpacity
              onPress={save}
              disabled={saving}
              className="bg-[#FFC342] rounded-full h-[48px] items-center justify-center flex-1 mr-3"
            >
              {saving ? (
                <ActivityIndicator color="#5a3d00" />
              ) : (
                <Text className="text-[#5a3d00] font-bold">Update Profile</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-white rounded-full h-[48px] items-center justify-center flex-1"
            >
              <Text className="text-[#245EA9] font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setIsPasswordOpen(true)}
            className="items-center mt-6"
          >
            <Text className="text-white font-semibold">Change Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <Modal
        visible={isPasswordOpen}
        transparent
        animationType="fade"
        onRequestClose={resetPasswordFlow}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-vistaNavy text-xl font-bold mb-5">
              {passwordStep === "form" ? "Change Password" : "Verify Your Email"}
            </Text>
            {passwordStep === "form" ? (
              <>
                <TextInput
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Current password"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  secureTextEntry
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-3 text-gray-700"
                />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (8+ characters)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  secureTextEntry
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-3 text-gray-700"
                />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  secureTextEntry
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-4 text-gray-700"
                />
              </>
            ) : (
              <>
                <Text className="text-gray-600 mb-4">
                  Enter the 6-digit verification code sent to {user?.email}.
                </Text>
                <TextInput
                  value={verificationCode}
                  onChangeText={(value) =>
                    setVerificationCode(value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit verification code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-3 text-gray-700"
                />
                <TouchableOpacity
                  onPress={requestPasswordCode}
                  disabled={isSendingCode || isChangingPassword}
                  className="mb-4"
                >
                  <Text className="text-[#245EA9] font-semibold">
                    {isSendingCode ? "Sending code..." : "Resend verification code"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {!!passwordError && (
              <Text className="text-red-600 mb-4">{passwordError}</Text>
            )}
            <View className="flex-row">
              <TouchableOpacity
                onPress={passwordStep === "verify"
                  ? () => {
                      setPasswordStep("form");
                      setVerificationCode("");
                      setPasswordError("");
                    }
                  : resetPasswordFlow}
                disabled={isSendingCode || isChangingPassword}
                className="flex-1 items-center py-3 mr-3"
              >
                <Text className="text-gray-600 font-semibold">
                  {passwordStep === "verify" ? "Back" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={passwordStep === "form" ? requestPasswordCode : changePassword}
                disabled={isSendingCode || isChangingPassword}
                className="bg-[#FFC342] rounded-xl flex-1 items-center py-3"
              >
                {isSendingCode || isChangingPassword ? (
                  <ActivityIndicator color="#5a3d00" />
                ) : (
                  <Text className="text-[#5a3d00] font-bold">
                    {passwordStep === "form" ? "Send Code" : "Change Password"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
