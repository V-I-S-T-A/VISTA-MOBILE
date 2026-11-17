import { useRef, useState } from 'react';

// A fresh app session always starts with the welcome tour. Completing it never
// changes saved credentials, and background/foreground resumes do not reset it.
export default function useOnboarding() {
  const [completed, setCompleted] = useState(false);
  const finishing = useRef(false);
  const complete = async () => {
    if (finishing.current) return;
    finishing.current = true;
    setCompleted(true);
  };
  return { ready: true, completed, complete };
}
