import { useState } from 'react';
import { Image, View } from 'react-native';
import { sizes } from '../../theme/tokens';

const fallback = require('../../assets/default_user.webp');

export default function UserAvatar({ uri, size = sizes.avatar, style, fallbackIcon }) {
  const [failedUri, setFailedUri] = useState(null);
  const imageUri = typeof uri === 'string' && uri.trim() ? uri.trim() : null;
  if (fallbackIcon && (!imageUri || failedUri === imageUri)) return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{fallbackIcon}</View>;
  return <Image
    accessibilityIgnoresInvertColors
    source={imageUri && failedUri !== imageUri ? { uri: imageUri } : fallback}
    onError={() => setFailedUri(imageUri)}
    resizeMode="cover"
    style={[{ backgroundColor: '#EAF0F7' }, style, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}
  />;
}
