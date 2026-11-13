import { createContext, useContext, useEffect, useRef } from "react";
import { View } from "react-native";
import useAppUpdate from "../../hooks/useAppUpdate";
import { useAuth } from "../../context/AuthContext";
import AppBottomSheet from "./AppBottomSheet";
import AppButton from "./AppButton";
import { Text } from "./FontText";
import { useToast } from "./Toast";
import { colors, type } from "../../theme/tokens";

const UpdateContext = createContext(null);
export const useUpdateManager = () => useContext(UpdateContext);

export default function UpdateManager() {
  const { user } = useAuth();
  const u = useAppUpdate(!!user);
  const toast = useToast();
  const previousPhase = useRef(u.phase);
  const forced = u.release?.forced;
  const mb = u.release?.size_bytes
    ? ` (${(u.release.size_bytes / 1048576).toFixed(0)} MB)`
    : "";

  useEffect(() => {
    if (u.phase === "ready" && previousPhase.current === "downloading") {
      toast.showAction(
        "VISTA update downloaded. Install it when you're ready.",
        "Install",
        u.install,
        "success",
      );
    }
    previousPhase.current = u.phase;
  }, [u.phase, u.install, toast.showAction]);

  return (
    <UpdateContext.Provider value={{ checkNow: u.checkNow }}>
    <>
      <AppBottomSheet
        visible={
          u.phase === "available" || u.phase === "ready" || u.phase === "error"
        }
        title={
          u.phase === "ready" ? "Update ready to install" : "Update available"
        }
        dismissible={!forced}
        onClose={u.dismiss}
      >
        <Text style={{ ...type.body, color: colors.text }}>
          {u.phase === "ready"
            ? `VISTA ${u.release.version_name} has been downloaded. Android will ask you to confirm the install.`
            : `VISTA ${u.release?.version_name}${mb} is available.${forced ? " This update is required to continue." : ""}`}
        </Text>
        {u.release?.notes ? (
          <Text style={{ ...type.meta, color: colors.muted }}>
            {u.release.notes}
          </Text>
        ) : null}
        {u.error ? (
          <Text
            accessibilityRole="alert"
            style={{ ...type.meta, color: colors.danger }}
          >
            {u.error}
          </Text>
        ) : null}
        <AppButton
          label={
            u.phase === "ready"
              ? "Install now"
              : u.phase === "error"
                ? "Retry download"
                : "Download in background"
          }
          onPress={u.phase === "ready" ? u.install : u.download}
        />
        {!forced ? (
          <AppButton label="Later" variant="secondary" onPress={u.dismiss} />
        ) : null}
      </AppBottomSheet>

      {u.phase === "downloading" ? (
        <View
          accessibilityRole="progressbar"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "#DFE6EE",
          }}
        >
          <View
            style={{
              width: `${Math.round(u.progress * 100)}%`,
              height: 4,
              backgroundColor: colors.yellow,
            }}
          />
        </View>
      ) : null}
    </>
    </UpdateContext.Provider>
  );
}
