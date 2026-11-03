import OverlayPortal, { useOverlayAvailable } from './OverlayPortal';
import { Modal, Platform, View } from 'react-native';
import VistaLoader from './VistaLoader';

export default function VistaProcessing({ visible, message = 'Saving your submission…', auth = false }) {
  const portal = useOverlayAvailable();
  const content = <>
    <View style={{ flex: 1, backgroundColor: auth ? '#FFFFFF' : '#102034CC', justifyContent: 'center' }}>
      {visible ? <VistaLoader fullScreen={auth} light={auth} message={message} /> : null}
    </View>
  </>;
  if (Platform.OS === 'android' && portal) return visible ? <OverlayPortal onRequestClose={() => {}}>{content}</OverlayPortal> : null;
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>{content}</Modal>;
}
