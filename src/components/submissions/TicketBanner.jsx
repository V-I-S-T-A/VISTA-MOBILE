import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

// The reference is a wide ticket strip, rather than a full 16:9 hero image.
const BANNER_RATIO = 3.35;

export default function TicketBanner() {
  const [width, setWidth] = useState(0);
  const height = width > 0 ? Math.max(80, Math.min(160, width / BANNER_RATIO)) : 96;
  const imageHeight = Math.max(height, width * 941 / 1672);
  return <View onLayout={({ nativeEvent }) => {
    const measured = nativeEvent.layout.width;
    if (measured > 0) setWidth(measured);
  }} style={[styles.frame, { height }]}>
    <Image source={require('../../assets/ticket-staff-cosmic.webp')}
      accessibilityLabel="Cosmic campus illustration"
      resizeMode="cover" style={[styles.image, { height: imageHeight, top: -(imageHeight - height) * 0.72 }]} />
  </View>;
}

const styles = StyleSheet.create({
  frame: { width: '100%', flexShrink: 0, borderRadius: 16, overflow: 'hidden', backgroundColor: '#D7E8FA' },
  // Android prepends the asset's intrinsic width/height to Image styles. Both
  // dimensions must be overridden, even when aspectRatio is specified elsewhere.
  // Keep the source's proportions and favor the lower part of both scenes so
  // the student faces/bodies remain visible in the clipped horizontal strip.
  image: { position: 'absolute', left: 0, width: '100%' },
});
