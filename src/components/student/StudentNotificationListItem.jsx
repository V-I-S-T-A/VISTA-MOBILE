import { useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../common/FontText";

const DEFAULT_AVATAR = require("../../assets/default_user.jpg");

function getStatus(status = "", type = "") {
  if (type === "drive_upload_pending") {
    return { label: "Uploading", color: "#1F5CAE", background: "#EDF4FF" };
  }
  if (type === "drive_upload_success") {
    return { label: "Uploaded", color: "#238453", background: "#EAF7EF" };
  }
  if (type === "drive_upload_error") {
    return { label: "Upload failed", color: "#A76500", background: "#FFF5DF" };
  }
  if (type === "submission_priority_changed") {
    return { label: "Priority", color: "#765700", background: "#FFF2BF" };
  }
  switch ((status || "").toLowerCase()) {
    case "approved":
      return { label: "Approved", color: "#238453", background: "#EAF7EF" };
    case "rejected":
    case "resubmission_required":
      return { label: "Returned", color: "#A76500", background: "#FFF5DF" };
    case "under_review":
      return { label: "In review", color: "#1F5CAE", background: "#EDF4FF" };
    default:
      return { label: "Pending", color: "#5D6878", background: "#F0F2F5" };
  }
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StudentNotificationListItem({ notification, onPress }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const status = getStatus(notification.submission_status, notification.type);
  const fallbackId = notification.submission_id?.slice(0, 8);
  const title = notification.submission_title ||
    (fallbackId ? `Submission ${fallbackId}` : "Submission update");
  const avatarSource = notification.actor_image_url && !avatarFailed
    ? { uri: notification.actor_image_url }
    : DEFAULT_AVATAR;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-start rounded-2xl border p-3 mb-3 ${notification.is_read ? "bg-white border-slate-200" : "bg-blue-50 border-blue-200"}`}
    >
      <Image
        source={avatarSource}
        onError={() => setAvatarFailed(true)}
        className="w-10 h-10 rounded-full bg-slate-200 mr-3"
      />
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text className="text-vistaNavy text-sm font-bold flex-1 mr-2" numberOfLines={2}>
            {title}
          </Text>
          {!notification.is_read ? (
            <View className="w-2 h-2 rounded-full bg-[#1f5cae] mt-1" />
          ) : null}
        </View>
        {notification.actor_name ? (
          <Text className="text-slate-500 text-[11px] mt-1" numberOfLines={1}>
            Updated by {notification.actor_name}
          </Text>
        ) : null}
        <View className="flex-row items-center flex-wrap mt-2">
          <View className="rounded-full px-2 py-1 mr-2 mb-1" style={{ backgroundColor: status.background }}>
            <Text className="text-[10px] font-bold" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
          <Text className="text-slate-400 text-[10px] mb-1">
            {formatTime(notification.created_at)}
          </Text>
        </View>
        <Text className="text-slate-600 text-xs leading-5 mt-1">
          {notification.message || "There is an update on your submission."}
        </Text>
        <Feather name="chevron-right" size={16} color="#94A3B8" style={{ position: "absolute", right: 0, bottom: 0 }} />
      </View>
    </TouchableOpacity>
  );
}
