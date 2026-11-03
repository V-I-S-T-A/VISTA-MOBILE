import "./global.css";
import { useRef } from 'react';
import NotificationRuntime from './src/components/common/NotificationRuntime';
import { Text, TextInput } from "react-native";
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
import { DialogProvider } from './src/components/common/AppDialog';
import VistaLoader from './src/components/common/VistaLoader';
import { OverlayProvider } from './src/components/common/OverlayPortal';
import * as NativeSplash from "expo-splash-screen";

// Hand off the OS splash only after the loader or routed content has laid out.
NativeSplash.preventAutoHideAsync().catch(() => {});
NativeSplash.setOptions({ duration: 0, fade: false });

let globalFontApplied = false;

export default function App() {
  const navigationRef = useRef(null);
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
     return null;
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
            <NavigationContainer ref={navigationRef}>
              <NotificationRuntime navigationRef={navigationRef} />
              <StatusBar style="dark" />
              <OverlayProvider><DialogProvider><RootNavigator /></DialogProvider></OverlayProvider>
            </NavigationContainer>
          </AuthProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
