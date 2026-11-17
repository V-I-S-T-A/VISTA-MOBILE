import { useCallback, useEffect, useRef, useState } from 'react';

// Keep the existing surface and its last content until its exit finishes. Actions
// still execute immediately; an interrupted exit cannot remove a reopened layer.
export default function useOverlayPresence(visible, content) {
  const [retained, setRetained] = useState(visible);
  const active = useRef(visible);
  const snapshot = useRef(content);
  active.current = visible;
  if (visible) snapshot.current = content;
  useEffect(() => { if (visible) setRetained(true); }, [visible]);
  const onHidden = useCallback(() => { if (!active.current) setRetained(false); }, []);
  return { present: visible || retained, content: visible ? content : snapshot.current, onHidden };
}
