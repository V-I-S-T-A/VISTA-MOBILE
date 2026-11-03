import TextInput from '../common/AppInput';
import { surfaces } from "../../theme/layout";
import { Text } from '../common/FontText';
import { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import SelectField from "./SelectField";
import { scanDocument, pickDocumentFile } from "../../utils/documentScan";
import {
  useDriveConnection,
  useDriveFolderPreview,
  useDriveFolders,
  useDriveUpload,
  useDriveUploadStatus,
} from "../../hooks/useDrive";
import { useToast } from "../common/Toast";
import { DriveSkeleton, Skeleton } from '../common/Skeleton';
import AppButton from '../common/AppButton';
import { colors, radii, reviewControls } from '../../theme/tokens';
import VistaProcessing from '../common/VistaProcessing';

export default function DriveArchiveCard({ submission }) {
  const navigation = useNavigation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [useAutoFolder, setUseAutoFolder] = useState(true);
  const [manualFolder, setManualFolder] = useState(null);
  const [fileName, setFileName] = useState(submission?.title || "");
  const [fileSelection, setFileSelection] = useState({ start: 0, end: 0 });
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadKind, setUploadKind] = useState("approved");
  const [activeTaskId, setActiveTaskId] = useState(null);

  const {
    data: connection,
    isLoading: loadingConnection,
    isError: connectionError,
  } = useDriveConnection();
  const isConnected = !!connection?.connected;
  const hasFolder = isConnected && !!connection?.folder_id;

  const { data: folderPreview, isLoading: loadingPreview } =
    useDriveFolderPreview(isConnected ? submission?.submission_id : undefined);
  const { data: manualFolders = [], isLoading: loadingFolders } =
    useDriveFolders();
  const uploadMutation = useDriveUpload();

  // By the time uploadMutation resolves, the file has only reached OUR
  // server -- the actual Drive upload runs in the background. This just
  // polls for the result so we can toast it, without blocking anything.
  const { data: uploadStatus } = useDriveUploadStatus(activeTaskId);

  useEffect(() => {
    if (!activeTaskId || !uploadStatus || uploadStatus.status === "pending") {
      return;
    }

    if (uploadStatus.status === "success") {
      toast.success(
        uploadStatus.detail || "Document archived to Google Drive.",
      );
      queryClient.invalidateQueries({
        queryKey: ["submissions", submission?.submission_id],
      });
    } else if (uploadStatus.code === "drive_reauth_required") {
      toast.error("Your Google Drive connection expired. Please reconnect it.");
      queryClient.invalidateQueries({ queryKey: ["drive", "connection"] });
    } else {
      toast.error(uploadStatus.detail || "The upload to Google Drive failed.");
    }

    setActiveTaskId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskId, uploadStatus]);

  useEffect(() => {
    if (submission?.title) setFileName(submission.title);
  }, [submission?.title]);

  if ((submission?.status || "").toLowerCase() !== "approved") return null;

  if (loadingConnection) {
    return (
        <DriveSkeleton />
    );
  }

  if (connectionError || !isConnected || !hasFolder) {
    return (
      <View className="bg-white rounded-3xl p-2 mb-2 " style={surfaces.card}>
        <View className="flex-row items-center mb-3">
          <View className="bg-[#fff4e5] w-10 min-h-[44px] rounded-xl items-center justify-center mr-3">
            <Feather name="alert-triangle" size={18} color="#b45309" />
          </View>
          <Text className="text-vistaNavy font-medium text-sm flex-1">
            Google Drive not connected
          </Text>
        </View>
        <Text className="text-gray-500 text-xs leading-5 mb-2">
          {connectionError
            ? "Could not check your Google Drive connection. Please try again."
            : !isConnected
              ? "Connect your Google account to archive approved documents to Drive."
              : "Choose a Drive folder in Google Drive Sync before archiving documents."}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("GDriveSync")}
          className="bg-vistaNavy rounded-xl min-h-[48px] py-1 flex-row justify-center items-center gap-1 justify-center"
        >
          <Text className="text-white font-medium text-[13px]">
            Go to Google Drive Sync
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const folderOptions = manualFolders.map((f) => ({ id: f.id, label: f.name }));

  const isAccomplishmentReport = !!submission?.is_accomplishment_report;
  const folderPathSegments = folderPreview?.path_segments || [];
  const destinationPathSegments =
    uploadKind === "report" &&
    folderPathSegments[folderPathSegments.length - 1] === "Approved"
      ? folderPathSegments.slice(0, -1)
      : folderPathSegments;
  const handlePick = (source) => async () => {
    const file =
      source === "camera" ? await scanDocument() : await pickDocumentFile();
    if (file) setPendingFile(file);
  };

  const handleUpload = () => {
    if (!pendingFile) {
      toast.error("Take a photo or choose a file first.");
      return;
    }
    if (!useAutoFolder && !manualFolder) {
      toast.error("Select a Drive folder or switch to automated folders.");
      return;
    }

    uploadMutation.mutate(
      {
        submissionId: submission.submission_id,
        file: pendingFile,
        fileName: fileName.trim() || submission.title,
        useAutoFolder,
        folderId: useAutoFolder ? undefined : manualFolder?.id,
        uploadKind,
      },
      {
        onSuccess: (data) => {
          toast.info(
            "Upload started — you can keep working, we'll let you know when it's done.",
          );
          setActiveTaskId(data.task_id);
          setPendingFile(null);
        },
        onError: (error) => {
          if (error.code === "drive_reauth_required") {
            toast.error(
              "Your Google Drive connection expired. Please reconnect it.",
            );
            queryClient.invalidateQueries({
              queryKey: ["drive", "connection"],
            });
          } else {
            toast.error(error.message || "Please try again.");
          }
        },
      },
    );
  };

  return (
    <View style={[surfaces.card, styles.panel]}>
      <View style={styles.headingRow}><Feather name="hard-drive" size={reviewControls.icon} color={colors.blue} /><Text style={styles.heading}>Archive to Google Drive</Text></View>
      <View style={styles.actions}>
        <ArchiveAction label="Take Photo" icon="camera" onPress={handlePick("camera")} />
        <ArchiveAction label="Upload File" icon="upload" onPress={handlePick("file")} />
      </View>
      {isAccomplishmentReport ? <View style={styles.group}>
        <Text style={styles.label}>File destination</Text>
        <View style={styles.actions}>
          <ArchiveAction segment label="Approved copy" selected={uploadKind === 'approved'} disabled={!!activeTaskId || uploadMutation.isPending} onPress={() => setUploadKind('approved')} />
          <ArchiveAction segment label="Accomplishment Report" selected={uploadKind === 'report'} disabled={!!activeTaskId || uploadMutation.isPending} onPress={() => setUploadKind('report')} />
        </View>
        <Text style={styles.support}>{uploadKind === 'approved' ? 'Uploads into the Approved subfolder.' : 'Uploads into the Accomplishment Report folder.'}</Text>
      </View> : null}
      {pendingFile ? <View style={styles.fileRow}>
        <Text style={[styles.support, { flex: 1 }]} numberOfLines={1}>{pendingFile.name}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove selected file" style={styles.remove} onPress={() => setPendingFile(null)}><Feather name="x" size={reviewControls.icon} color={colors.muted} /></TouchableOpacity>
      </View> : null}
      {activeTaskId ? <View style={styles.fileRow}><ActivityIndicator size="small" /><Text style={[styles.support, { flex: 1 }]}>{uploadKind === 'report' ? 'Archiving the Accomplishment Report in the background.' : 'Archiving the approved copy in the background — feel free to keep working.'}</Text></View> : null}
      <View style={styles.group}>
        <Text style={styles.label}>File name</Text>
        <TextInput size="compact" accessibilityLabel="File name" value={fileName} onChangeText={setFileName}
          selection={fileSelection} onFocus={() => setFileSelection(undefined)} onBlur={() => setFileSelection({ start: 0, end: 0 })}
          placeholder="Document name" />
      </View>
      <View style={styles.actions}>
        <ArchiveAction segment label="Automated Folder" selected={useAutoFolder} onPress={() => setUseAutoFolder(true)} />
        <ArchiveAction segment label="Choose Folder" selected={!useAutoFolder} onPress={() => setUseAutoFolder(false)} />
      </View>
      {useAutoFolder ? <View style={styles.preview}>{loadingPreview ? <Skeleton height={14} /> : <Text style={styles.support}>{destinationPathSegments.join(' › ') || 'Academic Year › Organization › Title'}</Text>}</View> :
        <SelectField size="compact" style={{ marginBottom: 0 }} label="Drive folder" placeholder="Select a folder..." value={manualFolder} options={folderOptions} isLoading={loadingFolders} onChange={setManualFolder} />}
      <AppButton size="compact" variant="accent" label={uploadKind === 'report' ? 'Archive Accomplishment Report' : 'Archive Approved Copy'} onPress={handleUpload} busy={uploadMutation.isPending} />
      <VistaProcessing visible={uploadMutation.isPending} message="Preparing your Drive upload…" />
    </View>
  );
}

function ArchiveAction({ label, icon, segment = false, selected, disabled, onPress }) {
  return <AppButton size="compact" label={label} variant="secondary" onPress={onPress} disabled={disabled}
    accessibilityRole={segment ? 'radio' : 'button'} accessibilityState={{ disabled: !!disabled, ...(segment ? { checked: !!selected } : {}) }}
    style={{ flex: 1 }} surfaceStyle={[styles.actionSurface, segment && styles.segment, selected && styles.selected]}>
    <View style={styles.actionContent}>{icon ? <Feather name={icon} size={reviewControls.icon} color={colors.blue} /> : null}<Text style={[styles.actionLabel, selected && { color: colors.blue }]}>{label}</Text></View>
  </AppButton>;
}
const styles = StyleSheet.create({
  panel: { padding: reviewControls.padding, gap: 0, marginBottom: reviewControls.gap },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { ...reviewControls.heading, color: colors.text, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 8 }, group: { gap: 0 },
  label: { ...reviewControls.label, color: colors.text, marginTop: 4 },
  support: { ...reviewControls.label, fontFamily: 'DMSans_400Regular', lineHeight: 14, color: colors.muted },
  actionSurface: { minHeight: reviewControls.attachmentHeight, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field },
  actionContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionLabel: { ...reviewControls.action, color: colors.text, textAlign: 'center', flexShrink: 1 },
  segment: { minHeight: reviewControls.segmentHeight, borderRadius: radii.chip },
  selected: { backgroundColor: colors.selectedSurface, borderColor: colors.blue },
  preview: { marginBottom: 4, padding: 8, borderRadius: radii.chip, backgroundColor: colors.field },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.field, borderRadius: radii.chip, paddingHorizontal: 8 },
  remove: { minWidth: reviewControls.touch, minHeight: reviewControls.touch, alignItems: 'center', justifyContent: 'center' },
});
