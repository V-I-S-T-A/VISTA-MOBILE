import * as FileSystem from 'expo-file-system/legacy';
import { apiClient, unwrapApiError } from '../lib/apiClient';

export async function prepareAttachment(file) {
  const body = new FormData();
  body.append('file', { uri: file.uri, name: file.name, type: file.type });
  try {
    const { data } = await apiClient.post('/submissions/prepare-attachment/', body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
    const uri = FileSystem.cacheDirectory + `vista-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    await FileSystem.writeAsStringAsync(uri, data.base64, { encoding: FileSystem.EncodingType.Base64 });
    return { uri, name: data.name, type: data.type, size: data.size, width: data.width, height: data.height };
  } catch (error) { throw unwrapApiError(error); }
}
