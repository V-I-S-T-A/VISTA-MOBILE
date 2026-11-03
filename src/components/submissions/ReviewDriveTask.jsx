import { useEffect } from 'react';
import { Text } from '../common/FontText';
import { useDriveUploadStatus } from '../../hooks/useDrive';
import { colors, type } from '../../theme/tokens';

export default function ReviewDriveTask({ task, onComplete }) {
  const result = useDriveUploadStatus(task.taskId);
  const status = result.data?.status;
  useEffect(() => { if (status && status !== 'pending') onComplete(); }, [status, onComplete]);
  return <Text accessibilityLiveRegion="polite" style={{ ...type.meta, color: status === 'error' || result.isError ? colors.danger : colors.muted }}>
    {task.name}: {result.isError ? 'Could not check upload. Open Notifications for its latest state.' : status === 'success' ? result.data.detail || 'Archive confirmed by server.' : status === 'error' ? result.data.detail || 'Archive failed.' : 'Drive upload queued; archive not yet confirmed.'}
  </Text>;
}
