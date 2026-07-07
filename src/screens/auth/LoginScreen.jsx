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
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
            secureTextEntry
            className="text-gray-700"
          />
        </View>

        {errorMessage ? (
          <Text className="text-red-600 text-sm font-semibold mb-3 px-2">
            {errorMessage}
          </Text>
        ) : null}

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
    </ImageBackground>
  );
}