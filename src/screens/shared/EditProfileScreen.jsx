import TextInput from '../../components/common/AppInput';
import AppBottomSheet from '../../components/common/AppBottomSheet';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { AppAlert as Alert } from '../../components/common/AppDialog';
import { Text } from '../../components/common/FontText';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import VistaProcessing from '../../components/common/VistaProcessing';
import { ProfileSkeleton } from '../../components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';
import UserAvatar from '../../components/common/UserAvatar';
import { colors, sizes, type, reviewControls } from '../../theme/tokens';
import { useStaffLayout } from '../../theme/layout';

export default function EditProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const logoutTrigger = useRef(null);
  const passwordTrigger = useRef(null);
  const imageTrigger = useRef(null);
  const screenLayout = useStaffLayout();
  const { user, logout, updateUser } = useAuth();
  const profile = useQuery({ queryKey: ['profile', user?.user_id], queryFn: authService.me, enabled: !!user?.user_id });
  useEffect(() => { if (profile.data) updateUser(profile.data); }, [profile.data, updateUser]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res = await profile.refetch();
      if (res?.data) {
        updateUser(res.data);
        setFirstName(res.data.first_name || "");
        setLastName(res.data.last_name || "");
      }
    } catch {
      // Graceful network failure handling preserves existing input state
    } finally {
      setRefreshing(false);
    }
  };
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
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const leaveProfile = () => navigation.canGoBack() ? navigation.goBack() : navigation.replace(user?.role === 'student' ? 'StudentHome' : 'StaffHome');
  useEffect(() => {
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
  }, [user]);
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
    ], { returnFocusRef: imageTrigger });
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
  const confirmLogout = () => setIsLogoutOpen(true);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setIsLogoutOpen(false);
    } catch (error) {
      setIsLogoutOpen(false);
      Alert.alert('Sign-out pending', error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <View className="flex-1 bg-[#F3F3F3]" style={{ paddingTop: insets.top }}>
      {profile.isPending ? <ProfileSkeleton /> : <>
      <View style={[screenLayout.horizontal, { paddingTop: 8, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <TouchableOpacity
          onPress={leaveProfile}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="p-2 -ml-2 min-w-[48px] min-h-[48px] items-center justify-center"
        >
          <Feather name="chevron-left" size={18} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Open Settings"
          className="p-2 -mr-2 min-w-[48px] min-h-[48px] items-center justify-center"
        >
          <Feather name="settings" size={18} color="#333" />
        </TouchableOpacity>
      </View>
      <View
        className="flex-1 bg-[#245EA9]"
        style={[
          screenLayout.horizontal,
          {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'visible',
            marginTop: 44,
          },
        ]}
      >
        <View
          style={{
            position: 'absolute',
            top: -34,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 10,
          }}
          pointerEvents="box-none"
        >
          <View style={{ width: sizes.avatarProfile, height: sizes.avatarProfile }}>
            <UserAvatar
              uri={selectedImage || user?.image_url}
              size={sizes.avatarProfile}
              style={{ borderWidth: 3, borderColor: '#FFFFFF' }}
            />
            <TouchableOpacity
              ref={imageTrigger}
              onPress={chooseImage}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E1E8F0',
                shadowColor: '#183A60',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              <Feather name="camera" size={16} color={colors.navy} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#1a59a5", "#fdc849"]}
              tintColor="#FFFFFF"
            />
          }
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingTop: 68,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            width: '100%',
            maxWidth: sizes.contentWidth,
            alignSelf: 'center',
          }}
        >
          <View>
            <Text
              style={{
                ...type.title,
                fontSize: 20,
                lineHeight: 26,
                fontFamily: 'DMSans_600SemiBold',
                color: '#FFFFFF',
                marginBottom: 16,
              }}
            >
              Edit Profile
            </Text>
            <TextInput
              value={firstName}
              size="compact"
              style={{
                borderRadius: 22,
                minHeight: reviewControls.fieldHeight,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                color: '#1E3A68',
                fontSize: 13,
                fontFamily: 'DMSans_400Regular',
                marginBottom: 12,
              }}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#94A3B8"
              className="bg-white rounded-full px-4 text-gray-800 mb-3"
            />
            <TextInput
              value={lastName}
              size="compact"
              style={{
                borderRadius: 22,
                minHeight: reviewControls.fieldHeight,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                color: '#1E3A68',
                fontSize: 13,
                fontFamily: 'DMSans_400Regular',
                marginBottom: 12,
              }}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#94A3B8"
              className="bg-white rounded-full px-4 text-gray-800 mb-3"
            />
            <TextInput
              value={user?.email || ""}
              size="compact"
              style={{
                borderRadius: 22,
                minHeight: reviewControls.fieldHeight,
                paddingHorizontal: 16,
                backgroundColor: '#FFFFFF',
                color: '#1E3A68',
                opacity: 0.85,
                fontSize: 13,
                fontFamily: 'DMSans_400Regular',
                marginBottom: 16,
              }}
              editable={false}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              className="bg-white rounded-full px-4 text-gray-800 opacity-80 mb-4"
            />
            {user?.department ? (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    fontSize: 11,
                    lineHeight: 16,
                    color: 'rgba(255, 255, 255, 0.75)',
                  }}
                >
                  Organization
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <UserAvatar
                    uri={user.org_image_url}
                    size={sizes.avatar}
                    style={{ backgroundColor: 'white', marginRight: 10 }}
                  />
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      fontSize: 13,
                      lineHeight: 18,
                      color: '#FFFFFF',
                      flex: 1,
                    }}
                  >
                    {user.department}
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Update Profile"
                style={{
                  backgroundColor: '#FFC342',
                  borderRadius: 22,
                  minHeight: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
                hitSlop={{ top: 3, bottom: 3, left: 0, right: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#513600" />
                ) : (
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#513600' }}>
                    Update Profile
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={leaveProfile}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 22,
                  minHeight: 42,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                }}
                hitSlop={{ top: 3, bottom: 3, left: 0, right: 0 }}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#1a59a5' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              ref={passwordTrigger}
              onPress={() => setIsPasswordOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Change Password"
              style={{ alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 4 }}
            >
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#FFFFFF' }}>
                Change Password
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 'auto', paddingTop: 20 }}>
            <TouchableOpacity
              ref={logoutTrigger}
              onPress={confirmLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.35)',
                borderRadius: 22,
                minHeight: 44,
                width: '100%',
              }}
              hitSlop={{ top: 2, bottom: 2, left: 0, right: 0 }}
            >
              <Feather name="log-out" size={16} color="white" />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: 'white', marginLeft: 8 }}>
                Log out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      </>}
      <AppBottomSheet returnFocusRef={passwordTrigger} visible={isPasswordOpen} title={passwordStep === 'form' ? 'Change Password' : 'Verify Your Email'} onClose={resetPasswordFlow} busy={isSendingCode || isChangingPassword}>

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
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-3 text-gray-700"
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
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-3 text-gray-700"
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
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-2 text-gray-700"
                />
              </>
            ) : (
              <>
                <Text className="text-gray-600 mb-2">
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
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-3 text-gray-700"
                />
                <TouchableOpacity
                  onPress={requestPasswordCode}
                  disabled={isSendingCode || isChangingPassword}
                  className="mb-2 min-h-[48px] justify-center"
                >
                  <Text className="text-[#245EA9] font-semibold">
                    {isSendingCode ? "Sending code..." : "Resend verification code"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {!!passwordError && (
              <Text className="text-red-600 mb-2">{passwordError}</Text>
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
                className="flex-1 items-center justify-center min-h-[48px] py-2 mr-3"
              >
                <Text className="text-gray-600 font-semibold">
                  {passwordStep === "verify" ? "Back" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={passwordStep === "form" ? requestPasswordCode : changePassword}
                disabled={isSendingCode || isChangingPassword}
                className="bg-[#FFC342] rounded-xl flex-1 items-center justify-center min-h-[48px] py-2"
              >
                {isSendingCode || isChangingPassword ? (
                  <ActivityIndicator color="#5a3d00" />
                ) : (
                  <Text className="text-[#5a3d00] font-medium">
                    {passwordStep === "form" ? "Send Code" : "Change Password"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </AppBottomSheet>
      <ConfirmDialog returnFocusRef={logoutTrigger} visible={isLogoutOpen} title="Log out" message="Are you sure you want to log out?" confirmLabel="Log out" onConfirm={handleLogout} onCancel={() => setIsLogoutOpen(false)} busy={isLoggingOut} />
      <VistaProcessing visible={saving || isSendingCode || isChangingPassword} message={saving ? 'Saving your profile…' : isSendingCode ? 'Sending verification code…' : 'Updating your password…'} />
    </View>
  );
}
