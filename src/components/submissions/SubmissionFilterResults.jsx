import { View } from 'react-native';
import { SubmissionListSkeleton } from '../common/Skeleton';
import useNavigationContentReady from '../../hooks/useNavigationContentReady';

// Only the result body is deferred. Filters and queries update immediately;
// cached rows mount in a background render instead of blocking the selection.
export default function SubmissionFilterResults({ filterKey, loading = false, children }) {
  const contentReady = useNavigationContentReady(filterKey);
  const pending = loading || !contentReady;
  // Readable results must not depend on completion of an opacity animation.
  // Keep the navigator's page motion; this boundary only swaps loading/content.
  return <View>
    {pending ? <SubmissionListSkeleton count={5} /> : children}
  </View>;
}
