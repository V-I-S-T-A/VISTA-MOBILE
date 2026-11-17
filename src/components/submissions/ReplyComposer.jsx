import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text, TextInput } from '../common/FontText';
import AppInput from '../common/AppInput';
import AppModal from '../common/AppModal';
import AppButton from '../common/AppButton';
import UserAvatar from '../common/UserAvatar';
import { colors, sizes, type, radii, space, composerLayout } from '../../theme/tokens';
import { REPLY_MAX_LENGTH, REPLY_LINK_MAX_LENGTH, safeWebUrl } from './conversationPolicy.cjs';

export default function ReplyComposer({ conversation, onStatus, user }) {
  const { target, draft, sending, error, notice } = conversation;
  const input = useRef(null);
  const linkInput = useRef(null);
  const validationLock = useRef(false);
  const validationFocus = useRef(null);
  const [validation, setValidation] = useState(null);
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
  useEffect(() => { setLinkOpen(!!conversation.link); setValidation(null); validationLock.current = false; validationFocus.current = null; }, [target]);
  const count = [...message].length;
  const linkCount = [...url].length;
  const valid = (!!message.trim() || !!url.trim()) && (updating || (count <= REPLY_MAX_LENGTH && linkCount <= REPLY_LINK_MAX_LENGTH));
  const disabled = sending || !valid;
  const showValidation = (field, title, detail) => {
    if (validationLock.current) return;
    validationLock.current = true;
    Keyboard.dismiss();
    setValidation({ field, title, detail });
  };
  const changeMessage = value => {
    if (updating) { conversation.changeUpdateDraft(value); return; }
    conversation.changeDraft(value);
    if ([...value].length > REPLY_MAX_LENGTH && count <= REPLY_MAX_LENGTH) {
      showValidation('message', 'Shorten your reply', `Replies can contain up to ${REPLY_MAX_LENGTH} characters. Your text has been kept so you can edit it before sending.`);
    }
  };
  const changeUrl = value => {
    setUrl(value);
    if ([...value].length > REPLY_LINK_MAX_LENGTH && linkCount <= REPLY_LINK_MAX_LENGTH) {
      showValidation('link', 'Use a shorter link', `Links can contain up to ${REPLY_LINK_MAX_LENGTH} characters. Your link has been kept so you can edit or replace it.`);
    }
  };
  const dismissValidation = () => {
    validationFocus.current = validation?.field;
    validationLock.current = false; setValidation(null);
  };
  const restoreValidationFocus = () => {
    const field = validationFocus.current;
    validationFocus.current = null;
    if (field) (field === 'link' ? linkInput : input).current?.focus();
  };
  const send = () => {
    if (disabled) return;
    if (updating) { onStatus(); return; }
    if (url.trim() && !safeWebUrl(url)) {
      showValidation('link', 'Check your link', 'Enter a complete web address beginning with https:// or http:// before sending your reply.');
      return;
    }
    conversation.send(url);
  };
  // Students cannot create top-level updates, even if mounted without a target.
  if (!staff && !target) return null;
  const sendButton = <TouchableOpacity disabled={disabled} accessibilityState={{ disabled }} accessibilityRole="button" accessibilityLabel={updating ? 'Review new update' : 'Send reply'} accessibilityHint={updating ? 'Choose an optional status and confirm before posting' : undefined} onPress={send} style={[styles.sendTouch, disabled && styles.disabled]}>
    <View style={styles.send}>{sending ? <ActivityIndicator color={colors.surface} /> : <Feather name="arrow-up" size={18} color={colors.surface} />}</View>
  </TouchableOpacity>;
  return <View style={styles.surface}>
    {target ? <View style={styles.target}>
      <Text numberOfLines={1} style={[styles.context, styles.targetName]}>Replying to {target.name}</Text>
      <Text accessibilityLabel={`Reply characters: ${count} of ${REPLY_MAX_LENGTH}`} style={[styles.counter, count > REPLY_MAX_LENGTH && styles.limitError]}>{count} / {REPLY_MAX_LENGTH}</Text>
      <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel="Close reply, keep draft" disabled={sending} onPress={conversation.cancel} style={styles.close}><Feather name="x" size={16} color={colors.muted} /></TouchableOpacity>
    </View> : null}
    {!updating && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.context}>{notice}</Text> : null}
    <View style={styles.row}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.avatar}><UserAvatar uri={user?.image_url} size={28} /></View>
      <View style={[styles.editor, !expanded && styles.collapsed]}>
        <TextInput ref={input} accessibilityLabel={updating ? 'New submission update' : 'Reply message'} editable={!sending} multiline
          placeholder={updating ? 'Post an update…' : 'Write a reply…'} placeholderTextColor={colors.placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} textAlignVertical="top" scrollEnabled
          value={message} onChangeText={changeMessage} style={styles.input} />
        {!expanded && staff ? <TouchableOpacity disabled={sending} accessibilityLabel="Update submission status" accessibilityHint="Create a new update with an optional status change" accessibilityRole="button" onPress={onStatus} style={styles.status}><Feather name="sliders" size={18} color={colors.blue} /></TouchableOpacity> : null}
      </View>
      {!updating ? <View style={styles.replyActions}>
        {staff ? <TouchableOpacity style={styles.iconTouch} disabled={sending} accessibilityRole="button" accessibilityLabel="Write a new submission update" accessibilityHint="Leave this reply and restore your new update draft" onPress={conversation.cancel}><Feather name="edit-3" size={sizes.icon} color={colors.blue} /></TouchableOpacity>
          : <TouchableOpacity style={styles.iconTouch} accessibilityRole="button" accessibilityLabel={linkOpen ? 'Hide web link field' : 'Add web link'} accessibilityState={{ expanded: linkOpen, disabled: sending }} disabled={sending} onPress={() => setLinkOpen(value => !value)}><Feather name="link" size={sizes.icon} color={colors.blue} /></TouchableOpacity>}
        {sendButton}
      </View> : null}
    </View>
    {expanded && updating ? <View style={styles.fields}>
      <TouchableOpacity disabled={sending} accessibilityLabel="Update submission status" accessibilityRole="button" onPress={onStatus} style={styles.status}><Feather name="sliders" size={16} color={colors.blue} /><Text style={styles.statusLabel}>Status (optional)</Text></TouchableOpacity>
      <View style={styles.sendColumn}>{sendButton}</View>
    </View> : null}
    {target && linkOpen && !onStatus ? <View style={styles.linkEditor}>
      <Feather name="link" size={15} color={colors.blue} />
      <AppInput ref={linkInput} accessibilityLabel="Web link" value={url} onChangeText={changeUrl} placeholder="https://example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" editable={!sending} error={linkCount > REPLY_LINK_MAX_LENGTH} style={styles.linkInput} />
      <Text accessibilityLabel={`Link characters: ${linkCount} of ${REPLY_LINK_MAX_LENGTH}`} style={[styles.counter, linkCount > REPLY_LINK_MAX_LENGTH && styles.limitError]}>{linkCount}/{REPLY_LINK_MAX_LENGTH}</Text>
    </View> : null}
    <AppModal visible={!!validation} onClose={dismissValidation} onDismiss={restoreValidationFocus}>
      <View style={styles.validationIcon}><Feather name={validation?.field === 'link' ? 'link' : 'message-square'} size={space.xxl} color={colors.blue} /></View>
      <Text accessibilityRole="header" style={styles.validationTitle}>{validation?.title}</Text>
      <Text accessibilityRole="alert" style={styles.validationDetail}>{validation?.detail}</Text>
      <AppButton label={validation?.field === 'link' ? 'Edit link' : 'Edit reply'} onPress={dismissValidation} />
    </AppModal>
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
  context: { ...type.meta, color: colors.muted, flexShrink: 1 }, targetName: { flex: 1, minWidth: 0 }, close: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  replyActions: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' },
  iconTouch: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  sendColumn: { marginLeft: 'auto' }, disabled: { opacity: 0.4 },
  status: { minHeight: sizes.touch, minWidth: sizes.touch, paddingHorizontal: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs }, statusLabel: { ...type.compactLabel, color: colors.blue },
  sendTouch: { width: sizes.touch, height: sizes.touch, alignItems: 'center', justifyContent: 'center' },
  send: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  counter: { ...type.meta, color: colors.muted, paddingHorizontal: 8 }, error: { ...type.meta, color: colors.danger, marginHorizontal: 6, marginBottom: 4 },
  limitError: { color: colors.danger },
  fields: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingLeft: space.sm },
  linkEditor: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingBottom: 4 },
  linkInput: { flex: 1, minWidth: 0, minHeight: sizes.input, paddingVertical: space.sm, paddingHorizontal: space.sm, ...type.field },
  validationIcon: { width: sizes.touch, height: sizes.touch, borderRadius: radii.field, backgroundColor: colors.selectedSurface, alignItems: 'center', justifyContent: 'center' },
  validationTitle: { ...type.heading, color: colors.text },
  validationDetail: { ...type.body, color: colors.muted, marginBottom: space.sm },
});
