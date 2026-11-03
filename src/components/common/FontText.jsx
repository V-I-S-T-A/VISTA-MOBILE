import { forwardRef } from "react";
import { Text as NativeText, TextInput as NativeTextInput } from "react-native";
import { cssInterop } from "nativewind";
import { type } from '../../theme/tokens';

const withDMSans = (Component) =>
  forwardRef(({ style, ...props }, ref) => (
    <Component
      {...props}
      ref={ref}
      style={[{ fontFamily: type.regular, fontSize: type.body.fontSize }, style]}
    />
  ));

export const Text = withDMSans(NativeText);
export const TextInput = withDMSans(NativeTextInput);

cssInterop(Text, { className: "style" });
cssInterop(TextInput, { className: "style" });
