import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import SelectField from "./SelectField";
import { scanDocument, pickDocumentFile } from "../../utils/documentScan";
import {
  useDriveConnection,
  useDriveFolderPreview,
  useDriveFolders,
  useDriveUpload,
} from "../../hooks/useDrive";

export default function DriveArchiveCard({ submission }) {
  const navigation = useNavigation();
  const [useAutoFolder, setUseAutoFolder] = useState(true);
  const [manualFolder, setManualFolder] = useState(null);
  const [fileName, setFileName] = useState(submission?.title || "");
  const [pendingFile, setPendingFile] = useState(null);

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

  useEffect(() => {
    if (submission?.title) setFileName(submission.title);
  }, [submission?.title]);

  if ((submission?.status || "").toLowerCase() !== "approved") return null;

  // --- Connection not ready: show a guard instead of the upload UI -----
  if (loadingConnection) {
    return (
      <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm items-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (connectionError || !isConnected || !hasFolder) {
    return (
      <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
        <View className="flex-row items-center mb-3">
          <View className="bg-[#fff4e5] w-10 h-10 rounded-xl items-center justify-center mr-3">
            <Feather name="alert-triangle" size={18} color="#b45309" />
          </View>
          <Text className="text-vistaNavy font-extrabold text-sm flex-1">
            Google Drive not connected
          </Text>
        </View>
        <Text className="text-gray-500 text-xs leading-5 mb-4">
          {connectionError
            ? "Could not check your Google Drive connection. Please try again."
            : !isConnected
              ? "Connect your Google account to archive approved documents to Drive."
              : "Choose a Drive folder in Google Drive Sync before archiving documents."}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("GDriveSync")}
          className="bg-vistaNavy rounded-xl py-3 items-center justify-center"
        >
          <Text className="text-white font-extrabold text-sm">
            Go to Google Drive Sync
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Connected: normal upload UI --------------------------------------
  const folderOptions = manualFolders.map((f) => ({ id: f.id, label: f.name }));

  const handlePick = (source) => async () => {
    const file =
      source === "camera" ? await scanDocument() : await pickDocumentFile();
    if (file) setPendingFile(file);
  };

  const handleUpload = () => {
    if (!pendingFile) {
      Alert.alert(
        "No document selected",
        "Take a photo or choose a file first.",
      );
      return;
    }
    if (!useAutoFolder && !manualFolder) {
      Alert.alert(
        "Choose a folder",
        "Select a Drive folder or switch to automated folders.",
      );
      return;
    }
    uploadMutation.mutate(
      {
        submissionId: submission.submission_id,
        file: pendingFile,
        fileName: fileName.trim() || submission.title,
        useAutoFolder,
        folderId: useAutoFolder ? undefined : manualFolder?.id,
      },
      {
        onSuccess: () => {
          Alert.alert("Archived", "The document was uploaded to Google Drive.");
          setPendingFile(null);
        },
        onError: (error) =>
          Alert.alert("Upload failed", error.message || "Please try again."),
      },
    );
  };

  return (
    <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
      <View className="flex-row items-center mb-4">
        <View className="bg-[#eef2ff] w-10 h-10 rounded-xl items-center justify-center mr-3">
          <Feather name="hard-drive" size={18} color="#1e5aa0" />
        </View>
        <Text className="text-vistaNavy font-extrabold text-sm">
          Archive to Google Drive
        </Text>
      </View>

      <View className="flex-row mb-4">
        <TouchableOpacity
          onPress={handlePick("camera")}
          className="flex-1 border border-slate-200 rounded-xl py-3 items-center mr-2"
        >
          <Feather name="camera" size={20} color="#1e5aa0" />
          <Text className="text-vistaNavy text-xs font-bold mt-1">
            Take Photo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePick("file")}
          className="flex-1 border border-slate-200 rounded-xl py-3 items-center ml-2"
        >
          <Feather name="upload" size={20} color="#1e5aa0" />
          <Text className="text-vistaNavy text-xs font-bold mt-1">
            Upload File
          </Text>
        </TouchableOpacity>
      </View>

      {pendingFile ? (
        <View className="bg-slate-50 rounded-lg px-3 py-2 mb-4 flex-row items-center justify-between">
          <Text
            className="text-vistaNavy text-xs font-semibold flex-1"
            numberOfLines={1}
          >
            {pendingFile.name}
          </Text>
          <TouchableOpacity onPress={() => setPendingFile(null)}>
            <Feather name="x" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      ) : null}

      <Text className="text-vistaNavy text-xs font-extrabold mb-2">
        FILE NAME
      </Text>
      <TextInput
        value={fileName}
        onChangeText={setFileName}
        placeholder="Document name"
        placeholderTextColor="#94A3B8"
        className="h-10 border border-slate-200 rounded-lg px-3 mb-4 text-xs font-semibold text-vistaNavy"
      />

      <View className="flex-row mb-3">
        <TouchableOpacity
          onPress={() => setUseAutoFolder(true)}
          className={`flex-1 rounded-lg py-2 items-center mr-2 ${
            useAutoFolder ? "bg-vistaNavy" : "bg-slate-100"
          }`}
        >
          <Text
            className={`text-xs font-bold ${useAutoFolder ? "text-white" : "text-slate-500"}`}
          >
            Automated Folder
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setUseAutoFolder(false)}
          className={`flex-1 rounded-lg py-2 items-center ml-2 ${
            !useAutoFolder ? "bg-vistaNavy" : "bg-slate-100"
          }`}
        >
          <Text
            className={`text-xs font-bold ${!useAutoFolder ? "text-white" : "text-slate-500"}`}
          >
            Choose Folder
          </Text>
        </TouchableOpacity>
      </View>

      {useAutoFolder ? (
        <View className="bg-slate-50 rounded-lg p-3 mb-4">
          {loadingPreview ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text className="text-slate-500 text-xs font-semibold">
              {(folderPreview?.path_segments || []).join(" › ") ||
                "Academic Year › Organization › Title"}
            </Text>
          )}
        </View>
      ) : (
        <View className="mb-4">
          <SelectField
            label="DRIVE FOLDER"
            placeholder="Select a folder..."
            value={manualFolder}
            options={folderOptions}
            isLoading={loadingFolders}
            onChange={setManualFolder}
          />
        </View>
      )}

      <TouchableOpacity
        onPress={handleUpload}
        disabled={uploadMutation.isPending}
        className={`bg-[#FFC342] rounded-xl py-3.5 items-center justify-center ${
          uploadMutation.isPending ? "opacity-70" : ""
        }`}
      >
        {uploadMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-extrabold text-sm">
            Archive Document
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
