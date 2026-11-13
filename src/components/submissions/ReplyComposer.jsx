import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text, TextInput } from '../common/FontText';
import AppInput from '../common/AppInput';
import { colors, sizes, type } from '../../theme/tokens';
import { REPLY_MAX_LENGTH, REPLY_LINK_MAX_LENGTH } from './conversationPolicy.cjs';

export default function ReplyComposer({ conversation, onStatus }) {
  const { target, draft, sending, error, notice } = conversation;
  const input = useRef(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  useEffect(() => { if (target) input.current?.focus(); else input.current?.blur(); }, [target]);
  useEffect(() => { if (!target) { setLinkOpen(false); setUrl(''); } }, [target]);
  const count = [...draft].length;
  const valid = (!!draft.trim() || !!url.trim()) && count <= REPLY_MAX_LENGTH;
  return <View style={styles.surface}>
    {target ? <View style={styles.target}>
      <Text numberOfLines={1} style={styles.context}>Replying to {target.name}</Text>
      <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel="Close reply, keep draft" disabled={sending} onPress={conversation.cancel} style={styles.close}><Feather name="x" size={16} color={colors.muted} /></TouchableOpacity>
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.context}>{notice}</Text> : null}
    <View style={styles.row}>
      <TextInput ref={input} accessibilityLabel="Reply message" editable={!!target && !sending} multiline={!!target} maxLength={REPLY_MAX_LENGTH}
        placeholder={target ? 'Write a reply…' : 'Reply to a remark…'} placeholderTextColor="#8290A8"
        value={draft} onChangeText={conversation.changeDraft} style={styles.input} />
      <View style={styles.sendColumn}>
        {onStatus ? <TouchableOpacity disabled={sending} accessibilityLabel="Update submission status" accessibilityHint="Opens the submission update sheet upward" accessibilityRole="button" onPress={onStatus} style={styles.status}><Feather name="chevron-up" size={12} color={colors.blue} /><Text style={styles.statusLabel}>Status</Text></TouchableOpacity> : null}
        <TouchableOpacity disabled={!target || sending || !valid} accessibilityState={{ disabled: !target || sending || !valid }} accessibilityRole="button" accessibilityLabel="Send reply" onPress={() => conversation.send(url)} style={[styles.sendTouch, (!target || !valid || sending) && styles.disabled]}>
          <View style={styles.send}>{sending ? <ActivityIndicator color="white" /> : <Feather name="arrow-up" size={18} color="white" />}</View>
        </TouchableOpacity>
      </View>
    </View>
    {target ? <View style={styles.fields}>
      <Text style={[styles.counter, count > REPLY_MAX_LENGTH && styles.error]}>{count} / {REPLY_MAX_LENGTH}</Text>
      {!onStatus ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={linkOpen ? 'Hide web link field' : 'Add web link'} disabled={sending} onPress={() => setLinkOpen(value => !value)}><Text style={styles.linkField}>{linkOpen ? 'Hide link' : url ? 'Edit link' : 'Add link'}</Text></TouchableOpacity> : null}
    </View> : null}
    {target && linkOpen && !onStatus ? <View style={styles.linkEditor}>
      <Feather name="link" size={15} color={colors.blue} />
      <AppInput accessibilityLabel="Web link" value={url} onChangeText={setUrl} placeholder="https://example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!sending} maxLength={REPLY_LINK_MAX_LENGTH} style={styles.linkInput} />
      <Text style={styles.counter}>{[...url].length}/{REPLY_LINK_MAX_LENGTH}</Text>
    </View> : null}
  </View>;
}
const styles = StyleSheet.create({
  surface: { borderRadius: 18, padding: 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: colors.navy, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  input: { ...type.notificationPreview, flex: 1, minWidth: 0, minHeight: 36, maxHeight: 76, borderRadius: 20, backgroundColor: colors.field, paddingHorizontal: 10, paddingVertical: 6, color: colors.text },
  target: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 4, minHeight: sizes.touch, gap: 8 },
  context: { ...type.meta, color: colors.muted, flexShrink: 1 }, close: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  sendColumn: { flexDirection: 'row', alignItems: 'center' }, disabled: { opacity: 0.4 },
  status: { minHeight: sizes.touch, minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }, statusLabel: { fontSize: 11, color: colors.blue },
  sendTouch: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  send: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  counter: { ...type.meta, color: colors.muted, paddingHorizontal: 8 }, error: { ...type.meta, color: colors.danger, marginHorizontal: 6, marginBottom: 4 },
  fields: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8 },
  linkField: { ...type.meta, color: colors.blue, padding: 6 },
  linkEditor: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 4 },
  linkInput: { flex: 1, minWidth: 0, minHeight: 34, paddingVertical: 4, paddingHorizontal: 8, fontSize: 12 },
});
