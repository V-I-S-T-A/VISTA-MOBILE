import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { Text } from '../common/FontText';
import { colors, compact, radii, type } from '../../theme/tokens';

export default function SubmissionSummaryTabs({
  value,
  onChange,
  staff = false,
  showRejected = false,
}) {
  const { fontScale } = useWindowDimensions();
  const includeRejected = staff || showRejected;
  const scroll = useRef(null);
  const positions = useRef({});
  const viewportWidth = useRef(0);
  const offset = useRef(0);
  const revealSelected = () => {
    const tab = positions.current[value];
    if (!tab || !viewportWidth.current) return;
    let next = offset.current;
    if (tab.x < next) next = tab.x;
    else if (tab.x + tab.width > next + viewportWidth.current) next = tab.x + tab.width - viewportWidth.current;
    if (next !== offset.current) {
      offset.current = next;
      scroll.current?.scrollTo({ x: next, animated: false });
    }
  };
  useEffect(revealSelected, [value, fontScale, includeRejected]);
  const tabs = [
    ['All Status', 'Total'],
    ['Pending', 'Pending'],
    ['Approved', 'Approved'],
    ...(includeRejected ? [['Rejected', 'Rejected']] : []),
  ];

  return (
    <ScrollView
      ref={scroll}
      horizontal
      onLayout={event => { viewportWidth.current = event.nativeEvent.layout.width; revealSelected(); }}
      onScroll={event => { offset.current = event.nativeEvent.contentOffset.x; }}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginBottom: 4 }}
      contentContainerStyle={{ minWidth: '100%', gap: 8, alignItems: 'center' }}
    >
      {tabs.map(([filter, label]) => (
        <TouchableOpacity
          onLayout={event => { positions.current[filter] = event.nativeEvent.layout; revealSelected(); }}
          key={filter}
          accessibilityRole="tab"
          accessibilityLabel={`${label} submissions`}
          accessibilityState={{ selected: value === filter }}
          onPress={() => onChange(filter)}
          style={{
            flex: 1,
            flexGrow: 1,
            minHeight: compact.touch,
            minWidth: Math.max(
              compact.touch,
              label.length * type.compactLabel.fontSize * 0.7 * fontScale + compact.chipInset * 2
            ),
            flexShrink: 0,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              minHeight: compact.chipHeight,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: compact.chipInset,
              paddingVertical: 3,
              borderRadius: radii.pill,
              backgroundColor: value === filter ? colors.blue : colors.selectedSurface,
            }}
          >
            <Text
              style={{
                ...type.compactLabel,
                fontFamily: value === filter ? 'DMSans_700Bold' : 'DMSans_500Medium',
                color: value === filter ? colors.onBrand : colors.text,
              }}
            >
              {label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
