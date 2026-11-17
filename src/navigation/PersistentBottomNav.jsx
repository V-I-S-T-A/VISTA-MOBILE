import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { createBottomNavStore } from './bottomNavStore.cjs';

const BottomNavContext = createContext(null);

export function PersistentBottomNav({ children }) {
  const store = useContext(BottomNavContext);
  const owner = useRef({}).current;
  const focused = typeof useIsFocused === 'function' ? useIsFocused() : true;
  useLayoutEffect(() => {
    if (store && focused) store.publish(owner, children);
  }, [store, owner, focused, children]);
  useLayoutEffect(() => () => store?.release(owner), [store, owner]);
  // Standalone screens/previews still work without the navigator layout.
  return store ? null : children;
}

export function BottomNavHost({ store, visible }) {
  const [element, setElement] = useState(store.getSnapshot);
  useLayoutEffect(() => {
    const unsubscribe = store.subscribe(setElement);
    setElement(store.getSnapshot());
    return unsubscribe;
  }, [store]);
  return visible ? element : null;
}

export function BottomNavLayout({ children, state, descriptors }) {
  const store = useRef(null);
  if (!store.current) store.current = createBottomNavStore();
  const route = state.routes[state.index];
  const visible = Boolean(descriptors[route.key]?.options?.bottomNav);
  return <BottomNavContext.Provider value={store.current}>
    <View style={{ flex: 1 }}>
      {children}
      <BottomNavHost store={store.current} visible={visible} />
    </View>
  </BottomNavContext.Provider>;
}

export const bottomNavLayout = props => <BottomNavLayout {...props} />;
