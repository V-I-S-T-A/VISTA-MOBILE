import OverlayPortal, { useOverlayAvailable } from './OverlayPortal';
import { Animated, Modal, Platform } from 'react-native';
import VistaLoader from './VistaLoader';
import useOverlayPresence from '../../hooks/useOverlayPresence';
import useVisibilityProgress from '../../hooks/useVisibilityProgress';

function ProcessingSurface({ visible, message, auth, onHidden }) {
  const progress = useVisibilityProgress(visible, onHidden);
  return <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={{ flex: 1, opacity: progress, backgroundColor: auth ? '#FFFFFF' : '#102034CC', justifyContent: 'center' }}>
    <VistaLoader fullScreen={auth} light={auth} message={message} />
  </Animated.View>;
}

export default function VistaProcessing({ visible, message = 'Saving your submission…', auth = false }) {
  const portal = useOverlayAvailable();
  const presence = useOverlayPresence(visible, { message, auth });
  const content = <ProcessingSurface visible={visible} {...presence.content} onHidden={presence.onHidden} />;
  if (Platform.OS === 'android' && portal) return presence.present ? <OverlayPortal onRequestClose={() => {}}>{content}</OverlayPortal> : null;
  return <Modal visible={presence.present} transparent statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={() => {}}>{content}</Modal>;
}
