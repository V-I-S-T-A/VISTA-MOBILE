import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import OnboardingScreen from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ onboarding, authenticated = false }) {
  return (
    <Stack.Navigator initialRouteName={onboarding && !onboarding.completed ? 'Onboarding' : 'Login'} screenOptions={{ headerShown: false, navigationBarHidden: true }}>
      <Stack.Screen name="Onboarding">
        {({ navigation }) => <OnboardingScreen onComplete={async () => {
          await onboarding.complete();
          // RootNavigator resumes the existing role dashboard for saved sessions.
          if (!authenticated) navigation.replace('Login');
        }} />}
      </Stack.Screen>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
