import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  Platform,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  StackRouter,
  createNavigatorFactory,
  useNavigationBuilder,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Screen, ScreenContainer } from 'react-native-screens';
import { useIsOverlayOpen } from '../components/common/OverlayPortal';
import { colors, motion } from '../theme/tokens';
import { createNavigationTransition, NavigationTransitionContext } from './NavigationTransitionContext';
import { isMainTab, tabDirection } from './tabBackPolicy.cjs';
import TabScene from './TabScene';
import { dragDirection } from '../utils/gestureDirection.cjs';

const SLIDE_DURATION = 220;
const FADE_DURATION = motion.tab || 180;
const EDGE_HIT_WIDTH = 36;
const PARALLAX_RATIO = 0.24;
const FULL_BLEED = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };
const EDGE_DIVIDER_STYLE = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  width: 1,
  backgroundColor: 'rgba(20, 43, 82, 0.08)',
};

function resolveAnimationType(animation) {
  if (animation === 'none') return 'none';
  if (animation === 'fade') return 'fade';
  if (animation === 'ios_from_right' || animation === 'simple_push' || animation === 'slide_from_right') {
    return 'slide';
  }
  return 'fade';
}

function getEasing() {
  return Easing.out(Easing.cubic);
}

function getPopEasing() {
  return Easing.out(Easing.cubic);
}

function SceneContent({ descriptor }) {
  // The destination owns its data loading UI. An intermediate navigation spinner
  // delayed mounting its queries and produced spinner -> skeleton -> content.
  return descriptor.render();
}

