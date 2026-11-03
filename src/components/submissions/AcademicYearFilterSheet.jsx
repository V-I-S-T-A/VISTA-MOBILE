import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import AppBottomSheet from '../common/AppBottomSheet';
import AppButton from '../common/AppButton';
import { Text } from '../common/FontText';
import { colors, compact, radii, space, type } from '../../theme/tokens';
import { DropdownSkeleton } from '../common/Skeleton';
import { useAcademicYears } from '../../hooks/useAcademicYears';

export default function AcademicYearFilterSheet({
  visible,
  onClose,
  selectedId = null,
  onApply,
  onReset,
  returnFocusRef,
  years: customYears,
  submissions = [],
}) {
  const { data: fetchedYears, isLoading } = useAcademicYears();
  const rawYears = customYears || fetchedYears || [];
  const yearsList = Array.isArray(rawYears) ? rawYears : rawYears?.results || [];

  const [draftId, setDraftId] = useState(selectedId);

  useEffect(() => {
    if (visible) {
      setDraftId(selectedId);
    }
  }, [visible, selectedId]);

  // Combine unique academic years from backend list and any loaded submissions
  const combinedMap = new Map();
  for (const y of yearsList) {
    if (y?.academic_year_id && y?.year) {
      combinedMap.set(String(y.academic_year_id), y.year);
    }
  }
  for (const sub of submissions) {
    if (sub?.academic_year_id && sub?.academic_year) {
      combinedMap.set(String(sub.academic_year_id), sub.academic_year);
    }
  }

  const options = [
    { id: null, label: 'All academic years' },
    ...Array.from(combinedMap.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => b.label.localeCompare(a.label)),
  ];

  const handleSelect = (id) => {
    setDraftId(id);
  };

  const handleApply = () => {
    onApply?.(draftId);
    onClose?.();
  };

  const handleReset = () => {
    setDraftId(null);
    if (onReset) {
      onReset();
    } else {
      onApply?.(null);
    }
    onClose?.();
  };

  return (
    <AppBottomSheet
      visible={visible}
      title="Filter submissions"
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      contentStyle={{ gap: space.sm }}
    >
      <View style={{ gap: space.xs, marginBottom: 2 }}>
        <Text
          accessibilityRole="header"
          style={{
            ...type.compactLabel,
            fontFamily: 'DMSans_700Bold',
            color: colors.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Academic Year
        </Text>
      </View>

      <ScrollView
        style={{ maxHeight: 260 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading && options.length <= 1 ? (
          <DropdownSkeleton count={4} />
        ) : (
          <View style={{ gap: 4 }}>
            {options.map((option) => {
            const isSelected =
              (draftId === null && option.id === null) ||
              (draftId !== null && option.id !== null && String(draftId) === String(option.id));

            return (
              <TouchableOpacity
                key={option.id ?? 'all'}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: isSelected }}
                onPress={() => handleSelect(option.id)}
                style={{
                  minHeight: compact.touch,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radii.field,
                  backgroundColor: isSelected ? colors.selectedSurface : 'transparent',
                  gap: 12,
                }}
              >
                {/* Radio indicator */}
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.blue : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.blue,
                      }}
                    />
                  ) : null}
                </View>

                {/* Option text */}
                <Text
                  style={{
                    ...type.body,
                    fontFamily: isSelected ? 'DMSans_700Bold' : 'DMSans_500Medium',
                    color: isSelected ? colors.navy : colors.text,
                    flex: 1,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        )}
      </ScrollView>

      {/* Sheet action buttons */}
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        <AppButton
          style={{ flexGrow: 1, flexBasis: 100, borderWidth: 1, borderColor: colors.border }}
          label="Reset Filter"
          variant="secondary"
          onPress={handleReset}
        />
        <AppButton
          style={{ flexGrow: 1, flexBasis: 140 }}
          label="Apply Filter"
          variant="primary"
          onPress={handleApply}
        />
      </View>
    </AppBottomSheet>
  );
}
