import { forwardRef, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, FlatList, Keyboard, Platform, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { cancelAnimation, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector, nativeGesturesAvailable } from '../../lib/nativeGestures';
import { useIsFocused } from '@react-navigation/native';
import { useIsOverlayOpen } from './OverlayPortal';
import { NavigationTransitionContext } from '../../navigation/NavigationTransitionContext';
import useReducedMotion from '../../hooks/useReducedMotion';
import VistaIcon from './VistaIcon';
import { colors, sizes } from '../../theme/tokens';
import { dragDirection } from '../../utils/gestureDirection.cjs';
import { PULL_REFRESH, resistedPull } from '../../utils/pullRefreshPolicy.cjs';
import { space } from '../../theme/tokens';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { ScreenMotionContext } from '../../navigation/ScreenMotionContext';

const RETURN_SPRING = { stiffness: 240, damping: 26, mass: 0.8, overshootClamping: true };

function AndroidPullRefresh({ ScrollComponent, scrollRef, headerOffset, indicatorOffset = 0, ...props }) {
  const control = props.refreshControl.props;
  const focused = useIsFocused();
  const overlay = useIsOverlayOpen();
  const reduced = useReducedMotion();
  const transition = useContext(NavigationTransitionContext);
  const [screenReader, setScreenReader] = useState(true);
  const [keyboard, setKeyboard] = useState(() => Keyboard.isVisible?.() || false);
  const [pending, setPending] = useState(false);
  const translation = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const momentum = useSharedValue(false);
  const eligible = useSharedValue(false);
  const busy = useSharedValue(false);
  const active = useSharedValue(false);
  const startX = useSharedValue(0), startY = useSharedValue(0);
  const initialDistance = useSharedValue(0);
  const custom = !screenReader && !reduced;
  const state = useRef(null);
  const mounted = useRef(true);
  const fetching = useRef(false);
  state.current = { props, control, focused, overlay, keyboard, custom, reduced, transition };

  const allowed = () => {
    const s = state.current;
    return mounted.current && s.focused && !s.overlay && !s.keyboard && !s.transition?.isActive() && s.control.enabled !== false && s.props.scrollEnabled !== false;
  };
  const returnTo = value => {
    translation.value = state.current.reduced ? value : withSpring(value, RETURN_SPRING);
  };
  const request = () => {
    if (fetching.current || state.current.control.refreshing || !allowed()) {
      busy.value = fetching.current || !!state.current.control.refreshing;
      returnTo(0);
      return;
    }
    fetching.current = true; busy.value = true; setPending(true);
    const refresh = state.current.control.onRefresh;
    // Keep the screen's existing fetch/cache/error handling and single-flight
    // callback. A second release cannot race the controlled refreshing prop.
    Promise.resolve().then(() => { if (allowed()) return refresh?.(); }).catch(() => {}).finally(() => {
      fetching.current = false;
      if (!mounted.current) return;
      setPending(false);
      busy.value = !!state.current.control.refreshing;
      returnTo(state.current.control.refreshing && state.current.custom && allowed() ? PULL_REFRESH.hold : 0);
    });
  };

  useEffect(() => {
    mounted.current = true;
    let live = true, revision = 0;
    const reader = AccessibilityInfo.addEventListener('screenReaderChanged', value => {
      revision++; if (live) setScreenReader(value);
    });
    const initialRevision = revision;
    AccessibilityInfo.isScreenReaderEnabled().then(value => { if (live && revision === initialRevision) setScreenReader(value); }).catch(() => {});
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      live = false; mounted.current = false; eligible.value = false;
      reader.remove(); show.remove(); hide.remove(); cancelAnimation(translation);
    };
  }, [translation, eligible]);
  useEffect(() => {
    const update = () => {
      eligible.value = custom && allowed();
      if (!eligible.value) { active.value = false; returnTo(0); }
    };
    update();
    return transition?.subscribe(update);
  }, [focused, overlay, keyboard, custom, control.enabled, props.scrollEnabled, transition]);
  useEffect(() => {
    busy.value = !!control.refreshing || fetching.current;
    if (control.refreshing && custom && allowed()) returnTo(PULL_REFRESH.hold);
    else if (!control.refreshing && !fetching.current && !active.value) returnTo(0);
  }, [control.refreshing, custom]);

  const nativeScroll = useMemo(() => Gesture.Native(), []);
  const pull = useMemo(() => Gesture.Pan()
    .enabled(custom && focused && !overlay && !keyboard && control.enabled !== false && props.scrollEnabled !== false)
    .manualActivation(true)
    .maxPointers(1)
    // The native scroll view waits only until direction/top eligibility is known.
    // Failing upward/horizontal intent hands this same touch to normal scrolling
    // or the navigator's existing horizontal edge recognizer.
    .blocksExternalGesture(nativeScroll)
    .onTouchesDown((event, manager) => {
      if (!eligible.value || busy.value || momentum.value || scrollY.value > PULL_REFRESH.topTolerance || event.numberOfTouches !== 1) { manager.fail(); return; }
      startX.value = event.allTouches[0].absoluteX;
      startY.value = event.allTouches[0].absoluteY;
    })
    .onTouchesMove((event, manager) => {
      if (!eligible.value || event.numberOfTouches !== 1) { manager.fail(); return; }
      if (active.value) return;
      const dx = event.allTouches[0].absoluteX - startX.value;
      const dy = event.allTouches[0].absoluteY - startY.value;
      const direction = dragDirection(dx, dy, PULL_REFRESH.slop);
      if (direction === 'horizontal' || dy < -4 || (!direction && Math.hypot(dx, dy) > PULL_REFRESH.slop * 3)) manager.fail();
      else if (direction === 'vertical' && dy > PULL_REFRESH.slop) manager.activate();
    })
    .onStart(event => {
      cancelAnimation(translation);
      active.value = true;
      const value = Math.max(0, translation.value);
      initialDistance.value = value > 0 ? value * PULL_REFRESH.resistance / (PULL_REFRESH.maxDistance - Math.min(value, PULL_REFRESH.maxDistance - 1)) - event.translationY : 0;
    })
    .onUpdate(event => {
      if (!eligible.value) return;
      translation.value = resistedPull(initialDistance.value + event.translationY);
    })
    .onEnd((_event, success) => {
      active.value = false;
      if (!success) { translation.value = withSpring(0, RETURN_SPRING); return; }
      if (eligible.value && !busy.value && translation.value >= PULL_REFRESH.threshold) {
        busy.value = true;
        translation.value = withSpring(PULL_REFRESH.hold, RETURN_SPRING);
        runOnJS(request)();
      } else translation.value = withSpring(0, RETURN_SPRING);
    })
    .onFinalize((_event, success) => {
      if (active.value && !success) translation.value = withSpring(0, RETURN_SPRING);
      active.value = false;
    }), [custom, focused, overlay, keyboard, control.enabled, props.scrollEnabled, nativeScroll]);

  const forwardScrollEvent = (name, event) => state.current.props[name]?.({ nativeEvent: event });
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: event => { runOnJS(forwardScrollEvent)('onScrollBeginDrag', event); },
    onScroll: event => { scrollY.value = event.contentOffset.y; if (headerOffset) headerOffset.value = event.contentOffset.y; runOnJS(forwardScrollEvent)('onScroll', event); },
    onEndDrag: event => { runOnJS(forwardScrollEvent)('onScrollEndDrag', event); },
    onMomentumBegin: event => { momentum.value = true; runOnJS(forwardScrollEvent)('onMomentumScrollBegin', event); },
    onMomentumEnd: event => { momentum.value = false; runOnJS(forwardScrollEvent)('onMomentumScrollEnd', event); },
  });
  const contentStyle = useAnimatedStyle(() => ({ flex: 1, transform: [{ translateY: translation.value }] }));
  const indicatorStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, translation.value / PULL_REFRESH.hold) }));
  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.min(1, translation.value / PULL_REFRESH.threshold) * 180}deg` }] }));
  const AnimatedScroll = useMemo(() => ScrollComponent === FlatList ? Animated.FlatList : ScrollComponent === ScrollView ? Animated.ScrollView : Animated.createAnimatedComponent(ScrollComponent), [ScrollComponent]);
  return <GestureDetector gesture={pull}>
    <View style={{ flex: 1, overflow: 'hidden' }} collapsable={false}>
      <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[{ position: 'absolute', top: indicatorOffset, left: 0, right: 0, height: PULL_REFRESH.hold, alignItems: 'center', justifyContent: 'center' }, indicatorStyle]}>
        {pending || control.refreshing ? <ActivityIndicator color={colors.blue} /> : <Animated.View style={arrowStyle}><VistaIcon name="rotate-cw" size={sizes.icon} color={colors.blue} /></Animated.View>}
      </Animated.View>
      <Animated.View style={contentStyle}>
        <GestureDetector gesture={nativeScroll}>
          <AnimatedScroll {...props} ref={scrollRef} onScroll={onScroll}
            onScrollBeginDrag={undefined} onScrollEndDrag={undefined} onMomentumScrollBegin={undefined} onMomentumScrollEnd={undefined}
            scrollEventThrottle={16} overScrollMode="never" removeClippedSubviews={false}
            // Android wraps even a disabled RefreshControl around the scroll view.
            // Keep the native recognizer attached to the actual scroll view while
            // the custom pull owns the drag, rather than a SwipeRefreshLayout.
            refreshControl={custom ? undefined : <RefreshControl {...control} progressViewOffset={indicatorOffset} refreshing={control.refreshing || pending} enabled={allowed()} onRefresh={request} />} />
        </GestureDetector>
      </Animated.View>
    </View>
  </GestureDetector>;
}

function NativeHeaderScroll({ ScrollComponent, scrollRef, headerOffset, indicatorOffset, ...props }) {
  const callbacks = useRef(props);
  callbacks.current = props;
  const forwardScrollEvent = (name, event) => callbacks.current[name]?.({ nativeEvent: event });
  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: event => { runOnJS(forwardScrollEvent)('onScrollBeginDrag', event); },
    onScroll: event => { headerOffset.value = event.contentOffset.y; runOnJS(forwardScrollEvent)('onScroll', event); },
    onEndDrag: event => { runOnJS(forwardScrollEvent)('onScrollEndDrag', event); },
    onMomentumBegin: event => { runOnJS(forwardScrollEvent)('onMomentumScrollBegin', event); },
    onMomentumEnd: event => { runOnJS(forwardScrollEvent)('onMomentumScrollEnd', event); },
  });
  const Component = useMemo(() => ScrollComponent === FlatList ? Animated.FlatList : ScrollComponent === ScrollView ? Animated.ScrollView : Animated.createAnimatedComponent(ScrollComponent), [ScrollComponent]);
  return <Component {...props} ref={scrollRef} onScroll={onScroll}
    onScrollBeginDrag={undefined} onScrollEndDrag={undefined} onMomentumScrollBegin={undefined} onMomentumScrollEnd={undefined}
    scrollEventThrottle={16} removeClippedSubviews={false} />;
}

function HeaderScroll({ ScrollComponent, scrollRef, scrollHeader, ...props }) {
  // A spacer keeps scroll coordinates/content length intact. Only positive
  // scrolling moves the separate header; overscroll/pull translation never does.
  const [height, setHeight] = useState(sizes.accountHeader + space.sm * 2);
  const offset = useSharedValue(0);
  const motion = useContext(ScreenMotionContext);
  const counterStyle = useAnimatedStyle(() => ({
    opacity: motion?.visible === false ? 0 : 1,
    transform: [{ translateX: motion ? -(motion.active.value ? motion.offset.value : motion.seed) : 0 }],
  }));
  const headerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -Math.min(height, Math.max(0, offset.value)) }] }));
  const spacer = <View pointerEvents="none" accessible={false} style={{ height }} />;
  const content = ScrollComponent === FlatList
    ? { ListHeaderComponent: <>{spacer}{props.ListHeaderComponent}</> }
    : { children: <>{spacer}{props.children}</> };
  const { style, className, ...scrollProps } = props;
  const childProps = { ...scrollProps, ...content, style: { flex: 1 }, headerOffset: offset, indicatorOffset: height };
  const custom = Platform.OS === 'android' && nativeGesturesAvailable && props.refreshControl;
  return <View className={className} style={[{ flex: 1 }, style]}>
    <View style={{ flex: 1 }}>
      {custom ? <AndroidPullRefresh {...childProps} ScrollComponent={ScrollComponent} scrollRef={scrollRef} />
        : <NativeHeaderScroll {...childProps} ScrollComponent={ScrollComponent} scrollRef={scrollRef} />}
      <Animated.View pointerEvents={motion?.visible === false ? 'none' : 'box-none'}
        accessibilityElementsHidden={motion?.visible === false} importantForAccessibility={motion?.visible === false ? 'no-hide-descendants' : 'auto'}
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, height, overflow: 'hidden' }, counterStyle]}>
      <Animated.View style={headerStyle}
        onLayout={event => { const next = event.nativeEvent.layout.height; if (next > 0 && next !== height) setHeight(next); }}>
        <ScreenMotionContext.Provider value={null}>{scrollHeader}</ScreenMotionContext.Provider>
      </Animated.View>
      </Animated.View>
    </View>
  </View>;
}

function renderScroll(ScrollComponent, props, ref) {
  if (props.scrollHeader) return <HeaderScroll {...props} ScrollComponent={ScrollComponent} scrollRef={ref} />;
  // UIKit already moves content with the finger and provides native return motion.
  if (Platform.OS !== 'android' || !nativeGesturesAvailable || !props.refreshControl) return <ScrollComponent {...props} ref={ref} />;
  return <AndroidPullRefresh {...props} ScrollComponent={ScrollComponent} scrollRef={ref} />;
}
export const PullRefreshScrollView = forwardRef((props, ref) => renderScroll(ScrollView, props, ref));
export const PullRefreshFlatList = forwardRef((props, ref) => renderScroll(FlatList, props, ref));
export const PullRefreshKeyboardAwareScrollView = forwardRef((props, ref) => renderScroll(KeyboardAwareScrollView, props, ref));