function PushStackNavigator({
  id,
  initialRouteName,
  children,
  screenListeners,
  screenOptions,
  layout,
  UNSTABLE_router,
}) {
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(
    StackRouter,
    { id, initialRouteName, children, screenListeners, screenOptions, layout, UNSTABLE_router }
  );

  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(windowWidth || 360, 1);
  const overlayOpen = useIsOverlayOpen();
  const [, setTick] = useState(0);

  const scenesRef = useRef(new Map());
  const closingRef = useRef([]);
  const prevKeysRef = useRef(null);
  const prevRoutesRef = useRef(null);
  const tabMotionRef = useRef(null);
  const tabRevisionRef = useRef(0);
  const progressValueRef = useRef(new Map());
  const swipeStartRef = useRef(new Map());
  const isMountedRef = useRef(true);
  const transitionRef = useRef(null);
  if (!transitionRef.current) transitionRef.current = createNavigationTransition();

  const beginPushAnimation = (key) => {
    const scene = scenesRef.current.get(key);
    if (!scene || scene.started || scene.animType === 'none') return;
    scene.started = true;
    const duration = scene.animType === 'slide' ? SLIDE_DURATION : FADE_DURATION;
    scene.progress.stopAnimation?.();
    progressValueRef.current.set(key, 1);
    Animated.timing(scene.progress, {
      toValue: 1,
      duration,
      easing: getEasing(),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || !isMountedRef.current || scenesRef.current.get(key) !== scene) return;
      scene.settled = true;
      setTick(tick => tick + 1);
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      scenesRef.current.forEach((scene) => scene.progress.stopAnimation?.());
      closingRef.current.forEach((scene) => scene.progress.stopAnimation?.());
    };
  }, []);

  const currentKeys = state.routes.map((route) => route.key);
  const prevKeys = prevKeysRef.current;
  const previousRoutes = prevRoutesRef.current;
  const destination = state.routes[state.index];
  const previousTop = previousRoutes?.at(-1);
  const direction = previousTop?.key !== destination?.key && isMainTab(destination?.name)
    ? tabDirection(previousRoutes || [], destination.name) : 0;
  const tabChange = direction !== 0;

  // Synchronize scene records during render so newly pushed routes mount
  // at translateX = width (progress = 0) with zero 1-frame flash.
  const newlyPushedKeys = [];
  if (prevKeys === null) {
    for (const route of state.routes) {
      const descriptor = descriptors[route.key];
      const animType = isMainTab(route.name) ? 'none' : resolveAnimationType(descriptor?.options?.animation);
      const progress = new Animated.Value(1);
      progressValueRef.current.set(route.key, 1);
      scenesRef.current.set(route.key, {
        key: route.key,
        descriptor,
        animType,
        progress,
        started: true,
        settled: true,
        laidOut: true,
      });
    }
  } else {
    const activeSet = new Set(currentKeys);
    const prevTopKey = prevKeys[prevKeys.length - 1];
    const nextTopKey = currentKeys[currentKeys.length - 1];

    // If a previously closing route was pushed again, drop the closing copy.
    closingRef.current = closingRef.current.filter((item) => !activeSet.has(item.key));

    // When the previous top route is no longer in state.routes, retain it as a
    // closing scene so it can slide out left-to-right without remounting underneath.
    if (prevTopKey && !activeSet.has(prevTopKey)) {
      const prevScene = scenesRef.current.get(prevTopKey);
      if (prevScene) {
        if (prevScene.animType === 'none' || tabChange) {
          scenesRef.current.delete(prevTopKey);
        } else {
          closingRef.current.forEach((item) => item.progress.stopAnimation?.());
          const startProgress = swipeStartRef.current.get(prevTopKey);
          swipeStartRef.current.delete(prevTopKey);
          if (typeof startProgress === 'number') {
            prevScene.progress.setValue(startProgress);
            progressValueRef.current.set(prevTopKey, startProgress);
          }
          closingRef.current = [
            {
              key: prevTopKey,
              descriptor: prevScene.descriptor,
              animType: prevScene.animType,
              progress: prevScene.progress,
              started: false,
            },
          ];
          scenesRef.current.delete(prevTopKey);
        }
      }
    }

    // Remove any skipped intermediate routes that were popped at once.
    for (const key of prevKeys) {
      if (!activeSet.has(key) && key !== prevTopKey) {
        scenesRef.current.get(key)?.progress.stopAnimation?.();
        scenesRef.current.delete(key);
        progressValueRef.current.delete(key);
      }
    }

    // Update existing active routes and initialize any newly pushed route.
    for (const route of state.routes) {
      const descriptor = descriptors[route.key];
      const animType = isMainTab(route.name) ? 'none' : resolveAnimationType(descriptor?.options?.animation);
      const existing = scenesRef.current.get(route.key);
      if (existing) {
        existing.descriptor = descriptor;
        if (animType === 'none' && existing.animType !== 'none') {
          existing.progress.stopAnimation();
          existing.progress.setValue(1);
          existing.started = true;
          existing.settled = true;
        }
        existing.animType = animType;
        if (!tabChange && route.key === nextTopKey && prevTopKey !== nextTopKey && activeSet.has(prevTopKey)) {
          // StackRouter getId reuses main tabs by moving their existing key to
          // the top. Animate that focus change without remounting their content.
          existing.progress.stopAnimation();
          existing.progress.setValue(animType === 'none' ? 1 : 0);
          existing.started = animType === 'none';
          existing.settled = animType === 'none';
          if (animType !== 'none') newlyPushedKeys.push(route.key);
        }
      } else {
        const isTopPush = !tabChange && route.key === nextTopKey && animType !== 'none';
        const initialValue = isTopPush ? 0 : 1;
        const progress = new Animated.Value(initialValue);
        progressValueRef.current.set(route.key, initialValue);
        scenesRef.current.set(route.key, {
          key: route.key,
          descriptor,
          animType,
          progress,
          started: !isTopPush,
          settled: !isTopPush,
          laidOut: false,
        });
        if (isTopPush) {
          closingRef.current.forEach((item) => item.progress.stopAnimation?.());
          closingRef.current = [];
          newlyPushedKeys.push(route.key);
        }
      }
    }
  }

  if (tabChange) {
    const oldMotion = tabMotionRef.current;
    const scenes = oldMotion?.scenes || new Map();
    // TabScene retains the UI-thread offset for every participating route.
    for (const key of [previousTop.key, destination.key]) {
      scenes.set(key, true);
    }
    for (const key of scenes.keys()) {
      const index = state.routes.findIndex(route => route.key === key);
      const roots = index >= 0 ? state.routes.slice(0, index + 1) : previousRoutes;
      scenes.set(key, { exitDirection: -tabDirection(roots, destination.name) || -direction });
    }
    const reduced = descriptors[destination.key]?.options?.animation === 'none';
    tabMotionRef.current = { scenes, pending: new Set(scenes.keys()), direction, to: destination.key, revision: ++tabRevisionRef.current, reduced,
      ready: Boolean(scenesRef.current.get(destination.key)?.laidOut) };
    for (const key of scenes.keys()) {
      const scene = scenesRef.current.get(key);
      if (scene) { scene.progress.stopAnimation?.(); scene.progress.setValue(1); scene.started = true; scene.settled = true; }
    }
  } else if (previousTop?.key !== destination?.key && tabMotionRef.current) {
    tabMotionRef.current = null;
  }
  if (tabMotionRef.current && !tabMotionRef.current.reduced && descriptors[destination.key]?.options?.animation === 'none') {
    const current = tabMotionRef.current;
    tabMotionRef.current = { ...current, pending: new Set(current.scenes.keys()), reduced: true, revision: ++tabRevisionRef.current };
  }

  prevKeysRef.current = currentKeys;
  prevRoutesRef.current = state.routes;

  const tabMotion = tabMotionRef.current;
  const finishTab = (revision, key) => {
    const current = tabMotionRef.current;
    if (!isMountedRef.current || current?.revision !== revision) return;
    current.pending.delete(key);
    if (current.pending.size) return;
    tabMotionRef.current = null;
    setTick(tick => tick + 1);
  };

  const pushSignature = newlyPushedKeys.join(',');
  const closingSignature = closingRef.current.map((item) => item.key).join(',');

  // The destination (including its loading/error UI) has committed. Start
  // automatically without an arbitrary navigation loading delay.
  useLayoutEffect(() => {
    if (!pushSignature) return;
    const keys = pushSignature.split(',').filter(Boolean);
    for (const key of keys) {
      beginPushAnimation(key);
    }
  }, [pushSignature]);

  // Start pop animations immediately (previous route is already mounted).
  useLayoutEffect(() => {
    if (!closingSignature) return;
    for (const item of closingRef.current) {
      if (item.started) continue;
      item.started = true;
      Keyboard.dismiss();
      item.progress.stopAnimation?.();
      const currentProgress = progressValueRef.current.get(item.key);
      const ratio = typeof currentProgress === 'number' ? Math.max(0.15, Math.min(1, currentProgress)) : 1;
      const baseDuration = item.animType === 'slide' ? SLIDE_DURATION : FADE_DURATION;
      const duration = Math.max(80, Math.round(baseDuration * ratio));
      progressValueRef.current.set(item.key, 0);
      Animated.timing(item.progress, {
        toValue: 0,
        duration,
        easing: getPopEasing(),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        if (!isMountedRef.current) return;
        closingRef.current = closingRef.current.filter((c) => c.key !== item.key);
        progressValueRef.current.delete(item.key);
        setTick((t) => t + 1);
      });
    }
  }, [closingSignature]);

  const topRoute = state.routes[state.index];
  const topScene = topRoute ? scenesRef.current.get(topRoute.key) : null;
  const topDescriptor = topRoute ? descriptors[topRoute.key] : null;
  const canSwipeBack =
    state.index > 0 && !tabMotion &&
    !isMainTab(topRoute?.name) &&
    !overlayOpen &&
    closingRef.current.length === 0 &&
    topScene?.animType === 'slide' &&
    topScene.settled &&
    topDescriptor?.options?.gestureEnabled !== false;

  const panStateRef = useRef({
    canSwipeBack: false,
    width: 360,
    topRouteKey: null,
    topScene: null,
    navigation: null,
  });
  panStateRef.current = {
    canSwipeBack,
    width,
    topRouteKey: topRoute?.key,
    topScene,
    navigation,
  };

  const panResponder = useMemo(() => {
    if (typeof PanResponder?.create !== 'function') {
      return { panHandlers: {} };
    }
    let axis = null;
    let gestureScene = null;
    const shouldClaim = (_evt, gestureState) => {
      const current = panStateRef.current;
      if (!current.canSwipeBack || !current.topScene || gestureState.numberActiveTouches > 1) return false;
      axis = axis || dragDirection(gestureState.dx, gestureState.dy);
      return gestureState.x0 <= EDGE_HIT_WIDTH && gestureState.dx > 10 && axis === 'horizontal';
    };
    const restore = () => {
      const scene = gestureScene;
      gestureScene = null;
      if (!scene) return;
      progressValueRef.current.set(scene.key, 1);
      Animated.timing(scene.progress, {
        toValue: 1, duration: 180, easing: getPopEasing(), useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && panStateRef.current.topRouteKey === scene.key) transitionRef.current.setActive(false);
      });
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => { axis = null; return false; },
      onMoveShouldSetPanResponder: shouldClaim,
      onMoveShouldSetPanResponderCapture: shouldClaim,
      onPanResponderGrant: () => {
        const current = panStateRef.current;
        if (!current.canSwipeBack || !current.topScene) return;
        gestureScene = current.topScene;
        transitionRef.current.setActive(true);
        Keyboard.dismiss();
        current.topScene.progress.stopAnimation?.();
      },
      onPanResponderMove: (_evt, gestureState) => {
        const current = panStateRef.current;
        if (!gestureScene || gestureScene.key !== current.topRouteKey || !current.canSwipeBack) { restore(); return; }
        const nextProgress = Math.max(0, Math.min(1, 1 - Math.max(0, gestureState.dx) / current.width));
        current.topScene.progress.setValue(nextProgress);
        progressValueRef.current.set(current.topRouteKey, nextProgress);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const current = panStateRef.current;
        if (!gestureScene || gestureScene.key !== current.topRouteKey || !current.canSwipeBack) { restore(); return; }
        const dx = Math.max(0, gestureState.dx);
        const shouldPop = dx > current.width * 0.3 || gestureState.vx > 0.45;
        if (shouldPop && current.navigation?.canGoBack?.()) {
          const currentProgress = Math.max(0, Math.min(1, 1 - dx / current.width));
          swipeStartRef.current.set(current.topRouteKey, currentProgress);
          gestureScene = null;
          current.navigation.goBack();
        } else {
          restore();
        }
      },
      onPanResponderTerminate: restore,
      onPanResponderTerminationRequest: () => true,
    });
  }, []);

  const topClosing = closingRef.current[closingRef.current.length - 1] || null;
  const foregroundProgress = topClosing
    ? topClosing.animType === 'slide'
      ? topClosing.progress
      : null
    : topScene?.animType === 'slide'
      ? topScene.progress
      : null;

  const isTopInteractive = closingRef.current.length === 0;
  const contentBackground = screenOptions?.contentStyle?.backgroundColor || colors.background;
  const hideNavBar =
    topDescriptor?.options?.navigationBarHidden ??
    screenOptions?.navigationBarHidden ??
    false;

  const transitioning = Boolean(tabMotion) || closingRef.current.length > 0 || [...scenesRef.current.values()].some(scene => !scene.settled);
  useLayoutEffect(() => {
    transitionRef.current.setActive(transitioning);
  }, [transitioning]);
  // Use one sibling list and the same key for a route throughout push/pop.
  // Moving it to a second map with a "closing:" key remounts its entire tree.
  const renderedScenes = [
    ...state.routes.map((route, index) => ({ scene: scenesRef.current.get(route.key), descriptor: descriptors[route.key], index, closing: false })),
    ...closingRef.current.map(scene => ({ scene, descriptor: scene.descriptor, index: -1, closing: true })),
  ];

  const stackBody = (
    <View
      style={{ flex: 1, backgroundColor: contentBackground, overflow: 'hidden' }}
      {...panResponder.panHandlers}
    >
      {renderedScenes.map(({ scene, descriptor, index, closing }) => {
        if (!scene || !descriptor) return null;

        const isCurrentTop = index === state.index;
        const isImmediateUnderlying =
          (topClosing !== null && isCurrentTop) ||
          (topClosing === null && !isMainTab(topRoute?.name) && index === state.index - 1);

        const isActiveTop = isCurrentTop && topClosing === null;
        const tabScene = tabMotion?.scenes.get(scene.key);
        const isHidden = !closing && !isCurrentTop && !(tabMotion ? tabScene : isImmediateUnderlying);

        let animatedStyle = { opacity: 1, transform: [{ translateX: 0 }] };
        if (tabScene) {
          animatedStyle = { opacity: 1, transform: [{ translateX: 0 }] };
        } else if (closing) {
          animatedStyle = scene.animType === 'slide' ? {
            opacity: scene.progress.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0.7, 1] }),
            transform: [{ translateX: scene.progress.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }],
          } : { opacity: scene.progress };
        } else if (isActiveTop) {
          if (scene.animType === 'slide') {
            animatedStyle = {
              opacity: scene.progress.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0.2, 0.92, 1],
              }),
              transform: [
                {
                  translateX: scene.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width, 0],
                  }),
                },
              ],
            };
          } else if (scene.animType === 'fade') {
            animatedStyle = { opacity: scene.progress };
          }
        } else if (isImmediateUnderlying && foregroundProgress) {
          animatedStyle = {
            opacity: foregroundProgress.interpolate({
              inputRange: [0, 0.75, 1],
              outputRange: [1, 0.3, 0],
            }),
            transform: [
              {
                translateX: foregroundProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -width * PARALLAX_RATIO],
                }),
              },
            ],
          };
        } else if (isImmediateUnderlying) {
          animatedStyle =
            topClosing === null && topScene?.animType === 'fade'
              ? {
                  opacity: topScene.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                }
              : { opacity: 1 };
        } else {
          animatedStyle = { opacity: 0 };
        }

        const pointerEvents = isActiveTop && isTopInteractive ? 'auto' : 'none';
        const hiddenFromA11y = !isActiveTop;

        return (
          <TabScene key={scene.key} sceneKey={scene.key} transition={tabMotion} width={width} current={isActiveTop} visible={!isHidden} onFinish={finishTab}>
          <Animated.View
            key={scene.key}
            renderToHardwareTextureAndroid={closing || (transitioning && isImmediateUnderlying)}
            pointerEvents={pointerEvents}
            aria-hidden={hiddenFromA11y}
            accessibilityElementsHidden={hiddenFromA11y}
            importantForAccessibility={hiddenFromA11y ? 'no-hide-descendants' : 'auto'}
            onLayout={() => {
              scene.laidOut = true;
              const tab = tabMotionRef.current;
              if (tab?.to === scene.key && !tab.ready) {
                tabMotionRef.current = { ...tab, ready: true };
                setTick(tick => tick + 1);
              }
              if (!scene.started) beginPushAnimation(scene.key);
            }}
            style={[
              FULL_BLEED,
              { backgroundColor: descriptor.options?.contentStyle?.backgroundColor || contentBackground },
              isHidden ? { opacity: 0 } : animatedStyle,
            ]}
          >
            <SceneContent descriptor={descriptor} />
            {!tabScene && (isActiveTop || closing) && scene.animType === 'slide' ? (
              <View pointerEvents="none" accessible={false} style={EDGE_DIVIDER_STYLE} />
            ) : null}
          </Animated.View>
          </TabScene>
        );
      })}

    </View>
  );

  const wrappedBody =
    ScreenContainer && Screen ? (
      <ScreenContainer style={{ flex: 1 }}>
        <Screen active={1} activityState={2} navigationBarHidden={Boolean(hideNavBar)} style={{ flex: 1 }}>
          {stackBody}
        </Screen>
      </ScreenContainer>
    ) : (
      stackBody
    );

  return <NavigationContent><NavigationTransitionContext.Provider value={transitionRef.current}>{wrappedBody}</NavigationTransitionContext.Provider></NavigationContent>;
}

const createAndroidPushStackNavigator = createNavigatorFactory(PushStackNavigator);

export function createPushStackNavigator(config) {
  if (Platform.OS === 'ios') {
    return createNativeStackNavigator(config);
  }
  return createAndroidPushStackNavigator(config);
}
