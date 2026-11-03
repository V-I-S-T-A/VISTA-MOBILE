import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
  const tabs = [
    ['All Status', 'Total'],
    ['Pending', 'Pending'],
    ['Approved', 'Approved'],
    ...(includeRejected ? [['Rejected', 'Rejected']] : []),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginBottom: 4 }}
      contentContainerStyle={{ minWidth: '100%', gap: 8, alignItems: 'center' }}
    >
      {tabs.map(([filter, label]) => (
        <TouchableOpacity
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
              borderRadius: radii.chip,
              backgroundColor:
                value === filter
                  ? staff
                    ? colors.yellow
                    : colors.blue
                  : colors.selectedSurface,
            }}
          >
            <Text
              style={{
                ...type.compactLabel,
                fontFamily: value === filter ? 'DMSans_700Bold' : 'DMSans_500Medium',
                color:
                  value === filter && !staff
                    ? 'white'
                    : staff && value === filter
                    ? colors.onYellow
                    : colors.text,
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
