import { AppAlert as Alert } from "../common/AppDialog";
import { useState } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../common/FontText";
import UserAvatar from "../common/UserAvatar";
import SubmissionStatusBadge from "./SubmissionStatusBadge";
import TicketBanner from "./TicketBanner";
import { safeWebUrl } from "./conversationPolicy.cjs";
import { colors, type, radii } from '../../theme/tokens';
import { visibleSubmissionDescription } from "../../utils/documentCode.cjs";
import AttachmentPreview from './AttachmentPreview';

async function openFile(value) {
  const url = safeWebUrl(value);
  if (!url) {
    Alert.alert("File unavailable", "A valid file link is not available.");
    return;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Could not open file", "Try again or contact OSA staff.");
  }
}

export function SubmissionAttachmentRow({ name, url, document, history = false, external = false }) {
  const [preview, setPreview] = useState(false);
  const file = document || { file_name: name, file_url: url };
  const ink = history ? colors.blue : colors.onBrand;
  return <>
    <TouchableOpacity
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={`${external ? 'Open' : 'Preview'} ${name}`}
      onPress={() => external ? openFile(url) : setPreview(true)}
      style={[styles.file, history && { backgroundColor: colors.selectedSurface, borderRadius: radii.chip }]}
    >
      <Feather name="paperclip" size={20} color={ink} />
      <Text style={[styles.fileName, { color: ink }]}>{name}</Text>
      <Feather name={external ? 'external-link' : 'eye'} size={18} color={ink} />
    </TouchableOpacity>
    {!external ? <AttachmentPreview document={preview ? file : null} onClose={() => setPreview(false)} /> : null}
  </>;
}

