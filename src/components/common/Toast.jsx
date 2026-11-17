import { colors, radii, sizes, type, shadows, motion } from '../../theme/tokens';
import useReducedMotion from '../../hooks/useReducedMotion';
import { Text } from "./FontText";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, TouchableOpacity, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { bg: colors.success, icon: "check-circle" },
  error: { bg: colors.danger, icon: "alert-circle" },
  info: { bg: colors.blue, icon: "info" },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, variant = "info", duration = 3200, action = null) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, variant, action }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const showAction = useCallback(
    (message, label, onPress, variant = "info", duration = 10000) =>
      show(message, variant, duration, { label, onPress }),
    [show],
  );

  const api = {
    show,
    showAction,
    success: (message, duration) => show(message, "success", duration),
    error: (message, duration) => show(message, "error", duration ?? 4200),
    info: (message, duration) => show(message, "info", duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View
        pointerEvents="box-none"
        style={[styles.host, { top: insets.top + 8 }]}
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onPress={() => dismiss(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onPress }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) opacity.setValue(1);
    else Animated.timing(opacity, {
      toValue: 1,
      duration: motion.fast,
      useNativeDriver: true,
    }).start();
    return () => opacity.stopAnimation();
  }, [opacity, reducedMotion]);

  const variant = VARIANTS[toast.variant] || VARIANTS.info;

  return (
    <Animated.View style={{ opacity }}>
      <View
        accessibilityLiveRegion="polite"
        onTouchEnd={toast.action ? undefined : onPress}
        style={[styles.toast, { backgroundColor: variant.bg }]}
      >
        <Feather name={variant.icon} size={16} color="white" />
        <Text style={styles.text} numberOfLines={3}>
          {toast.message}
        </Text>
        {toast.action ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              onPress();
              toast.action.onPress();
            }}
            activeOpacity={motion.pressedOpacity}
            style={styles.action}
          >
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.field,
    borderCurve: 'continuous',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    ...shadows.raised,
  },
  text: {
    ...type.button,
    color: colors.onBrand,
    marginLeft: 8,
    flex: 1,
  },
  action: {
    minHeight: sizes.touch,
    justifyContent: 'center',
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionText: {
    ...type.button,
    color: colors.onBrand,
  },
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
