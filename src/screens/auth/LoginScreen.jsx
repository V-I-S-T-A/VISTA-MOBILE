import { MAIN_BLUE } from "../../constants/colors";
import TextInput from '../../components/common/AppInput';
import AppBottomSheet from '../../components/common/AppBottomSheet';
import { AppAlert as Alert } from '../../components/common/AppDialog';
import { Text } from '../../components/common/FontText';
import { View, TouchableOpacity, ImageBackground, Image, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { typography } from "../../theme/layout";
import { authService } from "../../services/authService";
import VistaProcessing from '../../components/common/VistaProcessing';

export default function LoginScreen() {
  const resetTrigger = useRef(null);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetStep, setResetStep] = useState("email");
  const [isResetting, setIsResetting] = useState(false);
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setErrorMessage(error.message || "Login failed. Check credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestResetCode = async () => {
    if (!resetEmail.trim()) return;
    setIsResetting(true);
    try {
      await authService.requestPasswordReset(resetEmail.trim());
      setResetStep("confirm");
      setErrorMessage("");
      Alert.alert(
        "Check your email",
        "If an active account uses this email, a verification code has been sent.",
      );
    } catch (error) {
      Alert.alert("Could not send code", error.message || "Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  const confirmReset = async () => {
    if (resetPassword !== confirmResetPassword) {
      Alert.alert("Passwords do not match", "Please confirm your new password.");
      return;
    }
    if (resetCode.length !== 6 || resetPassword.length < 8) {
      Alert.alert(
        "Check your details",
        "Enter the 6-digit code and a new password of at least 8 characters.",
      );
      return;
    }
    setIsResetting(true);
    try {
      await authService.confirmPasswordReset({
        email: resetEmail.trim(),
        code: resetCode,
        newPassword: resetPassword,
      });
      setIsForgotOpen(false);
      setResetStep("email");
      setEmail(resetEmail.trim());
      setPassword("");
      setResetEmail("");
      setResetCode("");
      setResetPassword("");
      setConfirmResetPassword("");
      Alert.alert(
        "Password reset",
        "You can now sign in with your new password.",
      );
    } catch (error) {
      Alert.alert(
        "Could not reset password",
        error.message || "The code may be invalid or expired.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ImageBackground
        source={require("../../assets/login-illustration-hq.webp")}
        resizeMode="cover"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        accessibilityIgnoresInvertColors
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingTop: Math.max(insets.top, 16) + Math.max(64, height * 0.23), paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <View style={{ width: "80%", maxWidth: 340, alignSelf: "center" }}>
          <View>
        <View className="items-center mb-6">
          <Image
            source={require("../../assets/logo.webp")}
            style={{ width: 92, height: 92 }}
            resizeMode="contain"
            accessibilityLabel="VISTA Logo"
          />
          <Text
            style={{
              fontFamily: "DMSans_800ExtraBold",
              fontSize: 24,
              letterSpacing: 2.5,
              color: MAIN_BLUE,
              marginTop: 6,
            }}
          >
            VISTA
          </Text>
        </View>

        <View className="bg-white rounded-full border border-[#F0B34B] px-4 mb-3"
          style={{ minHeight: 48, justifyContent: "center" }}>
          <TextInput
            placeholder="youremail@gmail.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="text-gray-700 text-sm"
            style={{ flex: 1, minHeight: 48, paddingVertical: 10, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0, fontSize: 14 }}
          />
        </View>

        <View className="bg-white rounded-full border border-[#F0B34B] px-4 mb-3 flex-row items-center"
          style={{ minHeight: 48 }}>
          <TextInput
            placeholder="password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            className="text-gray-700 text-sm"
            style={{ flex: 1, minHeight: 48, paddingVertical: 10, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0, fontSize: 14 }}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityRole="button"
            style={{ width: 48, minHeight: 48, alignItems: "center", justifyContent: "center", marginRight: -12 }}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text className="text-red-600 text-sm font-semibold mb-3 px-2">
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          ref={resetTrigger}
          onPress={() => {
            setResetEmail(email);
            setIsForgotOpen(true);
          }}
          className="self-end mb-3 px-1"
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text className="text-vistaNavy font-semibold text-sm">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isSubmitting}
          className={`bg-vistaOrange rounded-full py-3 items-center ${
            isSubmitting ? "opacity-70" : ""
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white"
              style={[typography.section, { letterSpacing: 0 }]}>
              Sign in
            </Text>
          )}
        </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AppBottomSheet returnFocusRef={resetTrigger} visible={isForgotOpen} title="Reset Password" onClose={() => setIsForgotOpen(false)} busy={isResetting}>

            {resetStep === "email" ? (
              <>
                <Text className="text-gray-500 mb-5">
                  If an active account uses this email, we’ll send a verification code.
                </Text>
                <TextInput
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="Email address"
                  autoCorrect={false}
                  autoComplete="email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-5"
                />
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setIsForgotOpen(false)}
                    className="flex-1 items-center py-3 mr-3"
                  >
                    <Text className="text-gray-600 font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={requestResetCode}
                    disabled={isResetting || !resetEmail.trim()}
                    className="bg-vistaOrange rounded-xl flex-1 items-center py-3"
                  >
                    {isResetting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Send code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text className="text-gray-500 mb-5">
                  Enter the 6-digit verification code sent to {resetEmail}.
                </Text>
                <TextInput
                  value={resetCode}
                  onChangeText={setResetCode}
                  placeholder="Verification code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-3"
                />
                <TextInput
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  placeholder="New password (8+ characters)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  secureTextEntry
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-5 text-gray-700"
                />
                <TextInput
                  value={confirmResetPassword}
                  onChangeText={setConfirmResetPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  secureTextEntry
                  className="border border-gray-200 rounded-xl px-4 min-h-[48px] mb-5 text-gray-700"
                />
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => {
                      setResetStep("email");
                      setResetCode("");
                      setResetPassword("");
                      setConfirmResetPassword("");
                    }}
                    className="flex-1 items-center py-3 mr-3"
                  >
                    <Text className="text-gray-600 font-semibold">Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmReset}
                    disabled={isResetting}
                    className="bg-vistaOrange rounded-xl flex-1 items-center py-3"
                  >
                    {isResetting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold">Reset</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </AppBottomSheet>
      <VistaProcessing visible={isResetting} message={resetStep === 'email' ? 'Sending reset code…' : 'Resetting your password…'} />
    </View>
  );
}
