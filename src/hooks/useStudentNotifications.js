import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import { notificationService } from "../services/notificationService";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export function useNotifications() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const screenIsFocused = useIsFocused();
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState == null || AppState.currentState === "active",
  );
  const canViewNotifications = [ROLES.STUDENT, ROLES.STAFF, ROLES.ADMIN].includes(role);
  const queryKey = [...NOTIFICATIONS_QUERY_KEY, user?.user_id];

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const isActive = nextState === "active";
      setAppIsActive(isActive);
      if (isActive && canViewNotifications && screenIsFocused) {
        queryClient.invalidateQueries({
          queryKey: NOTIFICATIONS_QUERY_KEY,
        });
      }
    });
    return () => subscription.remove();
  }, [canViewNotifications, queryClient, screenIsFocused]);

  return useQuery({
    queryKey,
    queryFn: notificationService.getNotifications,
    enabled: canViewNotifications && appIsActive && screenIsFocused,
    staleTime: 15_000,
    retry: false,
    refetchInterval: canViewNotifications && appIsActive && screenIsFocused ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = [...NOTIFICATIONS_QUERY_KEY, user?.user_id];
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (_result, notificationId) => {
      queryClient.setQueryData(
        queryKey,
        (current) => {
          if (!current) return current;
          const wasUnread = current.results?.some(
            (item) =>
              item.notification_id === notificationId && !item.is_read,
          );
          return {
            ...current,
            unread_count: Math.max(
              0,
              (current.unread_count || 0) - (wasUnread ? 1 : 0),
            ),
            results: (current.results || []).map((item) =>
              item.notification_id === notificationId
                ? { ...item, is_read: true }
                : item,
            ),
          };
        },
      );
      queryClient.invalidateQueries({
        queryKey,
      });
    },
  });
}
