import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text, TextInput } from '../common/FontText';
import AppInput from '../common/AppInput';
import UserAvatar from '../common/UserAvatar';
import { colors, sizes, type, radii, space, composerLayout } from '../../theme/tokens';
import { REPLY_MAX_LENGTH, REPLY_LINK_MAX_LENGTH } from './conversationPolicy.cjs';

export default function ReplyComposer({ conversation, onStatus, user }) {
  const { target, draft, sending, error, notice } = conversation;
  const input = useRef(null);
  const [focused, setFocused] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const staff = !!onStatus;
  const updating = staff && !target;
  const message = updating ? conversation.updateDraft || '' : draft;
  const expanded = focused || !!target || !!message;
  const url = onStatus ? '' : conversation.link || '';
  const setUrl = conversation.changeLink;
  useEffect(() => {
    if (!target) { input.current?.blur(); return; }
    // Switching targets is explicit. Never select the newest update by default.
    const frame = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [target]);
  useEffect(() => { setLinkOpen(!!conversation.link); }, [target]);
  const count = [...message].length;
  const valid = (!!message.trim() || !!url.trim()) && (updating || count <= REPLY_MAX_LENGTH);
  const disabled = sending || !valid;
  // Students cannot create top-level updates, even if mounted without a target.
  if (!staff && !target) return null;
  const sendButton = <TouchableOpacity disabled={disabled} accessibilityState={{ disabled }} accessibilityRole="button" accessibilityLabel={updating ? 'Review new update' : 'Send reply'} accessibilityHint={updating ? 'Choose an optional status and confirm before posting' : undefined} onPress={() => updating ? onStatus() : conversation.send(url)} style={[styles.sendTouch, disabled && styles.disabled]}>
    <View style={styles.send}>{sending ? <ActivityIndicator color={colors.surface} /> : <Feather name="arrow-up" size={18} color={colors.surface} />}</View>
  </TouchableOpacity>;
  return <View style={styles.surface}>
    {target ? <View style={styles.target}>
      <Text numberOfLines={1} style={styles.context}>Replying to {target.name}</Text>
      <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel="Close reply, keep draft" disabled={sending} onPress={conversation.cancel} style={styles.close}><Feather name="x" size={16} color={colors.muted} /></TouchableOpacity>
    </View> : null}
    {!updating && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.context}>{notice}</Text> : null}
    <View style={styles.row}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.avatar}><UserAvatar uri={user?.image_url} size={28} /></View>
      <View style={[styles.editor, !expanded && styles.collapsed]}>
        <TextInput ref={input} accessibilityLabel={updating ? 'New submission update' : 'Reply message'} editable={!sending} multiline maxLength={updating ? undefined : REPLY_MAX_LENGTH}
          placeholder={updating ? 'Post an update…' : 'Write a reply…'} placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} textAlignVertical="top" scrollEnabled
          value={message} onChangeText={updating ? conversation.changeUpdateDraft : conversation.changeDraft} style={styles.input} />
        {!expanded && staff ? <TouchableOpacity disabled={sending} accessibilityLabel="Update submission status" accessibilityHint="Create a new update with an optional status change" accessibilityRole="button" onPress={onStatus} style={styles.status}><Feather name="sliders" size={18} color={colors.blue} /></TouchableOpacity> : null}
      </View>
    </View>
    {expanded ? <View style={styles.fields}>
      {updating ? <TouchableOpacity disabled={sending} accessibilityLabel="Update submission status" accessibilityRole="button" onPress={onStatus} style={styles.status}><Feather name="sliders" size={16} color={colors.blue} /><Text style={styles.statusLabel}>Status (optional)</Text></TouchableOpacity> : <>
        <Text style={[styles.counter, count > REPLY_MAX_LENGTH && styles.error]}>{count} / {REPLY_MAX_LENGTH}</Text>
        {staff ? <TouchableOpacity style={styles.linkTouch} disabled={sending} accessibilityRole="button" accessibilityLabel="Write a new submission update" onPress={conversation.cancel}><Text style={styles.linkField}>New update</Text></TouchableOpacity> : <TouchableOpacity style={styles.linkTouch} accessibilityRole="button" accessibilityLabel={linkOpen ? 'Hide web link field' : 'Add web link'} accessibilityState={{ expanded: linkOpen, disabled: sending }} disabled={sending} onPress={() => setLinkOpen(value => !value)}><Feather name="link" size={16} color={colors.blue} /><Text style={styles.linkField}>{linkOpen ? 'Hide link' : url ? 'Edit link' : 'Add link'}</Text></TouchableOpacity>}
      </>}
      <View style={styles.sendColumn}>{sendButton}</View>
    </View> : null}
    {target && linkOpen && !onStatus ? <View style={styles.linkEditor}>
      <Feather name="link" size={15} color={colors.blue} />
      <AppInput accessibilityLabel="Web link" value={url} onChangeText={setUrl} placeholder="https://example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!sending} maxLength={REPLY_LINK_MAX_LENGTH} style={styles.linkInput} />
      <Text style={styles.counter}>{[...url].length}/{REPLY_LINK_MAX_LENGTH}</Text>
    </View> : null}
  </View>;
}
const styles = StyleSheet.create({
  surface: { padding: composerLayout.padding, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  avatar: { minHeight: composerLayout.minHeight, justifyContent: 'center' },
  editor: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.field, borderRadius: radii.field },
  collapsed: { borderRadius: radii.pill },
  input: { ...type.field, flex: 1, minWidth: 0, minHeight: composerLayout.minHeight, maxHeight: composerLayout.maxHeight, paddingHorizontal: space.md, paddingVertical: space.md, color: colors.text },
  target: { flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 4, minHeight: sizes.touch, gap: 8 },
  context: { ...type.meta, color: colors.muted, flexShrink: 1 }, close: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  sendColumn: { marginLeft: 'auto' }, disabled: { opacity: 0.4 },
  status: { minHeight: sizes.touch, minWidth: sizes.touch, paddingHorizontal: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs }, statusLabel: { ...type.compactLabel, color: colors.blue },
  sendTouch: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  send: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  counter: { ...type.meta, color: colors.muted, paddingHorizontal: 8 }, error: { ...type.meta, color: colors.danger, marginHorizontal: 6, marginBottom: 4 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingLeft: space.sm },
  linkTouch: { minHeight: sizes.touch, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm },
  linkField: { ...type.meta, color: colors.blue },
  linkEditor: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 4 },
  linkInput: { flex: 1, minWidth: 0, minHeight: sizes.input, paddingVertical: space.sm, paddingHorizontal: space.sm, ...type.field },
});
