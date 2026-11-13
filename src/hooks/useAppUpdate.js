import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import {
  cleanupOldApks,
  downloadRelease,
  fetchLatestRelease,
  installApk,
} from "../services/appUpdateService";

const CHECK_INTERVAL = 30 * 60 * 1000;

export default function useAppUpdate(enabled) {
  const [state, setState] = useState({
    phase: "idle",
    release: null,
    progress: 0,
    error: "",
    file: null,
  });
  const last = useRef(0);
  const busy = useRef(false);

  const check = useCallback(async (force = false) => {
    if (!enabled || busy.current || (!force && Date.now() - last.current < CHECK_INTERVAL))
      return null;
    last.current = Date.now();
    try {
      const release = await fetchLatestRelease();
      if (!release) {
        cleanupOldApks();
        return null;
      }
      setState((s) =>
        s.phase === "idle" || s.phase === "error"
          ? { ...s, phase: "available", release, error: "" }
          : s,
      );
      return release;
    } catch (error) {
      /* offline: try again later */
      if (force) throw error;
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener(
      "change",
      (s) => s === "active" && check(),
    );
    return () => sub.remove();
  }, [check]);

  const download = useCallback(async () => {
    if (busy.current || !state.release) return;
    busy.current = true;
    setState((s) => ({ ...s, phase: "downloading", progress: 0, error: "" }));
    try {
      const file = await downloadRelease(state.release, (progress) =>
        setState((s) => ({ ...s, progress })),
      );
      setState((s) => ({ ...s, phase: "ready", file }));
    } catch (e) {
      setState((s) => ({ ...s, phase: "error", error: e.message }));
    } finally {
      busy.current = false;
    }
  }, [state.release]);

  const install = useCallback(async () => {
    try {
      await installApk(state.file);
    } catch (e) {
      setState((s) => ({
        ...s,
        phase: "error",
        error: e.message || "Could not open the installer.",
      }));
    }
  }, [state.file]);

  const dismiss = () => setState((s) => ({ ...s, phase: "idle" }));
  return { ...state, download, install, dismiss, checkNow: () => check(true) };
}
