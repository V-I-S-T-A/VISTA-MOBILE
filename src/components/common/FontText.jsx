import { forwardRef } from "react";
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from "react-native";
import { cssInterop } from "nativewind";
import { type } from '../../theme/tokens';

const weights = { normal: type.regular, bold: type.bold, '100': 'DMSans_100Thin', '200': 'DMSans_200ExtraLight', '300': 'DMSans_300Light', '400': type.regular, '500': type.medium, '600': 'DMSans_600SemiBold', '700': type.bold, '800': 'DMSans_800ExtraBold', '900': 'DMSans_900Black' };

// Static font assets carry their own weight. Resolve NativeWind's weight classes
// to the loaded face instead of asking Android/iOS to synthesize a second weight.
export function textStyle(style, variant) {
  const resolved = StyleSheet.flatten([{ fontFamily: type.regular, fontSize: type.body.fontSize }, typeof type[variant] === 'object' && type[variant], style]) || {};
  const family = resolved.fontFamily;
  if ((!family || family === type.regular) && weights[resolved.fontWeight]) resolved.fontFamily = weights[resolved.fontWeight];
  if (resolved.fontFamily?.startsWith('DMSans_')) resolved.fontWeight = 'normal';
  return resolved;
}

const withDMSans = Component => forwardRef(({ style, variant, ...props }, ref) => (
  <Component {...props} ref={ref} style={textStyle(style, variant)} />
));

export const Text = withDMSans(NativeText);
export const TextInput = withDMSans(NativeTextInput);

cssInterop(Text, { className: "style" });
cssInterop(TextInput, { className: "style" });
