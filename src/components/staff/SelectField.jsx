import { useRef, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { Skeleton, DropdownSkeleton } from '../common/Skeleton';
import AppBottomSheet from '../common/AppBottomSheet';
import { surfaces } from '../../theme/layout';
import { colors, sizes, type, form, reviewControls, statusTones } from '../../theme/tokens';

export default function SelectField({ label, placeholder, value, options = [], isLoading, disabled, onChange, style, presentation = 'sheet', size = 'regular', accessibilityLabel }) {
  const compact = size === 'compact';
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const { height } = useWindowDimensions();
  return <View style={[{ marginBottom: form.fieldGap }, style]}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TouchableOpacity ref={trigger} accessibilityRole="button" accessibilityLabel={compact && presentation === 'inline' && open ? 'Cancel status selection' : accessibilityLabel || label || placeholder || 'Select an option'}
      accessibilityState={{ disabled: !!(disabled || isLoading), expanded: open }} disabled={disabled || isLoading}
      onPress={() => setOpen(value => !value)} style={compact ? styles.compactTarget : [surfaces.field, styles.field, disabled && { backgroundColor: '#EEF2F6' }]}>
      <View style={compact ? [surfaces.field, styles.field, styles.compactField] : styles.defaultContents}>
      <Text style={[styles.value, compact && reviewControls.value, !value && { color: colors.muted }]}>{value?.label || placeholder}</Text>
      {isLoading ? <Skeleton width={22} height={16} /> : <Feather name={open ? "chevron-up" : "chevron-down"} size={compact ? reviewControls.icon : sizes.icon} color={colors.muted} />}
      {compact && presentation === 'inline' && open ? <Text style={[reviewControls.label, { color: colors.blue }]}>Cancel</Text> : null}
      </View>
    </TouchableOpacity>
    {presentation === 'inline' ? (open ? <View style={compact ? styles.compactInline : styles.inline}>
      {isLoading ? <DropdownSkeleton count={3} /> : options.map(item => <TouchableOpacity key={String(item.id)} accessibilityRole="radio" disabled={disabled || isLoading} accessibilityState={{ checked: value?.id === item.id, disabled: !!(disabled || isLoading) }} onPress={() => { onChange(item); setOpen(false); }} style={styles.optionTarget}><View style={compact ? [styles.compactOption, value?.id === item.id && { backgroundColor: (statusTones[item.id] || statusTones.default).background }] : styles.option}><Text style={[styles.value, compact && reviewControls.value, { flex: 1 }]}>{item.label}</Text>{compact && value?.id === item.id ? <Feather name="check" size={reviewControls.icon} color={colors.blue} /> : null}</View></TouchableOpacity>)}
      {!compact && !isLoading ? <TouchableOpacity accessibilityRole="button" onPress={() => setOpen(false)} style={styles.option}><Text style={styles.label}>Cancel</Text></TouchableOpacity> : null}
    </View> : null) : <AppBottomSheet visible={open} title={label || 'Select an option'} onClose={() => setOpen(false)} returnFocusRef={trigger} scroll={false}>
      <FlatList style={{ maxHeight: height * 0.55, flexGrow: 0 }} data={options} keyExtractor={item => String(item.id)}
        keyboardShouldPersistTaps="handled" renderItem={({ item }) => <TouchableOpacity accessibilityRole="button"
          onPress={() => { onChange(item); setOpen(false); }} style={styles.option}><Text style={styles.value}>{item.label}</Text></TouchableOpacity>}
        ListEmptyComponent={isLoading ? <DropdownSkeleton count={3} /> : <Text style={styles.label}>No options available.</Text>} />
    </AppBottomSheet>}
  </View>;
}
const styles = StyleSheet.create({
  defaultContents: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, gap: 8 },
  compactTarget: { minHeight: sizes.touch, justifyContent: 'center' },
  compactField: { minHeight: reviewControls.fieldHeight, paddingVertical: 4, paddingHorizontal: reviewControls.padding, borderRadius: reviewControls.radius },
  compactInline: { gap: 0 },
  optionTarget: { minHeight: sizes.touch, justifyContent: 'center' },
  compactOption: { flexDirection: 'row', alignItems: 'center', minHeight: reviewControls.optionHeight, paddingHorizontal: reviewControls.padding, paddingVertical: 4, borderRadius: reviewControls.radius, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { ...type.label, color: colors.text, marginBottom: form.labelGap }, value: { ...type.field, color: colors.text, flexShrink: 1 },
  field: { minHeight: sizes.input, paddingHorizontal: form.paddingHorizontal, paddingVertical: form.paddingVertical, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  inline: { paddingHorizontal: form.paddingHorizontal, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginTop: 4 },
  option: { minHeight: sizes.touch, justifyContent: 'center', paddingVertical: form.paddingVertical, borderBottomWidth: 1, borderBottomColor: colors.border },
});
