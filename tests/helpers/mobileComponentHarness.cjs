// Lightweight component/event harness: no native runtime, HTTP or external delivery.
// Native layout/keyboard behavior still requires the device checklist.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function createHarness(overrides = {}, frameScheduler = {}) {
  let active;
  const cache = new Map();
  const hooks = {
    useState(initial) {
      const instance = active, index = instance.cursor++;
      if (!(index in instance.state)) instance.state[index] = typeof initial === 'function' ? initial() : initial;
      return [instance.state[index], value => { instance.state[index] = typeof value === 'function' ? value(instance.state[index]) : value; }];
    },
    useRef(initial) { const [value] = hooks.useState(() => ({ current: initial })); return value; },
    useEffect(callback, deps) {
      const index = active.cursor++;
      const previous = active.effects[index];
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        previous?.cleanup?.();
        active.effects[index] = { deps, cleanup: callback() };
      }
    },
    useCallback(callback, deps) { return hooks.useMemo(() => callback, deps); },
    useMemo(factory, deps) {
      const index = active.cursor++;
      const previous = active.memos[index];
      if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        active.memos[index] = { deps, value: factory() };
      }
      return active.memos[index].value;
    },
    forwardRef(render) { return function Forwarded(props) { return render(props, null); }; },
  };
  const jsx = (type, props, key) => ({ type, props: props || {}, key });
  hooks.useLayoutEffect = hooks.useEffect;
  hooks.startTransition = callback => callback();
  hooks.createContext = value => ({ value, Provider: 'ContextProvider' });
  hooks.useContext = context => context.value;
  const native = Object.fromEntries(['View', 'Image', 'TouchableOpacity', 'Pressable', 'ScrollView', 'FlatList', 'KeyboardAvoidingView', 'Modal', 'RefreshControl', 'ActivityIndicator', 'Switch', 'Text', 'TextInput'].map(name => [name, name]));
  Object.assign(native, { BackHandler: { addEventListener: () => ({ remove() {} }) }, StyleSheet: { create: value => value }, Platform: { OS: 'android' }, useWindowDimensions: () => ({ width: 360, height: 800, fontScale: 1 }), Alert: { alert() {} }, Linking: { async openURL() {} }, Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) } });
  Object.assign(native, {
    Animated: { View: 'AnimatedView', Value: class { constructor(value) { this.value = value; } setValue(value) { this.value = value; } stopAnimation() {} interpolate({ inputRange, outputRange }) { const fraction = (this.value - inputRange[0]) / (inputRange[1] - inputRange[0]); return outputRange[0] + fraction * (outputRange[1] - outputRange[0]); } }, timing: (value, config) => ({ start(callback) { value.setValue(config.toValue); callback?.({ finished: true }); } }) },
    Easing: { cubic: value => value ** 3, out: easing => easing, in: easing => easing, inOut: easing => easing },
    AccessibilityInfo: { isReduceMotionEnabled: async () => false, isScreenReaderEnabled: async () => false, addEventListener: () => ({ remove() {} }), setAccessibilityFocus() {} },
    findNodeHandle: node => node,
  });
  const mocks = {
    react: hooks, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    '@react-navigation/native': { useIsFocused: () => true, useNavigation: () => ({ navigate() {}, goBack() {}, addListener: () => () => {} }) },
    'react-native': native, '@expo/vector-icons': { Feather: 'Icon' },
    'react-native-keyboard-controller': { KeyboardAvoidingView: 'KeyboardAvoidingView', KeyboardAwareScrollView: 'ScrollView', useReanimatedKeyboardAnimation: () => ({ progress: { value: 0 } }) },
    'react-native-reanimated': { __esModule: true, default: { View: 'AnimatedView' }, useAnimatedStyle: callback => callback() },
    'react-native-gesture-handler': { GestureHandlerRootView: 'GestureHandlerRootView', GestureDetector: 'GestureDetector', Gesture: {} },
    '../../components/common/UpdateManager': { useUpdateManager: () => ({ checkNow() {} }) },
    '../../components/common/Toast': { useToast: () => ({ success() {}, error() {}, info() {} }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) },
    'react-native-document-scanner-plugin': { default: { scanDocument: async () => ({}) } },
    'expo-document-picker': { getDocumentAsync: async () => ({ canceled: true }) },
    'expo-secure-store': { getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} },
    'expo-modules-core': { requireOptionalNativeModule: () => null },
    'expo-constants': { default: { expoConfig: {} } },
    'expo-image-picker': {
      requestCameraPermissionsAsync: async () => ({ granted: true }),
      requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
      launchCameraAsync: async () => ({ canceled: true }),
      launchImageLibraryAsync: async () => ({ canceled: true }),
    },
    'expo-notifications': {
      getPermissionsAsync: async () => ({ status: 'granted', granted: true }),
      requestPermissionsAsync: async () => ({ status: 'granted', granted: true }),
    },
    axios: { create: () => ({ interceptors: { request: { use() {} }, response: { use() {} } }, get: async () => ({ data: {} }), post: async () => ({ data: {} }) }) },
    '@tanstack/react-query': {
      QueryClient: class QueryClient { invalidateQueries() {} clear() {} },
      useQuery: () => ({ data: null }),
      useMutation: () => ({ mutate: () => {}, mutateAsync: async () => {} }),
      useQueryClient: () => ({ invalidateQueries() {}, clear() {} }),
      useQueries: () => [],
      useInfiniteQuery: () => ({ data: null }),
    },
    ...overrides,
  };
  function load(file) {
    const absolute = path.isAbsolute(file) ? file : path.resolve(__dirname, '../../', file);
    if (cache.has(absolute)) return cache.get(absolute);
    if (absolute.endsWith('.json')) return JSON.parse(fs.readFileSync(absolute, 'utf8'));
    const exports = {};
    cache.set(absolute, exports);
    const code = babel.transformFileSync(absolute, { configFile: false, babelrc: false,
      plugins: [
        [require.resolve('@babel/plugin-transform-react-jsx', { paths: [path.resolve(__dirname, '../../node_modules')] }), { runtime: 'automatic' }],
        require.resolve('@babel/plugin-transform-modules-commonjs', { paths: [path.resolve(__dirname, '../../node_modules')] }),
      ] }).code;
    vm.runInNewContext(code, { __DEV__: true, process, exports, AbortController, URL, console, setTimeout, clearTimeout,
      requestAnimationFrame: frameScheduler.requestAnimationFrame || (callback => callback()),
      cancelAnimationFrame: frameScheduler.cancelAnimationFrame || (() => {}), require(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.endsWith('/PullRefresh')) return { PullRefreshScrollView: 'ScrollView', PullRefreshFlatList: 'FlatList', PullRefreshKeyboardAwareScrollView: 'ScrollView' };
      if (name.endsWith('/FontText')) return { Text: 'Text', TextInput: 'TextInput' };
      if (/\.(webp|png)$/.test(name)) return name;
      if (name.startsWith('.')) {
        const base = path.resolve(path.dirname(absolute), name);
        const resolved = [base, base + '.jsx', base + '.js', base + '.cjs'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (!resolved) throw new Error(`Missing test module ${name}`);
        return resolved.endsWith('.cjs') ? require(resolved) : load(resolved);
      }
      throw new Error(`Unmocked dependency ${name}`);
    } }, { filename: absolute });
    return exports;
  }
  function instance(component, props = {}) {
    const value = { cursor: 0, state: [], effects: [], memos: [], props, output: null };
    value.render = (nextProps = value.props) => {
      value.props = nextProps; value.cursor = 0; active = value;
      value.output = component(nextProps); active = null;
      return value.output;
    };
    value.unmount = () => value.effects.forEach(effect => effect?.cleanup?.());
    value.render(); return value;
  }
  return { load, instance, native, mocks };
}

function nodes(node) {
  const list = [];
  function walk(current) {
    if (!current) return;
    if (Array.isArray(current)) {
      current.forEach(walk);
      return;
    }
    if (typeof current !== 'object') return;
    list.push(current);
    const children = current.props?.children;
    // Header slots are rendered separately by PullRefresh, outside its moving
    // content. Include them when inspecting a screen's composed element tree.
    if (current.props?.scrollHeader) walk(current.props.scrollHeader);
    if (Array.isArray(children)) children.forEach(walk);
    else if (children) walk(children);
  }
  walk(node);
  return list;
}

function textOf(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  const children = node.props?.children;
  if (Array.isArray(children)) return children.map(textOf).join('');
  return textOf(children);
}

module.exports = { createHarness, nodes, textOf };
