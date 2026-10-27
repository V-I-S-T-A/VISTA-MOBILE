import "./global.css";
import { Image, Text, TextInput, View } from "react-native";
import { useFonts } from "@expo-google-fonts/dm-sans";
import {
  DMSans_100Thin,
  DMSans_200ExtraLight,
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
  DMSans_900Black,
} from "@expo-google-fonts/dm-sans";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/lib/queryClient";
import { ToastProvider } from "./src/components/common/Toast";
import RootNavigator from "./src/navigation/RootNavigator";
import SplashScreen from "./src/screens/SplashScreen";

let globalFontApplied = false;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_100Thin,
    DMSans_200ExtraLight,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    DMSans_900Black,
  });

   if (!fontsLoaded && !fontError) {
     return <SplashScreen />;
   }

  if (fontsLoaded && !globalFontApplied) {
    for (const Component of [Text, TextInput]) {
      Component.defaultProps = {
        ...Component.defaultProps,
        style: [
          Component.defaultProps?.style,
          { fontFamily: "DMSans_400Regular" },
        ],
      };
    }
    globalFontApplied = true;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
