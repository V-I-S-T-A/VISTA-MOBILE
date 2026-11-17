import { useState, useEffect, useRef, useMemo } from 'react';
import { Image, View } from 'react-native';
import { sizes } from '../../theme/tokens';
import { getOptimizedAvatarUrl } from '../../utils/imageUrl';

const fallback = require('../../assets/default_user.webp');

const MAX_AUTO_RETRIES = 1;

const safeSetTimeout = (fn, ms) => {
  if (typeof setTimeout === 'function') return setTimeout(fn, ms);
  return null;
};
const safeClearTimeout = (id) => {
  if (typeof clearTimeout === 'function') clearTimeout(id);
};

export default function UserAvatar({ uri, size = sizes.avatar, style, fallbackIcon }) {
  const [loadedUri, setLoadedUri] = useState(null);
  const [failedUri, setFailedUri] = useState(null);
  const [retryState, setRetryState] = useState({ uri: null, count: 0 });

  const rawUri = typeof uri === 'string' ? uri.trim() : null;
  const imageUri = rawUri || null;

  const optimizedUri = useMemo(() => {
    return imageUri ? getOptimizedAvatarUrl(imageUri, size) : null;
  }, [imageUri, size]);

  const isLoaded = Boolean(optimizedUri && loadedUri === optimizedUri);
  const isFailed = Boolean(optimizedUri && failedUri === optimizedUri);
  const currentRetryCount = retryState.uri === optimizedUri ? retryState.count : 0;

  const activeUriRef = useRef(optimizedUri);
  activeUriRef.current = optimizedUri;

  const retryTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        safeClearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [optimizedUri]);

  const handleLoad = () => {
    if (retryTimerRef.current) {
      safeClearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (activeUriRef.current === optimizedUri) {
      setLoadedUri(optimizedUri);
      setFailedUri(null);
    }
  };

  const handleError = () => {
    if (activeUriRef.current !== optimizedUri) {
      return;
    }
    if (currentRetryCount < MAX_AUTO_RETRIES) {
      setRetryState({ uri: optimizedUri, count: currentRetryCount + 1 });
      if (retryTimerRef.current) safeClearTimeout(retryTimerRef.current);
      retryTimerRef.current = safeSetTimeout(() => {
        retryTimerRef.current = null;
        if (activeUriRef.current === optimizedUri) {
          setFailedUri(null);
        }
      }, 1500);
    } else {
      if (retryTimerRef.current) {
        safeClearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      setFailedUri(optimizedUri);
    }
  };

  const containerStyle = [
    { backgroundColor: '#EAF0F7' },
    style,
    { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
  ];

  if (fallbackIcon && (!optimizedUri || isFailed)) {
    return (
      <View style={[containerStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        {fallbackIcon}
      </View>
    );
  }

  const activeSource = isLoaded && optimizedUri ? { uri: optimizedUri } : fallback;

  if (!optimizedUri || isFailed) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={fallback}
        resizeMode="cover"
        style={containerStyle}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityIgnoresInvertColors
      source={activeSource}
      style={[containerStyle, { position: 'relative' }]}
      onError={handleError}
      onLoad={handleLoad}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={fallback}
        fadeDuration={0}
        resizeMode="cover"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <Image
        key={`${optimizedUri}-try-${currentRetryCount}`}
        accessibilityIgnoresInvertColors
        source={{ uri: optimizedUri }}
        fadeDuration={0}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: isLoaded ? 1 : 0,
        }}
      />
    </View>
  );
}
