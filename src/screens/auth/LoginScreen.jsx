import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { authService } from "../../services/authService";

export default function LoginScreen() {
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
      const response = await authService.requestPasswordReset(
        resetEmail.trim(),
      );
      setResetStep("confirm");
      setErrorMessage("");
      Alert.alert("Check your email", response.detail);
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
      setResetCode("");
      setResetPassword("");
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
    <ImageBackground
      source={require("../../assets/login-illustration.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-8">
          <Image
            source={require("../../assets/logo.png")}
            className="w-24 h-24"
            resizeMode="contain"
          />
        </View>

        <View className="bg-white/90 rounded-full border border-vistaOrange px-5 py-4 mb-4">
          <TextInput
            placeholder="youremail@gmail.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            className="text-gray-700"
          />
        </View>

        <View className="bg-white/90 rounded-full border border-vistaOrange px-5 py-4 mb-3">
          <TextInput
            placeholder="password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            className="text-gray-700"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="absolute top-7 right-6"
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
          onPress={() => {
            setResetEmail(email);
            setIsForgotOpen(true);
          }}
          className="self-end mb-5 px-2"
        >
          <Text className="text-vistaNavy font-semibold text-sm">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isSubmitting}
          className={`bg-vistaOrange rounded-full py-4 items-center shadow-md ${
            isSubmitting ? "opacity-70" : ""
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base tracking-wide">
              SIGN IN
            </Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <Modal
        visible={isForgotOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsForgotOpen(false)}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-vistaNavy text-xl font-bold mb-2">
              Reset Password
            </Text>
            {resetStep === "email" ? (
              <>
                <Text className="text-gray-500 mb-5">
                  Enter your account email and we’ll send a verification code.
                </Text>
                <TextInput
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  placeholder="Email address"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-5"
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
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-3"
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
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-5 text-gray-700"
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
                  className="border border-gray-200 rounded-xl px-4 h-12 mb-5 text-gray-700"
                />
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setResetStep("email")}
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
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}
