import { Image } from 'react-native';
import { space } from '../../theme/tokens';

// Google's unmodified product asset, bundled locally so branding works offline.
export default function GoogleDriveLogo({ size = space.xxxl, decorative = false }) {
  return <Image source={require('../../assets/google-drive.png')}
    style={{ width: size, height: size }} resizeMode="contain"
    accessible={!decorative} accessibilityRole="image"
    accessibilityLabel={decorative ? undefined : 'Google Drive'} />;
}
