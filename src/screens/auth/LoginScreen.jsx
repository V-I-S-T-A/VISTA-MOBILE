import { type, colors, space, radii, sizes, loginLayout } from '../../theme/tokens';
import TextInput from '../../components/common/AppInput';
import AppBottomSheet from '../../components/common/AppBottomSheet';
import { AppAlert as Alert } from '../../components/common/AppDialog';
import { Text } from '../../components/common/FontText';
import { View, TouchableOpacity, Image, ActivityIndicator, useWindowDimensions, RefreshControl, StyleSheet } from 'react-native';
import { useScreenRefresh } from '../../hooks/useScreenRefresh';
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authService } from "../../services/authService";
import VistaProcessing from '../../components/common/VistaProcessing';
import AppButton from '../../components/common/AppButton';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function LoginScreen() {
  const { refreshing, onRefresh } = useScreenRefresh([]);
  const resetTrigger = useRef(null);
  const passwordInput = useRef(null);
  const { height, width } = useWindowDimensions();
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
    <View style={styles.screen}>
        <KeyboardAwareScrollView
          alwaysBounceVertical overScrollMode="always"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          bottomOffset={space.lg}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingTop: Math.max(insets.top, space.lg) }}
        >
          <View style={[styles.hero, { minHeight: Math.min(loginLayout.heroMaxHeight, Math.max(loginLayout.heroMinHeight, height * loginLayout.heroRatio)), paddingLeft: Math.max(insets.left, space.xxl), paddingRight: Math.max(insets.right, space.xxl) }]}>
            <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.artwork}>
              <View style={[styles.dot, styles.dotLeft]} /><View style={[styles.dot, styles.dotRight]} />
              <Image source={require('../../assets/login-students.png')} resizeMode="contain" accessibilityIgnoresInvertColors
                style={{ width: Math.min(loginLayout.artWidth, width - space.xxxl * 2), height: loginLayout.artHeight }} />
            </View>
            <Text accessibilityRole="header" style={styles.welcome}>Let’s get you{'\n'}signed in!</Text>
          </View>
          <View style={[styles.panel, { paddingLeft: Math.max(insets.left, space.xxl), paddingRight: Math.max(insets.right, space.xxl), paddingBottom: Math.max(insets.bottom, space.xxl) }]}>
          <View style={styles.form}>
            <View style={styles.brand}>
              <Image source={require('../../assets/logo.webp')} style={styles.logo} resizeMode="contain" accessibilityLabel="VISTA Logo" />
              <Text style={styles.brandName}>VISTA</Text>
            </View>

        <Text style={styles.label}>Email address</Text>
          <TextInput
            placeholder="youremail@gmail.com"
            accessibilityLabel="Email address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passwordInput.current?.focus()}
            blurOnSubmit={false}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={styles.emailInput}
          />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordField}>
          <TextInput
            placeholder="password"
            ref={passwordInput}
            accessibilityLabel="Password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => { if (!isSubmitting) handleSignIn(); }}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={styles.passwordInput}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            accessibilityRole="button"
            style={styles.visibilityButton}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={sizes.icon}
              color={colors.muted}
            />
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text selectable accessibilityRole="alert" style={styles.error}>
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          ref={resetTrigger}
          onPress={() => {
            setResetEmail(email);
            setIsForgotOpen(true);
          }}
          accessibilityRole="button"
          style={styles.forgotButton}
        >
          <Text style={styles.forgotText}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <AppButton label="Sign in" variant="accent" onPress={handleSignIn} busy={isSubmitting} />
          </View>
          </View>
        </KeyboardAwareScrollView>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.blue },
  hero: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xl, gap: space.md },
  artwork: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: loginLayout.decorationSize, height: loginLayout.decorationSize, borderRadius: radii.pill },
  dotLeft: { left: -space.lg, top: space.xxl, backgroundColor: colors.yellow },
  dotRight: { right: -space.sm, bottom: space.xxl, width: space.sm, height: space.sm, backgroundColor: colors.onBrand },
  welcome: { ...type.display, color: colors.onBrand, textAlign: 'center' },
  panel: { flexGrow: 1, backgroundColor: colors.surface, borderTopLeftRadius: space.xxxl, borderTopRightRadius: space.xxxl, borderCurve: 'continuous', paddingTop: space.xxl },
  form: { width: '100%', maxWidth: loginLayout.formWidth, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, marginBottom: space.xl },
  logo: { width: loginLayout.logoSize, height: loginLayout.logoSize },
  brandName: { ...type.display, color: colors.blue },
  label: { ...type.label, color: colors.navy, marginBottom: space.sm },
  emailInput: { minHeight: loginLayout.fieldHeight, marginBottom: space.lg },
  passwordField: { flexDirection: 'row', alignItems: 'center', minHeight: loginLayout.fieldHeight, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border, borderRadius: radii.field, borderCurve: 'continuous' },
  passwordInput: { flex: 1, minWidth: 0, minHeight: loginLayout.fieldHeight, borderWidth: 0, backgroundColor: 'transparent' },
  visibilityButton: { width: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  error: { ...type.label, color: colors.danger, marginTop: space.md },
  forgotButton: { alignSelf: 'center', minHeight: sizes.touch, justifyContent: 'center', marginVertical: space.sm },
  forgotText: { ...type.button, color: colors.navy },
});
