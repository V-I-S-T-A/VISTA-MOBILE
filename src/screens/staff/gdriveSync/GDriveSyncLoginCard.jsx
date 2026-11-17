import { AppAlert as Alert } from '../../../components/common/AppDialog';
import { surfaces, panelStyles } from "../../../theme/layout";
import { Text, TextInput as PlainTextInput } from "../../../components/common/FontText";
import TextInput from '../../../components/common/AppInput';
import { useState } from "react";
import { View, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import { DriveSkeleton, Skeleton } from '../../../components/common/Skeleton';
import ContentState from '../../../components/common/ContentState';
import useConnectivity from '../../../hooks/useConnectivity';
import VistaProcessing from '../../../components/common/VistaProcessing';
import { Feather } from "@expo/vector-icons";
import GoogleDriveLogo from '../../../components/common/GoogleDriveLogo';
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
import { colors, radii, reviewControls, sizes, space, type } from '../../../theme/tokens';

export function DriveAccountIdentity({ email }) {
  const accountEmail = typeof email === 'string' ? email.trim() : '';
  return <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
    <Text style={{ ...type.sectionTitle, color: colors.text }}>{accountEmail ? 'Connected as' : 'Google Drive connected'}</Text>
    <Text selectable style={{ ...type.meta, color: colors.muted }}>{accountEmail || 'Account email unavailable'}</Text>
  </View>;
}

export default function GDriveSyncLoginCard() {
  const online = useConnectivity();
  const toast = useToast();
  const {
    data: connection,
    isLoading: loadingConnection,
    isError: connectionError,
    error: connectionErrorDetail,
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

  const isConnected = !!connection?.connected;
  const hasFolder = isConnected && !!connection?.folder_id;

  const { data: folders = [], isLoading: loadingFolders, isError: foldersError, error: foldersErrorDetail, refetch: refetchFolders } =
    useDriveFolders(folderSearch, { enabled: isConnected && (!hasFolder || showFolderPicker) });

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

  if (loadingConnection && online) {
    return (
      <DriveSkeleton />
    );
  }

  if (connectionError || (!online && !connection)) {
    return (
      <View className="bg-white rounded-3xl p-4 mb-3  items-center" style={[surfaces.card, panelStyles.card]}>
        <ContentState compact variant="error" title="Could not check your Google Drive connection"
          error={!online ? { code: 'OFFLINE' } : connectionErrorDetail} onRetry={() => refetch()} />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="bg-white rounded-3xl p-4 mb-3  border border-gray-100 items-center" style={[surfaces.card, panelStyles.card]}>
        <VistaProcessing visible={isAuthorizing} message="Connecting Google Drive…" />
        <View style={{ padding: space.sm, marginBottom: space.md }}><GoogleDriveLogo /></View>

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
        <View className="flex-row items-center mb-3">
          <View style={{ marginRight: space.md }}><GoogleDriveLogo /></View>
          <DriveAccountIdentity email={connection.google_account_email} />
          <TouchableOpacity
            style={{ width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' }}
            onPress={handleDisconnect}
            disabled={disconnectMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Disconnect Google Drive"
          >
            <Feather name="log-out" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs }}>
          <Text style={{ ...type.sectionTitle, color: colors.navy, flex: 1 }}>
            {hasFolder ? "Change archive folder" : "Choose an archive folder"}
          </Text>
          {hasFolder ? (
            <TouchableOpacity
              style={{ minHeight: sizes.touch, justifyContent: 'center', paddingLeft: space.sm }}
              onPress={() => setShowFolderPicker(false)}
            >
              <Text style={{ ...reviewControls.action, color: colors.blue }}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={{ ...type.meta, color: colors.muted, marginBottom: space.md }}>
          Approved submissions will be organized under this folder as Academic
          Year → Organization → Title.
        </Text>

        <View style={{ minHeight: sizes.touch, justifyContent: 'center', marginBottom: space.sm }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.field,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: reviewControls.radius,
              paddingHorizontal: reviewControls.padding,
              minHeight: reviewControls.fieldHeight,
              gap: space.sm,
            }}
          >
            <Feather name="search" size={reviewControls.icon} color={colors.muted} />
            <PlainTextInput
              value={folderSearch}
              onChangeText={setFolderSearch}
              placeholder="Search your Drive folders..."
              accessibilityLabel="Search Drive folders"
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                ...reviewControls.value,
                color: colors.text,
                paddingVertical: 0,
                includeFontPadding: false,
              }}
            />
          </View>
        </View>

        {!online && !folders.length ? (
          <ContentState compact variant="error" title="Could not load Drive folders" error={{ code: 'OFFLINE' }} onRetry={() => refetchFolders()} />
        ) : loadingFolders ? (
          <View style={{ gap: 10, marginVertical: space.sm }}>{[0, 1, 2].map(i => <Skeleton key={i} height={42} radius={reviewControls.radius} />)}</View>
        ) : foldersError ? (
          <View style={{ paddingVertical: space.md, alignItems: 'center', gap: space.xs }}>
            <Text style={{ ...reviewControls.value, color: colors.muted, textAlign: 'center' }}>
              Could not load Drive folders.
            </Text>
            {foldersErrorDetail?.message ? (
              <Text style={{ ...reviewControls.label, color: colors.danger, textAlign: 'center', paddingHorizontal: space.sm }}>
                {foldersErrorDetail.message}
              </Text>
            ) : null}
            {foldersErrorDetail?.code === 'drive_reauth_required' || foldersErrorDetail?.message === 'Connect Google Drive first.' ? (
              <TouchableOpacity
                style={{ minHeight: sizes.touch, justifyContent: 'center', marginTop: space.xs }}
                onPress={() => { setShowFolderPicker(false); refetch(); }}
              >
                <View style={{ minHeight: reviewControls.actionHeight, paddingHorizontal: space.lg, borderRadius: reviewControls.radius, backgroundColor: colors.selectedSurface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...reviewControls.action, color: colors.blue }}>Reconnect Google Drive</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ minHeight: sizes.touch, justifyContent: 'center', marginTop: space.xs }}
                onPress={() => refetchFolders()}
              >
                <View style={{ minHeight: reviewControls.actionHeight, paddingHorizontal: space.lg, borderRadius: reviewControls.radius, backgroundColor: colors.selectedSurface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ ...reviewControls.action, color: colors.blue }}>Try again</Text>
                </View>
              </TouchableOpacity>
            )}
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
              <ContentState compact title={folderSearch.trim() ? 'No matching folders' : 'No Drive folders yet'}
                message={folderSearch.trim() ? 'Try another folder name.' : 'Create an archive folder below to get started.'} />
            }
          />
        )}

        <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: space.md }} />

        {showCreateFolder ? (
          <View>
            <Text style={{ ...type.label, color: colors.text, marginBottom: space.xs }}>
              New folder name
            </Text>
            <TextInput
              size="compact"
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="e.g. VISTA OSA Archive"
              accessibilityLabel="New Drive folder name"
              placeholderTextColor={colors.placeholder}
              style={{ marginBottom: space.sm }}
            />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <TouchableOpacity
                style={{ flex: 1, minHeight: sizes.touch, justifyContent: 'center' }}
                onPress={handleCreateFolder}
                disabled={createFolderMutation.isPending}
              >
                <View style={{ minHeight: reviewControls.actionHeight, borderRadius: reviewControls.radius, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: reviewControls.padding }}>
                  {createFolderMutation.isPending ? (
                    <ActivityIndicator color={colors.onYellow} />
                  ) : (
                    <Text style={{ ...reviewControls.action, color: colors.onYellow }}>
                      Create & Use
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, minHeight: sizes.touch, justifyContent: 'center' }}
                onPress={() => setShowCreateFolder(false)}
              >
                <View style={{ minHeight: reviewControls.actionHeight, borderRadius: reviewControls.radius, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center', paddingHorizontal: reviewControls.padding }}>
                  <Text style={{ ...reviewControls.action, color: colors.navy }}>Cancel</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={{ minHeight: sizes.touch, justifyContent: 'center' }}
            onPress={() => setShowCreateFolder(true)}
          >
            <View style={{ minHeight: reviewControls.actionHeight, borderRadius: reviewControls.radius, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.field, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: reviewControls.padding }}>
              <Feather name="folder-plus" size={reviewControls.icon} color={colors.blue} />
              <Text style={{ ...reviewControls.action, color: colors.navy }}>
                Create a new folder instead
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View className="bg-white rounded-3xl p-4 mb-3  border border-gray-100" style={[surfaces.card, panelStyles.card]}>
      <VistaProcessing visible={disconnectMutation.isPending} message="Disconnecting Google Drive…" />
      <View className="flex-row items-center mb-2">
        <View style={{ marginRight: space.md }}><GoogleDriveLogo /></View>
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

      <TouchableOpacity style={[panelStyles.touch, { flexDirection: 'row', justifyContent: 'center', gap: space.sm }]}
        onPress={() => setShowFolderPicker(true)}
        className="border border-vistaNavy rounded-lg py-3 items-center mb-3"
      >
        <Feather name="folder" size={18} color={colors.blue} />
        <Text className="text-vistaNavy font-medium text-xs">Change folder</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[panelStyles.touch, { flexDirection: 'row', justifyContent: 'center', gap: space.sm }]}
        onPress={handleDisconnect}
        disabled={disconnectMutation.isPending}
        className="border border-red-200 rounded-lg py-3 items-center"
      >
        {disconnectMutation.isPending ? (
          <ActivityIndicator />
        ) : (
          <>
            <Feather name="log-out" size={18} color={colors.danger} />
            <Text style={{ color: colors.danger }} className="font-medium text-xs">Disconnect Google Drive</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
