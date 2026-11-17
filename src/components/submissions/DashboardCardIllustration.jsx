import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, dashboardArt as art, dashboardLayout } from '../../theme/tokens';

// Native shapes stay sharp at every density and add no asset/network dependency.
// These illustrations are decorative; the card provides its full accessible name.
export default function DashboardCardIllustration({ kind, scale = dashboardLayout.artScale }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.canvas, { transformOrigin: 'bottom right', transform: [{ scale }, { rotate: kind === 'rejected' ? '12deg' : '-12deg' }] }]}>
    {kind === 'total' ? <>
      <View style={styles.folderTab} />
      <View style={styles.folderBack} />
      <View style={[styles.paper, { top: 3, right: 7, width: 62, height: 72 }]}>
        <View style={[styles.line, { width: 40, marginTop: 10 }]} />
        <View style={[styles.line, { width: 32 }]} />
      </View>
      <View style={styles.folderFront} />
    </> : kind === 'pending' ? <>
      <View style={styles.clockBell} />
      <View style={styles.clockRim}>
        <View style={styles.clockFace}>
          {[0, 90, 180, 270].map(angle => <View key={angle} style={[styles.clockTick, { transform: [{ rotate: `${angle}deg` }, { translateY: -25 }] }]} />)}
          <View style={styles.hourHand} /><View style={styles.minuteHand} /><View style={styles.clockPin} />
        </View>
      </View>
    </> : <>
      <View style={[styles.paper, { top: 4, right: 8, width: 64, height: 86 }]}>
        {kind === 'approved' ? <View style={styles.clip}><View style={styles.clipHole} /></View> : <View style={styles.fold} />}
        <View style={{ marginTop: 20, gap: 9 }}>
          {[0, 1, 2].map(row => <View key={row} style={styles.paperRow}>
            {kind === 'approved' ? <Feather name="check" size={13} color={art.goldEdge} /> : null}
            <View style={[styles.line, { width: kind === 'approved' ? 28 : row === 1 ? 28 : 40, marginBottom: 0 }]} />
          </View>)}
        </View>
        {kind === 'rejected' ? <View style={styles.seal}><Feather name="x" size={20} color={colors.danger} /></View> : null}
      </View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  canvas: { width: dashboardLayout.artSize, height: dashboardLayout.artSize },
  paper: { position: 'absolute', backgroundColor: art.paper, borderRadius: 6, paddingHorizontal: 9, borderRightWidth: 3, borderBottomWidth: 3, borderColor: art.paperEdge },
  line: { height: 3, borderRadius: 2, backgroundColor: art.line, marginBottom: 6 },
  paperRow: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  folderTab: { position: 'absolute', top: 17, left: 4, width: 38, height: 20, backgroundColor: art.goldLight, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  folderBack: { position: 'absolute', top: 27, left: 4, width: 82, height: 64, backgroundColor: art.goldLight, borderRadius: 7 },
  folderFront: { position: 'absolute', top: 39, left: 2, width: 85, height: 54, backgroundColor: art.gold, borderRadius: 6, borderTopWidth: 4, borderTopColor: art.goldLight, borderBottomWidth: 4, borderBottomColor: art.goldEdge },
  clip: { position: 'absolute', top: -6, left: 19, width: 25, height: 15, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: art.gold },
  clipHole: { position: 'absolute', top: 3, left: 9, width: 7, height: 5, borderRadius: 4, backgroundColor: art.paper },
  fold: { position: 'absolute', top: 0, right: 0, width: 15, height: 15, borderBottomLeftRadius: 3, backgroundColor: art.paperEdge },
  seal: { position: 'absolute', top: 49, right: 4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: art.seal },
  clockBell: { position: 'absolute', top: 1, right: 26, width: 27, height: 12, borderRadius: 8, backgroundColor: art.goldLight },
  clockRim: { position: 'absolute', top: 8, right: 1, width: 78, height: 78, borderRadius: 39, backgroundColor: art.gold, borderWidth: 4, borderColor: art.goldLight, alignItems: 'center', justifyContent: 'center' },
  clockFace: { width: 63, height: 63, borderRadius: 32, backgroundColor: art.paper, alignItems: 'center', justifyContent: 'center' },
  clockTick: { position: 'absolute', width: 3, height: 7, borderRadius: 2, backgroundColor: art.line },
  hourHand: { position: 'absolute', width: 5, height: 19, borderRadius: 3, bottom: 30, backgroundColor: art.ink },
  minuteHand: { position: 'absolute', height: 4, width: 24, borderRadius: 3, left: 31, backgroundColor: art.ink },
  clockPin: { width: 8, height: 8, borderRadius: 4, backgroundColor: art.goldEdge },
});
