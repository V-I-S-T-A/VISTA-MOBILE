import { TextInput, Text } from '../../../components/common/FontText';
import { View, Pressable, TouchableOpacity } from 'react-native';
import { useRef } from 'react';
import { Feather } from '@expo/vector-icons';
import { colors, compact, radii, type } from '../../../theme/tokens';

export default function StaffReviewSearch({
  searchQuery,
  setSearchQuery,
  onFilterPress,
  isFilterActive = false,
  activeFilterLabel = null,
  filterButtonRef = null,
  filterButtonVariant = 'yellow',
  filterButtonColor = null,
}) {
  const input = useRef(null);
  const isBlue = filterButtonVariant === 'blue' || filterButtonColor === 'blue';
  const buttonBg = isBlue ? colors.blue : colors.yellow;
  const buttonFg = isBlue ? '#FFFFFF' : colors.navy;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: compact.gutter,
        minHeight: compact.touch,
      }}
    >
      <Pressable
        accessible={false}
        onPress={() => input.current?.focus()}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: compact.touch,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.field,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radii.field,
            paddingHorizontal: compact.leadingInset,
            minHeight: compact.inputHeight,
          }}
        >
          <Feather name="search" size={14} color={colors.muted} />
          <TextInput
            ref={input}
            accessibilityLabel="Search submissions"
            accessibilityHint="Filters the submission list by search text"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search submissions..."
            placeholderTextColor={colors.muted}
            style={{
              ...type.listMeta,
              flex: 1,
              minWidth: 0,
              minHeight: compact.inputHeight,
              color: colors.text,
              marginLeft: compact.inset,
              paddingVertical: compact.inset,
              includeFontPadding: false,
            }}
          />
        </View>
      </Pressable>

      {onFilterPress ? (
        <TouchableOpacity
          ref={filterButtonRef}
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterLabel
              ? `Filter submissions, active: ${activeFilterLabel}`
              : 'Filter submissions'
          }
          accessibilityState={{ selected: isFilterActive }}
          onPress={onFilterPress}
          style={{
            minHeight: compact.touch,
            minWidth: compact.touch,
            flexShrink: 0,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              minHeight: compact.inputHeight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 12,
              borderRadius: radii.field,
              backgroundColor: buttonBg,
              borderWidth: isFilterActive ? 1.5 : 0,
              borderColor: colors.navy,
            }}
          >
            <Feather name="filter" size={13} color={buttonFg} />
            <Text
              style={{
                ...type.compactLabel,
                fontFamily: 'DMSans_700Bold',
                color: buttonFg,
              }}
            >
              Filter
            </Text>
            {isFilterActive ? (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: buttonFg,
                  marginLeft: 1,
                }}
              />
            ) : null}
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
