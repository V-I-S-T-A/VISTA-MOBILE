import { colors, radii, sizes, type, shadows, motion } from '../../theme/tokens';
import useVisibilityProgress from '../../hooks/useVisibilityProgress';
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
  const timers = useRef(new Map());
  const insets = useSafeAreaInsets();
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id)); timers.current.delete(id);
    setToasts(prev => prev.map(toast => toast.id === id ? { ...toast, dismissed: true } : toast));
  }, []);

  const show = useCallback(
    (message, variant = "info", duration = 3200, action = null) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, variant, action }]);
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
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
            onHidden={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onPress, onHidden }) {
  const opacity = useVisibilityProgress(!toast.dismissed, onHidden);
  const acted = useRef(false);

  const variant = VARIANTS[toast.variant] || VARIANTS.info;

  return (
    <Animated.View pointerEvents={toast.dismissed ? 'none' : 'auto'} accessibilityElementsHidden={!!toast.dismissed} importantForAccessibility={toast.dismissed ? 'no-hide-descendants' : 'auto'} style={{ opacity }}>
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
            disabled={!!toast.dismissed}
            accessibilityRole="button"
            onPress={() => {
              if (acted.current || toast.dismissed) return;
              acted.current = true;
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
