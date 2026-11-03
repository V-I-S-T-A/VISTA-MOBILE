import { useRef, useState } from 'react';
import AppBottomSheet from '../common/AppBottomSheet';
import ReviewDetailsActionCard from '../../screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard';

export default function StaffStatusSheet({ visible, submission, onClose, onConfirmed, onQueued }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const close = () => { if (!lock.current) onClose(); };
  return <AppBottomSheet density="compact" visible={visible} title="Update submission" onClose={close} busy={busy}>
    <ReviewDetailsActionCard submission={submission} onBusyChange={value => { lock.current = value; setBusy(value); }} onConfirmed={onConfirmed} onQueued={onQueued} />
  </AppBottomSheet>;
}
