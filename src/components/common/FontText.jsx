import { forwardRef } from "react";
import { Text as NativeText, TextInput as NativeTextInput } from "react-native";
import { cssInterop } from "nativewind";

const withDMSans = (Component) =>
  forwardRef(({ style, ...props }, ref) => (
    <Component
      {...props}
      ref={ref}
      style={[{ fontFamily: "DMSans_400Regular" }, style]}
    />
  ));

export const Text = withDMSans(NativeText);
export const TextInput = withDMSans(NativeTextInput);

cssInterop(Text, { className: "style" });
cssInterop(TextInput, { className: "style" });
