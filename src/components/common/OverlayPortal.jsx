import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, View, StyleSheet } from 'react-native';

const OverlayContext = createContext(null);
const ActiveOverlayContext = createContext(true);
export const useOverlayAvailable = () => !!useContext(OverlayContext);
export const useOverlayActive = () => useContext(ActiveOverlayContext);

// A single activity window keeps Android immersive insets stable. Retain lower
// layers mounted so a nested confirmation cannot discard the parent's draft.
export function OverlayProvider({ children }) {
  const [layers, setLayers] = useState([]);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const subscribers = useRef(new Set());
  useEffect(() => {
    subscribers.current.forEach(listener => listener(layers.length > 0));
  }, [layers.length]);

  const manager = useMemo(() => ({
    upsert(id, content, onRequestClose) {
      setLayers(current => {
        const index = current.findIndex(layer => layer.id === id);
        const layer = { id, content, onRequestClose };
        if (index < 0) return [...current, layer];
        const next = [...current]; next[index] = layer; return next;
      });
    },
    remove(id) { setLayers(current => current.filter(layer => layer.id !== id)); },
    hasOverlay() { return layersRef.current.length > 0; },
    subscribe(listener) {
      subscribers.current.add(listener);
      return () => { subscribers.current.delete(listener); };
    },
  }), []);
  const top = layers[layers.length - 1];
  useEffect(() => {
    if (!top) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { top.onRequestClose?.(); return true; });
    return () => listener.remove();
  }, [top]);
  return <OverlayContext.Provider value={manager}>
    <View style={{ flex: 1 }} accessibilityElementsHidden={!!top} importantForAccessibility={top ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {layers.map((layer, index) => <View key={layer.id} style={StyleSheet.absoluteFill} pointerEvents={index === layers.length - 1 ? 'auto' : 'none'} accessibilityElementsHidden={index !== layers.length - 1} importantForAccessibility={index === layers.length - 1 ? 'auto' : 'no-hide-descendants'} accessibilityViewIsModal={index === layers.length - 1}>
      <ActiveOverlayContext.Provider value={index === layers.length - 1}>{layer.content}</ActiveOverlayContext.Provider>
    </View>)}
  </OverlayContext.Provider>;
}


export function useIsOverlayOpen() {
  const manager = useContext(OverlayContext);
  const [open, setOpen] = useState(() => (typeof manager?.hasOverlay === 'function' ? manager.hasOverlay() : false));
  useEffect(() => {
    if (!manager?.subscribe) return;
    setOpen(manager.hasOverlay());
    return manager.subscribe(setOpen);
  }, [manager]);
  return open;
}

export default function OverlayPortal({ children, onRequestClose }) {
  const manager = useContext(OverlayContext);
  const id = useRef(null);
  if (!id.current) id.current = `overlay-${nextOverlayId++}`;
  useEffect(() => { manager?.upsert(id.current, children, onRequestClose); }, [manager, children, onRequestClose]);
  useEffect(() => () => manager?.remove(id.current), [manager]);
  return null;
}
let nextOverlayId = 1;
