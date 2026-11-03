import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text, TextInput } from '../common/FontText';
import AppBottomSheet from '../common/AppBottomSheet';
import AppInput from '../common/AppInput';
import AppButton from '../common/AppButton';
import { colors, sizes, type } from '../../theme/tokens';
import { REPLY_MAX_LENGTH, safeWebUrl } from './conversationPolicy.cjs';

export default function ReplyComposer({ conversation, onStatus }) {
  const { target, draft, sending, error, notice } = conversation;
  const input = useRef(null);
  const linkTrigger = useRef(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  useEffect(() => { if (target) input.current?.focus(); else input.current?.blur(); }, [target]);
  useEffect(() => { if (!target) setLinkOpen(false); }, [target]);
  const count = [...draft.trim()].length;
  const valid = count > 0 && count <= REPLY_MAX_LENGTH;
  const closeLink = () => { setLinkOpen(false); setLinkError(''); input.current?.focus(); };
  const insertLink = () => {
    if (!target || sending) return;
    const safe = safeWebUrl(url);
    if (!safe) { setLinkError('Enter a valid HTTP or HTTPS link.'); return; }
    const message = draft.trim() ? `${draft.trim()}\n${safe}` : safe;
    if ([...message].length > REPLY_MAX_LENGTH) { setLinkError('Your reply and link exceed 4,000 characters.'); return; }
    conversation.changeDraft(message); setUrl(''); closeLink();
  };
  return <View style={styles.surface}>
    {target ? <View style={styles.target}>
      <Text numberOfLines={1} style={styles.context}>Replying to {target.name}</Text>
      <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel="Close reply, keep draft" disabled={sending} onPress={conversation.cancel} style={styles.close}><Feather name="x" size={16} color={colors.muted} /></TouchableOpacity>
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.context}>{notice}</Text> : null}
    <View style={styles.row}>
      <TextInput ref={input} accessibilityLabel={onStatus ? 'Reply message' : 'Reply message or web link'} editable={!!target && !sending} multiline={!!target}
        placeholder={target ? 'Write a reply…' : 'Reply to a remark…'} placeholderTextColor="#8290A8"
        value={draft} onChangeText={conversation.changeDraft} style={styles.input} />
      {!onStatus ? <TouchableOpacity ref={linkTrigger} disabled={!target || sending} accessibilityLabel="Add web link" accessibilityRole="button" onPress={() => { setUrl(''); setLinkError(''); setLinkOpen(true); }} style={[styles.iconButton, (!target || sending) && styles.disabled]}><Feather name="link" size={18} color={colors.blue} /></TouchableOpacity> : null}
      <View style={styles.sendColumn}>
        {onStatus ? <TouchableOpacity disabled={sending} accessibilityLabel="Update submission status" accessibilityHint="Opens the submission update sheet upward" accessibilityRole="button" onPress={onStatus} style={styles.status}><Feather name="chevron-up" size={12} color={colors.blue} /><Text style={styles.statusLabel}>Status</Text></TouchableOpacity> : null}
        <TouchableOpacity disabled={!target || sending || !valid} accessibilityState={{ disabled: !target || sending || !valid }} accessibilityRole="button" accessibilityLabel="Send reply" onPress={conversation.send} style={[styles.sendTouch, (!target || !valid || sending) && styles.disabled]}>
          <View style={styles.send}>{sending ? <ActivityIndicator color="white" /> : <Feather name="arrow-up" size={18} color="white" />}</View>
        </TouchableOpacity>
      </View>
    </View>
    {target && count >= 3600 ? <Text style={[styles.counter, count > REPLY_MAX_LENGTH && styles.error]}>{count} / {REPLY_MAX_LENGTH}</Text> : null}
    <AppBottomSheet visible={linkOpen && !!target} title="Add web link" onClose={closeLink} busy={sending} returnFocusRef={linkTrigger}>
      <Text style={styles.context}>The link will be included in your reply.</Text>
      <AppInput accessibilityLabel="Web link" value={url} onChangeText={value => { setUrl(value); setLinkError(''); }} placeholder="https://example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus />
      {linkError ? <Text accessibilityRole="alert" style={styles.error}>{linkError}</Text> : null}
      <AppButton label="Add link" onPress={insertLink} disabled={sending || !url.trim()} />
      <AppButton label="Cancel" onPress={closeLink} variant="secondary" />
    </AppBottomSheet>
  </View>;
}
const styles = StyleSheet.create({
  surface: { borderRadius: 18, padding: 2, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: colors.navy, shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  input: { ...type.notificationPreview, flex: 1, minWidth: 0, minHeight: 36, maxHeight: 76, borderRadius: 20, backgroundColor: colors.field, paddingHorizontal: 10, paddingVertical: 6, color: colors.text },
  target: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 4, minHeight: sizes.touch, gap: 8 },
  context: { ...type.meta, color: colors.muted, flexShrink: 1 }, close: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  iconButton: { width: sizes.touch, minHeight: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  sendColumn: { flexDirection: 'row', alignItems: 'center' }, disabled: { opacity: 0.4 },
  status: { minHeight: sizes.touch, minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }, statusLabel: { fontSize: 11, color: colors.blue },
  sendTouch: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  send: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  counter: { ...type.meta, color: colors.muted, paddingHorizontal: 8 }, error: { ...type.meta, color: colors.danger, marginHorizontal: 6, marginBottom: 4 },
  linkTitle: { ...type.heading, color: colors.text },
});
