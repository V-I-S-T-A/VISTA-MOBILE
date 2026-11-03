import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import AppInput from '../common/AppInput';
import AppButton from '../common/AppButton';
import SelectField from '../staff/SelectField';
import { colors, type, sizes } from '../../theme/tokens';
import { PROCESS_FILE_TYPES, APPROVAL_FILE_TYPES, validateReviewFile, isImage } from './staffReviewPolicy.cjs';
import { imagesToPdf } from '../../utils/imagesToPdf';
import { scanDocument } from '../../utils/documentScan';
import DraftAttachmentPreview from './DraftAttachmentPreview';

export default function StaffReviewFiles({ approval = false, label, files, onChange, disabled, action, onActionChange, documents = [] }) {
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const busy = disabled || working;
  const add = (selected, replaceIndex) => {
    selected.forEach(file => validateReviewFile(file, approval));
    const merged = approval ? [...files] : [];
    if (replaceIndex !== undefined) {
      merged[replaceIndex] = { ...selected[0], driveName: selected[0].name };
      onChange(merged); return;
    }
    for (const file of selected) if (!merged.some(item => item.uri === file.uri)) merged.push({ ...file, driveName: file.name });
    if (merged.length > (approval ? 10 : 1)) throw new Error('You can attach up to 10 files in each group.');
    onChange(merged);
  };
  const pick = async (camera, replaceIndex) => {
    if (busy) return;
    setWorking(true); setError('');
    try {
      if (camera) { const file = await scanDocument(); if (file) add([file], replaceIndex); }
      else {
        const result = await DocumentPicker.getDocumentAsync({ type: approval ? APPROVAL_FILE_TYPES : PROCESS_FILE_TYPES, copyToCacheDirectory: true, multiple: approval && replaceIndex === undefined });
        if (!result.canceled) add(result.assets.map(asset => ({ uri: asset.uri, name: asset.name, type: asset.mimeType || (/\.pdf$/i.test(asset.name) ? 'application/pdf' : 'application/octet-stream'), size: asset.size })), replaceIndex);
      }
    } catch (e) { setError(e.message || 'Could not select the file.'); }
    finally { setWorking(false); }
  };
  const convert = async () => {
    setWorking(true); setError('');
    try {
      const pdf = await imagesToPdf(files.filter(isImage));
      onChange([...files.filter(file => !isImage(file)), pdf]);
    } catch (e) { setError(e.message || 'Could not convert images. Your selections are retained.'); }
    finally { setWorking(false); }
  };
  if (!approval && !expanded && !files.length) return <TouchableOpacity disabled={busy} accessibilityRole="button" accessibilityLabel="Manage On Process attachments" onPress={() => setExpanded(true)} style={[styles.file, { minHeight: sizes.touch, justifyContent: 'center' }]}><Text style={styles.link}>Add / replace file (optional)</Text><Text style={styles.meta}>{documents.length} active attachment{documents.length === 1 ? '' : 's'}</Text></TouchableOpacity>;
  return <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    {!approval ? <>
      <Text style={styles.meta}>{documents.length} active attachment{documents.length === 1 ? '' : 's'}. Leave empty to change status only.</Text>
      {documents.map(doc => <Text key={doc.document_id || doc.file_name} style={styles.meta}>{doc.file_name}</Text>)}
      <SelectField placeholder="Attachment action" value={{ id: action, label: action === 'replace' ? 'Replace current files' : 'Add to current files' }}
        options={[{ id: 'add', label: 'Add to current files' }, { id: 'replace', label: 'Replace current files' }]} disabled={busy} onChange={value => onActionChange(value.id)} />
      {action === 'replace' ? <Text style={styles.meta}>Replaces active files; earlier files remain in history.</Text> : null}
    </> : null}
    {files.map((file, index) => <View key={file.uri} style={styles.file}>
      <View style={styles.row}><Text style={[styles.meta, { flex: 1 }]}>{file.name}</Text>
        <TouchableOpacity disabled={busy} accessibilityLabel={`Remove ${file.name}`} onPress={() => onChange(files.filter((_, i) => i !== index))} style={styles.touch}><Feather name="x" size={16} color={colors.muted} /></TouchableOpacity>
      </View>
      <DraftAttachmentPreview file={file} compact />
      {approval ? <>
        <AppInput accessibilityLabel={`Google Drive filename for ${file.name}`} value={file.driveName} maxLength={255} editable={!busy} onChangeText={driveName => onChange(files.map((item, i) => i === index ? { ...item, driveName } : item))} />
        <View style={styles.row}>
          <TouchableOpacity disabled={busy} accessibilityRole="button" accessibilityLabel={`Replace ${file.name}`} style={styles.touch} onPress={() => pick(false, index)}><Text style={styles.link}>Replace</Text></TouchableOpacity>
          {isImage(file) ? <>
            <TouchableOpacity disabled={busy} accessibilityRole="button" accessibilityLabel={`Retake ${file.name}`} style={styles.touch} onPress={() => pick(true, index)}><Text style={styles.link}>Retake</Text></TouchableOpacity>
            <TouchableOpacity disabled={busy || index === 0} accessibilityLabel={`Move ${file.name} earlier`} style={styles.touch} onPress={() => { const next = [...files]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}><Feather name="chevron-up" size={18} color={colors.blue} /></TouchableOpacity>
            <TouchableOpacity disabled={busy || index === files.length - 1} accessibilityLabel={`Move ${file.name} later`} style={styles.touch} onPress={() => { const next = [...files]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }}><Feather name="chevron-down" size={18} color={colors.blue} /></TouchableOpacity>
          </> : null}
        </View>
      </> : null}
    </View>)}
    <View style={styles.row}>
      <AppButton label={files.length && !approval ? 'Choose replacement file' : 'Choose file'} variant="secondary" disabled={busy} onPress={() => pick(false)} />
      {approval ? <AppButton label="Scan" variant="secondary" disabled={busy} onPress={() => pick(true)} /> : null}
    </View>
    {approval && files.some(isImage) ? <AppButton label="Convert images to PDF" busy={working} disabled={disabled} onPress={convert} /> : null}
    <Text style={styles.meta}>{approval ? 'PDF or images · up to 10 files. Convert images to PDF before approval.' : 'PDF, DOCX, XLSX or image · optional.'}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  group: { gap: 6 }, label: { ...type.label, color: colors.text }, meta: { ...type.meta, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }, touch: { minWidth: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  file: { padding: 8, backgroundColor: colors.field, borderRadius: 12, gap: 4 }, link: { ...type.meta, color: colors.blue }, error: { ...type.meta, color: colors.danger },
});
