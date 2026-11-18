import { useRef, useState } from 'react';
import AppBottomSheet from '../common/AppBottomSheet';
import ReviewDetailsActionCard from '../../screens/staff/reviewPanel/reviewPanelDetails/ReviewDetailsActionCard';

export default function StaffStatusSheet({ visible, submission, initialRemarks = '', onRemarksChange, onClose, onConfirmed, onQueued }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const close = () => { if (!lock.current) onClose(); };
  return <AppBottomSheet density="compact" visible={visible} title="New submission update" onClose={close} busy={busy}>
    <ReviewDetailsActionCard newUpdate visible={visible} submission={submission} initialRemarks={initialRemarks} onRemarksChange={onRemarksChange} onBusyChange={value => { lock.current = value; setBusy(value); }} onConfirmed={onConfirmed} onQueued={onQueued} />
  </AppBottomSheet>;
}
