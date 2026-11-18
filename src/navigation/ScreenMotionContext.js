import { createContext } from 'react';

// Account chrome can cancel a tab's horizontal movement without becoming sticky
// during ordinary vertical scrolling. Nested push/pop screens keep their motion.
export const ScreenMotionContext = createContext(null);