export default function SubmissionTicket({
  submission,
  viewerRole,
  access,
  user,
  submitter,
  handler,
}) {
  const date = submission.submitted_at
    ? new Date(submission.submitted_at)
    : null;
  const description = visibleSubmissionDescription(submission.description);
  const identity = access.owner ? user : access.staff ? submitter : undefined;
  const roleLabel = { student: "Student", staff: "OSA Staff", admin: "Admin" }[
    identity?.role
  ];
  // The API currently withholds ALL files from students, even before approval.
  const files =
    access.staff && submission.status !== "rejected"
      ? (submission.documents || []).filter((doc) => doc.is_current !== false)
      : [];
  const archives =
    access.staff && submission.status === "approved"
      ? submission.drive_archives || []
      : [];
  return (
    <View style={styles.ticket}>
      <View style={styles.content}>
        <TicketBanner />
        <Text style={styles.category}>
          {[submission.category_name, submission.doc_type_name]
            .filter(Boolean)
            .join(" · ") || "Submission"}
        </Text>
        <Text style={styles.title}>
          {submission.title || "Untitled submission"}
        </Text>
        <View style={styles.meta}>
          <View style={styles.metaCell}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {date
                ? date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unavailable"}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>
              {date
                ? date.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Unavailable"}
            </Text>
          </View>
        </View>
        {handler?.changed_by_name ? (
          <View style={styles.handler}>
            <UserAvatar uri={handler.changed_by_image_url} size={24} />
            <Text style={styles.handlerName}>
              Handled by {handler.changed_by_name}
            </Text>
          </View>
        ) : null}
        {submission.org_name ? (
          <View style={styles.organization}>
            <Text style={styles.label}>Organization</Text>
            <Text style={styles.value}>{submission.org_name}</Text>
          </View>
        ) : null}
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        <View style={styles.profileSection}>
          <View style={styles.identity}>
            <UserAvatar uri={identity?.image_url} size={34} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name}>
                {submission.submitted_by_name || "Original submitter"}
              </Text>
              {submission.submitted_by_email ? (
                <Text style={styles.email}>
                  {submission.submitted_by_email}
                </Text>
              ) : null}
              <Text style={styles.role}>
                {roleLabel
                  ? `${roleLabel} · Original submitter`
                  : "Original submitter"}
              </Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <SubmissionStatusBadge status={submission.status} size="small" />
            {submission.priority_escalation ? (
              <Text style={styles.priority}>Priority</Text>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.tear}>
        <View style={[styles.cutout, { left: -10 }]} />
        <View style={[styles.cutout, { right: -10 }]} />
      </View>
      <View style={styles.strip}>
        {files.map((doc) => (
          <SubmissionAttachmentRow
            key={doc.document_id || doc.file_name}
            name={doc.file_name || "Attached document"}
            url={doc.file_url}
            document={doc}
          />
        ))}
        {archives.map((archive) => (
          <SubmissionAttachmentRow
            key={archive.archive_id}
            name={`Archived · ${archive.file_name}`}
            url={archive.drive_view_link}
            external
          />
        ))}
        {!files.length && !archives.length ? (
          <View style={styles.emptyFile}>
            <Feather name="file-text" size={20} color="#DCEBFF" />
            <Text style={styles.emptyText}>
              {access.staff
                ? "No digital attachment available. Physical files are handled by OSA."
                : "Physical submission · Digital documents are restricted to OSA staff."}
            </Text>
          </View>
        ) : null}
        {access.staff &&
        submission.status === "approved" &&
        !archives.length ? (
          <Text style={styles.emptyText}>No confirmed Drive archive yet.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colors.ticket,
    borderRadius: radii.card,
    marginBottom: 16,
    shadowColor: colors.navy,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  content: { padding: 12, gap: 6 },
  category: { color: colors.ticketText, fontSize: type.meta.fontSize, marginTop: 6 },
  title: { ...type.heading, color: "white", fontSize: type.navigationTitle.fontSize, lineHeight: type.navigationTitle.lineHeight },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 6 },
  metaCell: { flexGrow: 1, flexBasis: 115 },
  label: { color: colors.ticketMuted, fontSize: type.meta.fontSize },
  value: { color: "white", fontSize: type.field.fontSize, lineHeight: type.field.lineHeight },
  organization: { marginTop: 4 },
  description: { color: colors.ticketText, fontSize: type.field.fontSize, lineHeight: type.field.lineHeight },
  handler: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  handlerName: { ...type.meta, color: colors.ticketText, flex: 1 },
  profileSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF55",
    paddingTop: 12,
    marginTop: 6,
  },
  identity: {
    flexDirection: "row",
    flexGrow: 1,
    flexBasis: 180,
    minWidth: 0,
    gap: 10,
    alignItems: "center",
  },
  name: { fontFamily: "DMSans_700Bold", color: "white", fontSize: type.field.fontSize },
  email: { color: colors.ticketMuted, fontSize: type.meta.fontSize, lineHeight: type.meta.lineHeight },
  role: { color: colors.ticketMuted, fontSize: type.meta.fontSize, marginTop: 3 },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    flexShrink: 1,
  },
  priority: { color: colors.priorityOnTicket, fontSize: type.meta.fontSize, fontFamily: "DMSans_700Bold" },
  tear: {
    borderTopWidth: 1,
    borderColor: colors.ticketMuted,
    borderStyle: "dashed",
    marginTop: 4,
    height: 1,
  },
  cutout: {
    width: 20,
    height: 20,
    borderRadius: radii.chip,
    backgroundColor: colors.background,
    position: "absolute",
    top: -10,
  },
  strip: {
    padding: 12,
    gap: 8,
    backgroundColor: "#FFFFFF0D",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  file: {
    backgroundColor: "#FFFFFF22",
    borderRadius: radii.field,
    padding: 12,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fileName: { color: "white", flex: 1, fontSize: type.field.fontSize },
  emptyFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 3,
  },
  emptyText: {
    color: colors.ticketText,
    fontSize: type.meta.fontSize,
    lineHeight: type.meta.lineHeight,
    flexShrink: 1,
  },
});
