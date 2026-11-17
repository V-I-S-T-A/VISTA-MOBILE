import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import OverlayPortal, { useOverlayAvailable } from '../common/OverlayPortal';
import { Text } from '../common/FontText';
import { colors, radii, sizes, space, type, motion } from '../../theme/tokens';
import { attachmentPreview } from './attachmentPreviewPolicy.cjs';

function Action({ label, icon, disabled, onPress, iconOnly = false }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.action, disabled && { opacity: motion.disabledOpacity }]}>
    {icon ? <Feather name={icon} size={sizes.icon} color={colors.onBrand} /> : null}
    {!iconOnly ? <Text style={styles.actionText}>{label}</Text> : null}
  </TouchableOpacity>;
}

function PreviewContent({ document, onClose }) {
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const viewport = Math.max(sizes.touch, dimensions.width - insets.left - insets.right - space.lg * 2);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [ratio, setRatio] = useState(1.4);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [openError, setOpenError] = useState('');
  const [opening, setOpening] = useState(false);
  const openingLock = useRef(false);
  const { originalUrl, previewUrl, paged } = attachmentPreview(document, page);
  const name = document.file_name || 'Attached document';
  const changePage = next => { setPage(next); setZoom(1); setLoading(true); setFailed(false); };
  const openOriginal = async () => {
    if (!originalUrl || openingLock.current) return;
    openingLock.current = true; setOpening(true); setOpenError('');
    try { await Linking.openURL(originalUrl); }
    catch { setOpenError('Could not open the original file. Please try again.'); }
    finally { openingLock.current = false; setOpening(false); }
    // Returning/cancelling the Android chooser never closes the preview.
  };
  const body = <View accessibilityViewIsModal style={[styles.screen, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: Math.max(insets.bottom, space.sm) }]}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}>
      <Text numberOfLines={2} style={[styles.title, { flex: 1 }]}>{name}</Text>
      <Action label="Close preview" icon="x" iconOnly onPress={onClose} />
    </View>
    <View style={styles.toolbar}>
      <Action label={opening ? 'Opening…' : 'Open or download'} icon="external-link" disabled={!originalUrl || opening} onPress={openOriginal} />
      {previewUrl ? <View style={styles.zoom}>
        <Action label="Zoom out" icon="minus" iconOnly disabled={zoom <= 1} onPress={() => setZoom(value => Math.max(1, value - 0.5))} />
        <Text accessibilityLiveRegion="polite" style={styles.actionText}>{Math.round(zoom * 100)}%</Text>
        <Action label="Zoom in" icon="plus" iconOnly disabled={zoom >= 3} onPress={() => setZoom(value => Math.min(3, value + 0.5))} />
      </View> : null}
    </View>
    {openError ? <Text accessibilityRole="alert" style={styles.notice}>{openError}</Text> : null}
    {!previewUrl || failed ? <View style={styles.state}>
      <Feather name="file-text" size={space.xxxl} color={colors.onBrand} />
      <Text accessibilityRole="alert" style={styles.title}>{previewUrl ? 'Could not load preview' : 'In-app preview unavailable'}</Text>
      <Text style={styles.help}>{previewUrl ? (paged && page > 1 ? `Page ${page} could not be loaded. It may be the end of this document, or the connection may be unavailable. You can return to the previous page or retry.` : 'Check your connection and retry. You can also open or download the original file.') : 'This file format or delivery link cannot be previewed here. Use Open or download to view the original.'}</Text>
      {previewUrl ? <Action label="Retry preview" icon="refresh-cw" onPress={() => { setFailed(false); setLoading(true); setAttempt(value => value + 1); }} /> : null}
    </View> : <View style={styles.viewer}>
      {loading ? <View pointerEvents="none" style={styles.loading}><ActivityIndicator color={colors.onBrand} /><Text style={styles.actionText}>Loading preview…</Text></View> : null}
      <ScrollView key={`${page}:${zoom}`} contentContainerStyle={styles.verticalContent}>
        <ScrollView horizontal contentContainerStyle={styles.horizontalContent}>
          <Image key={`${previewUrl}:${attempt}`} source={{ uri: previewUrl }} accessibilityLabel={`Preview of ${name}${paged ? `, page ${page}` : ''}`} resizeMode="contain"
            style={{ width: viewport * zoom, height: viewport * zoom * ratio, backgroundColor: colors.surface }}
            onLoad={event => { const source = event.nativeEvent.source; if (source?.width > 0 && source?.height > 0) setRatio(source.height / source.width); setLoading(false); }}
            onError={() => { setLoading(false); setFailed(true); }} />
        </ScrollView>
      </ScrollView>
    </View>}
    {paged ? <View style={styles.pages}>
      <Action label="Previous page" icon="chevron-left" disabled={page === 1} onPress={() => changePage(page - 1)} />
      <Text accessibilityLiveRegion="polite" style={styles.actionText}>Page {page}</Text>
      <Action label="Next page" icon="chevron-right" disabled={loading || failed} onPress={() => changePage(page + 1)} />
    </View> : null}
  </View>;
  return body;
}

export default function AttachmentPreview({ document, onClose }) {
  const available = useOverlayAvailable();
  if (!document) return null;
  const content = <PreviewContent key={document.document_id || document.file_url} document={document} onClose={onClose} />;
  return Platform.OS === 'android' && available ? <OverlayPortal onRequestClose={onClose}>{content}</OverlayPortal>
    : <Modal visible statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>{content}</Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm },
  title: { ...type.sectionTitle, color: colors.onBrand, flexShrink: 1 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm },
  action: { minHeight: sizes.touch, minWidth: sizes.touch, paddingHorizontal: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, borderRadius: radii.chip },
  actionText: { ...type.meta, color: colors.onBrand },
  zoom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  viewer: { flex: 1, minHeight: 0 },
  verticalContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: space.sm },
  horizontalContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: space.lg },
  loading: { position: 'absolute', top: space.md, alignSelf: 'center', zIndex: 1, padding: space.sm, borderRadius: radii.chip, backgroundColor: colors.navy, gap: space.sm },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xxl, gap: space.md },
  help: { ...type.body, color: colors.onProfileMuted, textAlign: 'center', maxWidth: sizes.contentWidth },
  notice: { ...type.body, color: colors.yellow, paddingHorizontal: space.lg },
  pages: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.sm },
});
