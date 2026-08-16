import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import {
  useDriveConnection,
  useDriveAuthStart,
  useDriveFolders,
  useSelectDriveFolder,
  useCreateDriveFolder,
  useDisconnectDrive,
} from "../../../hooks/useDrive";
import { runDriveAuthSession } from "../../../utils/driveAuth";

export default function GDriveSyncLoginCard() {
  const {
    data: connection,
    isLoading: loadingConnection,
    refetch,
  } = useDriveConnection();
  const authStart = useDriveAuthStart();
  const disconnectMutation = useDisconnectDrive();
  const selectFolderMutation = useSelectDriveFolder();
  const createFolderMutation = useCreateDriveFolder();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  const { data: folders = [], isLoading: loadingFolders } =
    useDriveFolders(folderSearch);

  const isConnected = !!connection?.connected;
  const hasFolder = isConnected && !!connection?.folder_id;

  const handleSignIn = async () => {
    setIsAuthorizing(true);
    try {
      const { authorization_url: authUrl } =
        await authStart.mutateAsync("existing");
      const result = await runDriveAuthSession(authUrl);

      if (result.status === "success") {
        await refetch();
      } else if (result.status === "error") {
        Alert.alert(
          "Sign-in failed",
          result.detail || "Could not connect your Google account.",
        );
      }
      // "cancelled" -> user backed out of the browser, nothing to do
    } catch (error) {
      Alert.alert(
        "Sign-in failed",
        error.message || "Could not start Google sign-in.",
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleSelectFolder = (folder) => {
    selectFolderMutation.mutate(
      { folderId: folder.id, folderName: folder.name },
      {
        onSuccess: () =>
          Alert.alert(
            "Folder set",
            `Documents will archive to "${folder.name}".`,
          ),
        onError: (error) =>
          Alert.alert(
            "Could not select folder",
            error.message || "Please try again.",
          ),
      },
    );
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Alert.alert(
        "Folder name required",
        "Enter a name for the new Drive folder.",
      );
      return;
    }
    createFolderMutation.mutate(newFolderName.trim(), {
      onSuccess: (data) => {
        Alert.alert(
          "Folder created",
          `Documents will archive to "${data.folder_name}".`,
        );
        setNewFolderName("");
        setShowCreateFolder(false);
      },
      onError: (error) =>
        Alert.alert(
          "Could not create folder",
          error.message || "Please try again.",
        ),
    });
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Google Drive",
      "Approved documents will no longer archive until you reconnect.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () =>
            disconnectMutation.mutate(undefined, {
              onError: (error) =>
                Alert.alert(
                  "Could not disconnect",
                  error.message || "Please try again.",
                ),
            }),
        },
      ],
    );
  };

  if (loadingConnection) {
    return (
      <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm items-center">
        <ActivityIndicator />
      </View>
    );
  }

  // --- Not connected: original sign-in card, now wired up --------------
  if (!isConnected) {
    return (
      <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100 items-center">
        <View className="bg-[#eef2ff] w-20 h-20 rounded-2xl items-center justify-center mb-5">
          <View className="bg-vistaNavy w-12 h-12 rounded-xl items-center justify-center">
            <MaterialCommunityIcons name="line-scan" size={24} color="white" />
          </View>
        </View>

        <Text className="text-vistaNavy font-bold text-sm mb-2">
          Internal Staff Login
        </Text>
        <Text className="text-gray-500 text-xs text-center leading-5 mb-6 px-2">
          Please use your institutional email to access the VISTA scanning
          gateway.
        </Text>

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={isAuthorizing}
          className={`bg-[#FFCC00] w-full flex-row items-center justify-center py-3 rounded-lg border border-yellow-500 shadow-sm mb-6 ${
            isAuthorizing ? "opacity-70" : ""
          }`}
        >
          {isAuthorizing ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <View className="bg-white p-1 rounded-sm mr-3">
                <Image
                  source={{
                    uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
                  }}
                  className="w-4 h-4"
                />
              </View>
              <Text className="text-gray-800 font-semibold text-[15px]">
                Sign in with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center w-full mb-4">
          <View className="flex-1 h-[1px] bg-gray-200" />
          <Text className="text-gray-400 font-bold text-[10px] tracking-widest px-3">
            PRIVACY ASSURANCE
          </Text>
          <View className="flex-1 h-[1px] bg-gray-200" />
        </View>

        <Text className="text-gray-400 text-[9px] text-center leading-4 px-1">
          Access is restricted to authorized personnel. Data is handled
          according to the{" "}
          <Text className="underline">Institutional Privacy Framework</Text>.
          All uploads are logged for audit purposes.
        </Text>
      </View>
    );
  }

  // --- Connected, no archive folder chosen yet --------------------------
  if (!hasFolder) {
    return (
      <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-4">
          <View className="bg-[#e7f6ec] w-10 h-10 rounded-xl items-center justify-center mr-3">
            <Feather name="check-circle" size={18} color="#16a34a" />
          </View>
          <View className="flex-1">
            <Text className="text-vistaNavy font-bold text-sm">
              Connected as
            </Text>
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              {connection.google_account_email}
            </Text>
          </View>
        </View>

        <Text className="text-vistaNavy font-bold text-xs mb-2">
          CHOOSE AN ARCHIVE FOLDER
        </Text>
        <Text className="text-gray-500 text-xs leading-5 mb-4">
          Approved submissions will be organized under this folder as Academic
          Year → Organization → Title.
        </Text>

        <View className="flex-row items-center bg-[#eef0f3] border border-gray-200 rounded-lg px-3 h-[42px] mb-3">
          <Feather name="search" size={16} color="#9ca3af" />
          <TextInput
            value={folderSearch}
            onChangeText={setFolderSearch}
            placeholder="Search your Drive folders..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-[13px] text-gray-700 ml-2 h-full p-0"
          />
        </View>

        {loadingFolders ? (
          <ActivityIndicator className="my-3" />
        ) : (
          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectFolder(item)}
                disabled={selectFolderMutation.isPending}
                className="py-3 border-b border-slate-100 flex-row items-center justify-between"
              >
                <Text
                  className="text-vistaNavy text-sm font-semibold flex-1"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text className="text-slate-400 text-xs py-3">
                No matching folders found.
              </Text>
            }
          />
        )}

        <View className="h-[1px] bg-gray-100 my-4" />

        {showCreateFolder ? (
          <View>
            <Text className="text-vistaNavy font-bold text-xs mb-2">
              NEW FOLDER NAME
            </Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="e.g. VISTA OSA Archive"
              placeholderTextColor="#9ca3af"
              className="h-10 border border-slate-200 rounded-lg px-3 mb-3 text-xs font-semibold text-vistaNavy"
            />
            <View className="flex-row">
              <TouchableOpacity
                onPress={handleCreateFolder}
                disabled={createFolderMutation.isPending}
                className="flex-1 bg-[#FFC342] rounded-lg py-3 items-center mr-2"
              >
                {createFolderMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-extrabold text-xs">
                    Create & Use
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCreateFolder(false)}
                className="flex-1 border border-slate-200 rounded-lg py-3 items-center ml-2"
              >
                <Text className="text-vistaNavy font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCreateFolder(true)}
            className="border border-dashed border-slate-300 rounded-lg py-3 items-center flex-row justify-center"
          >
            <Feather name="folder-plus" size={16} color="#1e5aa0" />
            <Text className="text-vistaNavy font-bold text-xs ml-2">
              Create a new folder instead
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // --- Fully connected, folder chosen ------------------------------------
  return (
    <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-gray-100">
      <View className="flex-row items-center mb-4">
        <View className="bg-[#e7f6ec] w-10 h-10 rounded-xl items-center justify-center mr-3">
          <Feather name="check-circle" size={18} color="#16a34a" />
        </View>
        <View className="flex-1">
          <Text className="text-vistaNavy font-bold text-sm">Connected as</Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {connection.google_account_email}
          </Text>
        </View>
      </View>

      <View className="bg-slate-50 rounded-lg p-3 mb-4 flex-row items-center">
        <Feather name="folder" size={16} color="#1e5aa0" />
        <Text
          className="text-vistaNavy text-xs font-semibold ml-2 flex-1"
          numberOfLines={1}
        >
          {connection.folder_name}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleDisconnect}
        disabled={disconnectMutation.isPending}
        className="border border-red-200 rounded-lg py-3 items-center"
      >
        {disconnectMutation.isPending ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-red-500 font-bold text-xs">
            Disconnect Google Drive
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
