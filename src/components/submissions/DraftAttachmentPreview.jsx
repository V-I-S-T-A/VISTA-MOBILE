import { AppAlert as Alert } from '../common/AppDialog';
import { useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Platform, TouchableOpacity, View, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import * as FileSystem from 'expo-file-system/legacy';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';

export default function DraftAttachmentPreview({ file, onRemove, compact = false }) {
  const { width } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [opening, setOpening] = useState(false);
  const insets = useSafeAreaInsets();
  const name = file?.name || 'Attached document';
  const mime = file?.type || file?.mimeType || (/\.pdf$/i.test(name) ? 'application/pdf' : 'image/jpeg');
  const isImage = mime.startsWith('image/');

  const open = async () => {
    if (!file || opening) return;
    if (!file.uri) {
      Alert.alert('File unavailable', 'Go back and attach this document again to preview it.');
      return;
    }
    if (isImage) { setVisible(true); return; }
    setOpening(true);
    try {
      if (Platform.OS === 'android') {
        if (!requireOptionalNativeModule('ExpoIntentLauncher')) {
          Alert.alert('App update required', 'Rebuild VISTA to enable PDF preview on this device.');
          return;
        }
        // Android viewers need a content URI and temporary read permission;
        // opening the app-private file:// path directly would be denied.
        const uri = file.uri.startsWith('file:') ? await FileSystem.getContentUriAsync(file.uri) : file.uri;
        await require('expo-intent-launcher').startActivityAsync('android.intent.action.VIEW', { data: uri, type: mime, flags: 1 });
      } else {
        await Linking.openURL(file.uri);
      }
    } catch {
      Alert.alert('Could not open file', 'Make sure a PDF viewer is installed. If the attachment is no longer available, go back and attach it again.');
    } finally { setOpening(false); }
  };

  return <>
    <TouchableOpacity onPress={open} disabled={!file || opening} accessibilityRole="button"
      accessibilityLabel={file ? `Preview attachment: ${name}` : 'No file attached'}
      accessibilityHint={file ? 'Opens the attachment for review before submitting' : undefined}
      className="rounded-2xl bg-slate-50 border border-slate-100 flex-row items-center" style={{ padding: compact ? 8 : 12, marginTop: compact ? 0 : 16 }}>
      <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-slate-200">
        <Feather name={file ? (isImage ? 'image' : 'file-text') : 'paperclip'} size={18} color={file ? '#245EA9' : '#94A3B8'} />
      </View>
      <View className="flex-1 ml-3 mr-2">
        <Text className="text-slate-500 text-[11px] font-medium">Attachment</Text>
        <Text numberOfLines={2} className="text-vistaNavy text-[13px] font-medium mt-1">{file ? name : 'No file attached'}</Text>
        {file ? <Text className="text-[#245EA9] text-xs mt-1">Tap to preview</Text> : null}
      </View>
      {opening ? <ActivityIndicator color="#245EA9" /> : file ? <Feather name="external-link" size={18} color="#245EA9" /> : <Text className="text-xs text-slate-500 font-bold">Optional</Text>}
    </TouchableOpacity>
    {file && onRemove ? <TouchableOpacity onPress={onRemove} accessibilityLabel="Remove attachment" className="self-end min-h-[48px] justify-center px-3"><Text className="text-red-700 text-sm font-bold">Remove attachment</Text></TouchableOpacity> : null}
    <Modal visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, backgroundColor: '#10213A', paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="flex-row items-center px-4">
          <Text className="text-white text-sm flex-1 mr-3" numberOfLines={2}>{name}</Text>
          <TouchableOpacity onPress={() => setVisible(false)} accessibilityRole="button" accessibilityLabel="Close attachment preview" style={{ padding: 12 }}>
            <Feather name="x" size={18} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          {file?.uri ? <Image source={{ uri: file.uri }} accessibilityLabel={`Preview of ${name}`} resizeMode="contain" style={{ width: '100%', height: file.width && file.height ? width * file.height / file.width : 600 }}
            onError={() => { setVisible(false); Alert.alert('Preview unavailable', 'Go back and attach the document again.'); }} /> : null}
        </ScrollView>
      </View>
    </Modal>
  </>;
}
