import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleSignIn = () => {
    // TODO: replace with real API call via src/services.
    // Temporary staff-only redirect for static dashboard work.
    login({ email: email || "staff@vista.local" }, ROLES.STAFF);
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
            keyboardType="email-address"
            className="text-gray-700"
          />
        </View>

        <View className="bg-white/90 rounded-full border border-vistaOrange px-5 py-4 mb-6">
          <TextInput
            placeholder="password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="text-gray-700"
          />
        </View>

        <TouchableOpacity
          onPress={handleSignIn}
          className="bg-vistaOrange rounded-full py-4 items-center shadow-md"
        >
          <Text className="text-white font-bold text-base tracking-wide">
            SIGN IN
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
