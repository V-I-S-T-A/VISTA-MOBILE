import { AppAlert as Alert } from '../../../components/common/AppDialog';
import { surfaces, panelStyles } from "../../../theme/layout";
import { Text, TextInput } from "../../../components/common/FontText";
import { useState } from "react";
import { View, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import { DriveSkeleton, Skeleton } from '../../../components/common/Skeleton';
import VistaProcessing from '../../../components/common/VistaProcessing';
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
import { useToast } from "../../../components/common/Toast";
import { colors, space, type } from '../../../theme/tokens';

export function DriveAccountIdentity({ email }) {
  const accountEmail = typeof email === 'string' ? email.trim() : '';
  return <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
    <Text style={{ ...type.sectionTitle, color: colors.text }}>{accountEmail ? 'Connected as' : 'Google Drive connected'}</Text>
    <Text selectable style={{ ...type.meta, color: colors.muted }}>{accountEmail || 'Account email unavailable'}</Text>
  </View>;
}

export default function GDriveSyncLoginCard() {
  const toast = useToast();
  const {
    data: connection,
    isLoading: loadingConnection,
    isError: connectionError,
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
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const { data: folders = [], isLoading: loadingFolders, isError: foldersError, refetch: refetchFolders } =
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
        toast.success("Connected to Google Drive.");
      } else if (result.status === "error") {
        toast.error(result.detail || "Could not connect your Google account.");
      }
      // "cancelled" -> user backed out of the browser, nothing to do
    } catch (error) {
      toast.error(error.message || "Could not start Google sign-in.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleSelectFolder = (folder) => {
    selectFolderMutation.mutate(
      { folderId: folder.id, folderName: folder.name },
      {
        onSuccess: () =>
          (async () => {
            await refetch();
            setShowFolderPicker(false);
            toast.success(`Documents will archive to "${folder.name}".`);
          })(),
        onError: (error) =>
          toast.error(
            error.message || "Could not select folder. Please try again.",
          ),
      },
    );
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Enter a name for the new Drive folder.");
      return;
    }
    createFolderMutation.mutate(newFolderName.trim(), {
      onSuccess: (data) => {
        refetch();
        setShowFolderPicker(false);
        toast.success(`Documents will archive to "${data.folder_name}".`);
        setNewFolderName("");
        setShowCreateFolder(false);
      },
      onError: (error) =>
        toast.error(
          error.message || "Could not create folder. Please try again.",
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
              onSuccess: () => toast.success("Disconnected from Google Drive."),
              onError: (error) =>
                toast.error(
                  error.message || "Could not disconnect. Please try again.",
                ),
            }),
        },
      ],
    );
  };

  if (loadingConnection) {
    return (
      <DriveSkeleton />
    );
  }

  if (connectionError) {
    return (
      <View className="bg-white rounded-3xl p-4 mb-3  items-center" style={[surfaces.card, panelStyles.card]}>
        <Text className="text-gray-500 text-xs text-center mb-3">
          Could not check your Google Drive connection.
        </Text>
        <TouchableOpacity style={panelStyles.touch} onPress={() => refetch()} className="bg-vistaNavy rounded-xl px-4 py-3">
          <Text className="text-white font-medium text-xs">Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="bg-white rounded-3xl p-4 mb-3  border border-gray-100 items-center" style={[surfaces.card, panelStyles.card]}>
        <VistaProcessing visible={isAuthorizing} message="Connecting Google Drive…" />
        <View className="bg-[#eef2ff] w-12 h-12 rounded-2xl items-center justify-center mb-3">
          <View className="bg-vistaNavy w-8 h-8 rounded-xl items-center justify-center">
            <MaterialCommunityIcons name="line-scan" size={18} color="white" />
          </View>
        </View>

        <Text className="text-vistaNavy font-medium text-sm mb-2">
          Internal Staff Login
        </Text>
        <Text className="text-gray-500 text-xs text-center leading-5 mb-3 px-2">
          Please use your institutional email to access the VISTA scanning
          gateway.
        </Text>

        <TouchableOpacity style={panelStyles.touch}
          onPress={handleSignIn}
          disabled={isAuthorizing}
          className={`bg-[#FFCC00] w-full flex-row items-center justify-center py-3 rounded-lg border border-yellow-500 shadow-sm mb-3 ${
            isAuthorizing ? "opacity-70" : ""
          }`}
        >
          {isAuthorizing ? (
            <ActivityIndicator color="#333" />
          ) : (
            <>
              <View className="bg-white p-1 rounded-sm mr-3">
                <Image
                  source={require("../../../assets/google-icon-logo-svgrepo-com.webp")}
                  className="w-4 h-4"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-800 font-semibold text-[13px]">
                Sign in with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center w-full mb-2">
          <View className="flex-1 h-[1px] bg-gray-200" />
          <Text className="text-gray-400 font-medium text-xs  px-3">
            Privacy assurance
          </Text>
          <View className="flex-1 h-[1px] bg-gray-200" />
        </View>

        <Text className="text-gray-400 text-xs text-center leading-4 px-1">
          Access is restricted to authorized personnel. Data is handled
          according to the{" "}
          <Text className="underline">Institutional Privacy Framework</Text>.
          All uploads are logged for audit purposes.
        </Text>
      </View>
    );
  }

  if (!hasFolder || showFolderPicker) {
    return (
      <View className="bg-white rounded-3xl p-4 mb-3  border border-gray-100" style={[surfaces.card, panelStyles.card]}>
        <VistaProcessing visible={selectFolderMutation.isPending || createFolderMutation.isPending || disconnectMutation.isPending} message={disconnectMutation.isPending ? 'Disconnecting Google Drive…' : 'Saving your Drive folder…'} />
        <View className="flex-row items-center mb-2">
          <View className="bg-[#e7f6ec] w-10 h-10 rounded-xl items-center justify-center mr-3">
            <Feather name="check-circle" size={18} color="#16a34a" />
          </View>
          <DriveAccountIdentity email={connection.google_account_email} />
          <TouchableOpacity style={panelStyles.touch}
            onPress={handleDisconnect}
            disabled={disconnectMutation.isPending}
          >
            <Feather name="log-out" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>

        <Text className="text-vistaNavy font-medium text-xs mb-2">
          {hasFolder ? "Change archive folder" : "Choose an archive folder"}
        </Text>
        <Text className="text-gray-500 text-xs leading-5 mb-2">
          Approved submissions will be organized under this folder as Academic
          Year → Organization → Title.
        </Text>

        {hasFolder ? (
          <TouchableOpacity style={panelStyles.touch} onPress={() => setShowFolderPicker(false)} className="self-end mb-2">
            <Text className="text-vistaNavy text-xs font-medium">Cancel</Text>
          </TouchableOpacity>
        ) : null}

        <View className="flex-row items-center bg-[#eef0f3] border border-gray-200 rounded-lg px-3 min-h-[48px] mb-3">
          <Feather name="search" size={16} color="#9ca3af" />
          <TextInput
            value={folderSearch}
            onChangeText={setFolderSearch}
            placeholder="Search your Drive folders..."
            placeholderTextColor="#9ca3af"
            className="flex-1 text-[13px] text-gray-700 ml-2 min-h-[48px] p-0"
          />
        </View>

        {loadingFolders ? (
          <View style={{ gap: 12, marginVertical: 12 }}>{[0, 1, 2].map(i => <Skeleton key={i} height={44} radius={12} />)}</View>
        ) : foldersError ? (
          <View className="py-3 items-center">
            <Text className="text-gray-500 text-xs mb-2">Could not load Drive folders.</Text>
            <TouchableOpacity style={panelStyles.touch} onPress={() => refetchFolders()}>
              <Text className="text-vistaNavy text-xs font-medium">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={folders}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={panelStyles.touch}
                onPress={() => handleSelectFolder(item)}
                disabled={selectFolderMutation.isPending}
                className="py-3 border-b border-slate-100 flex-row items-center justify-between"
              >
                <Text
                  className="text-vistaNavy text-sm font-semibold flex-1"

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
            <Text className="text-vistaNavy font-medium text-xs mb-2">
              New folder name
            </Text>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="e.g. VISTA OSA Archive"
              placeholderTextColor="#9ca3af"
              className="min-h-[48px] border border-slate-200 rounded-lg px-3 mb-3 text-xs font-semibold text-vistaNavy"
            />
            <View className="flex-row">
              <TouchableOpacity style={panelStyles.touch}
                onPress={handleCreateFolder}
                disabled={createFolderMutation.isPending}
                className="flex-1 bg-[#FFC342] rounded-lg py-3 items-center mr-2"
              >
                {createFolderMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-[#513600] font-medium text-xs">
                    Create & Use
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={panelStyles.touch}
                onPress={() => setShowCreateFolder(false)}
                className="flex-1 border border-slate-200 rounded-lg py-3 items-center ml-2"
              >
                <Text className="text-vistaNavy font-medium text-xs">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={panelStyles.touch}
            onPress={() => setShowCreateFolder(true)}
            className="border border-dashed border-slate-300 rounded-lg py-3 items-center flex-row justify-center"
          >
            <Feather name="folder-plus" size={16} color="#1e5aa0" />
            <Text className="text-vistaNavy font-medium text-xs ml-2">
              Create a new folder instead
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="bg-white rounded-3xl p-4 mb-3  border border-gray-100" style={[surfaces.card, panelStyles.card]}>
      <VistaProcessing visible={disconnectMutation.isPending} message="Disconnecting Google Drive…" />
      <View className="flex-row items-center mb-2">
        <View className="bg-[#e7f6ec] w-10 h-10 rounded-xl items-center justify-center mr-3">
          <Feather name="check-circle" size={18} color="#16a34a" />
        </View>
        <DriveAccountIdentity email={connection.google_account_email} />
      </View>

      <View className="bg-slate-50 rounded-lg p-3 mb-2 flex-row items-center">
        <Feather name="folder" size={16} color="#1e5aa0" />
        <Text
          className="text-vistaNavy text-xs font-semibold ml-2 flex-1"

        >
          {connection.folder_name}
        </Text>
      </View>

      <TouchableOpacity style={panelStyles.touch}
        onPress={() => setShowFolderPicker(true)}
        className="border border-vistaNavy rounded-lg py-3 items-center mb-3"
      >
        <Text className="text-vistaNavy font-medium text-xs">Change folder</Text>
      </TouchableOpacity>

      <TouchableOpacity style={panelStyles.touch}
        onPress={handleDisconnect}
        disabled={disconnectMutation.isPending}
        className="border border-red-200 rounded-lg py-3 items-center"
      >
        {disconnectMutation.isPending ? (
          <ActivityIndicator />
        ) : (
          <Text className="text-red-500 font-medium text-xs">
            Disconnect Google Drive
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
