import { Linking, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { AppAlert as Alert } from '../common/AppDialog';
import AppButton from '../common/AppButton';
import GoogleDriveLogo from '../common/GoogleDriveLogo';
import UserAvatar from '../common/UserAvatar';
import { surfaces, panelStyles } from '../../theme/layout';
import { colors, radii, sizes, space, statusTones, type } from '../../theme/tokens';
import { safeWebUrl } from '../submissions/conversationPolicy.cjs';

async function openArchive(archive) {
  const url = safeWebUrl(archive.drive_view_link);
  if (!url) return;
  try { await Linking.openURL(url); }
  catch { Alert.alert('Could not open Google Drive', 'Please check your connection and try again.'); }
}

function PathStep({ name, index }) {
  const label = name.toLowerCase() === 'approved' ? 'Approved' : ['Year', 'Organization', 'File type'][index] || 'Subfolder';
  return <View style={[styles.pathStep, { marginLeft: Math.min(index, 2) * space.sm }]}>
    <Feather name="folder" size={sizes.icon} color={colors.warning} />
    <View style={styles.flex}>
      <Text style={styles.pathName}>{name}</Text>
      <Text style={styles.pathLabel}>{label}</Text>
    </View>
  </View>;
}

function SavedArchive({ archive, handlerName }) {
  const path = Array.isArray(archive.folder_path) ? archive.folder_path.filter(name => typeof name === 'string' && name.trim()) : [];
  const archiver = archive.archived_by_name?.trim();
  const handled = handlerName || archiver || 'Staff member';
  const name = archive.file_name || 'Archived file';
  const report = archive.upload_kind === 'report';
  return <View style={styles.archive}>
    <View style={styles.root}>
      <View style={styles.rootIcon}><Feather name="hard-drive" size={sizes.icon} color={colors.blue} /></View>
      <View style={styles.flex}>
        <Text style={styles.label}>Root storage folder</Text>
        <Text style={styles.pathName}>{archive.root_folder_name || 'Google Drive folder'}</Text>
      </View>
    </View>
    <View style={styles.path}>
      <Text style={styles.label}>{path.length ? 'Automated subfolder path' : 'Drive folder'}</Text>
      {path.length ? <View style={styles.tree}>
        {path.map((segment, index) => <PathStep key={index} name={segment} index={index} />)}
      </View> : <Text style={styles.support}>Folder path details are unavailable for this archive.</Text>}
    </View>
    <View style={styles.file}>
      <View style={styles.fileHeading}>
        <Feather name="file-text" size={sizes.icon} color={colors.success} />
        <Text selectable style={[styles.pathName, styles.flex]}>{name}</Text>
      </View>
      <Text style={[styles.fileKind, report && styles.reportKind]}>{report ? 'Accomplishment Report' : 'Approved File'}</Text>
      <Text style={styles.support}>Handled by <Text style={styles.handler}>{handled}</Text></Text>
      {archiver && archiver !== handled ? <Text style={styles.support}>Archived by <Text style={styles.handler}>{archiver}</Text></Text> : null}
      {safeWebUrl(archive.drive_view_link) ? <AppButton label="Open in Drive" accessibilityRole="link" accessibilityLabel={`Open ${name} in Google Drive`} variant="secondary" style={styles.open} onPress={() => openArchive(archive)}>
        <View style={styles.openContent}><Text style={styles.openText}>Open in Drive</Text><Feather name="external-link" size={sizes.icon} color={colors.blue} /></View>
      </AppButton> : <Text style={styles.support}>Drive link unavailable</Text>}
    </View>
  </View>;
}

// Read-only saved metadata, as on web. Uploads remain in the Post update sheet;
// neither a queued task nor the current Drive connection proves an archive exists.
export default function DriveArchiveCard({ submission, handledBy }) {
  if ((submission?.status || '').toLowerCase() !== 'approved') return null;
  const archives = Array.isArray(submission.drive_archives) ? submission.drive_archives : [];
  const handlerName = typeof handledBy === 'string' ? handledBy.trim() : handledBy?.changed_by_name?.trim();
  if (!archives.length && !handlerName) return null;
  return <View style={[surfaces.card, panelStyles.card, styles.panel]}>
    <View style={styles.headingRow}>
      <GoogleDriveLogo size={space.xxl} decorative />
      <Text accessibilityRole="header" style={styles.heading}>Google Drive archive</Text>
    </View>
    <View accessibilityLabel={archives.length ? 'Archive complete' : 'Approval recorded'} style={[styles.badge, !archives.length && styles.recordedBadge]}>
      <Feather name={archives.length ? 'check-circle' : 'user-check'} size={space.lg} color={archives.length ? colors.success : colors.blue} />
      <Text style={[styles.badgeText, !archives.length && styles.recordedText]}>{archives.length ? 'Archived to Drive' : 'Approval recorded'}</Text>
    </View>
    {archives.length ? <>
      {archives.map(archive => <SavedArchive key={archive.archive_id || archive.drive_file_id} archive={archive} handlerName={handlerName} />)}
      <Text style={styles.support}>This location was saved after the file was archived to Google Drive.</Text>
    </> : <>
      <View style={styles.root}>
        <UserAvatar uri={handledBy?.changed_by_image_url} size={space.xxxl} />
        <View style={styles.flex}><Text style={styles.label}>Approved submission handled by</Text><Text style={styles.pathName}>{handlerName}</Text></View>
      </View>
      <Text style={styles.support}>VISTA has no saved Google Drive location or file link for this entry.</Text>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: space.md },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  heading: { ...type.cardTitle, color: colors.text, flex: 1, minWidth: 0 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radii.pill, backgroundColor: statusTones.approved.background, maxWidth: '100%' },
  badgeText: { ...type.compactLabel, color: colors.success, flexShrink: 1 },
  recordedBadge: { backgroundColor: colors.selectedSurface }, recordedText: { color: colors.blue },
  archive: { gap: space.md },
  root: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radii.chip, backgroundColor: colors.selectedSurface },
  rootIcon: { width: sizes.avatar, height: sizes.avatar, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  label: { ...type.meta, color: colors.muted, marginBottom: space.xs },
  pathName: { ...type.listTitle, color: colors.text },
  path: { paddingHorizontal: space.xs, gap: space.xs },
  tree: { borderLeftWidth: 1, borderColor: colors.border, paddingLeft: space.sm, gap: space.sm },
  pathStep: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  pathLabel: { ...type.meta, color: colors.blue },
  file: { padding: space.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.field, gap: space.sm },
  fileHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  fileKind: { ...type.meta, color: colors.success, alignSelf: 'flex-start', backgroundColor: statusTones.approved.background, paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radii.chip },
  reportKind: { color: colors.blue, backgroundColor: colors.selectedSurface },
  support: { ...type.meta, color: colors.muted }, handler: { fontFamily: type.medium, color: colors.text },
  open: { backgroundColor: colors.selectedSurface, borderRadius: radii.chip },
  openContent: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  openText: { ...type.button, color: colors.blue, flexShrink: 1 },
});
