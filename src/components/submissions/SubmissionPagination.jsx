import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '../common/FontText';
import { colors, compact, radii, space, type } from '../../theme/tokens';

export default function SubmissionPagination({ currentPage = 1, totalPages = 1, onPageChange, className = 'mb-6', busy = false }) {
  const total = Math.max(1, totalPages), page = Math.min(Math.max(1, currentPage), total);
  const pages = total <= 5 ? Array.from({ length: total }, (_, index) => index + 1) : [...new Set([1, page - 1, page, page + 1, total])].filter(n => n > 0 && n <= total).sort((a, b) => a - b);
  const change = n => { if (!busy && n !== page && n >= 1 && n <= total) onPageChange?.(n); };
  const arrow = (direction, disabled, next) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${direction} page`} accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={() => change(next)} style={{ width: compact.touch, minHeight: compact.touch, alignItems: 'center', justifyContent: 'center', opacity: disabled || busy ? 0.45 : 1 }}><Feather name={direction === 'Previous' ? 'chevron-left' : 'chevron-right'} size={18} color={colors.onYellow} /></TouchableOpacity>;
  return <View className={className} accessibilityLabel={`Page ${page} of ${total}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.yellow, borderRadius: radii.field, paddingHorizontal: space.xs }}>
    {arrow('Previous', page === 1, page - 1)}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center' }} keyboardShouldPersistTaps="handled">
      {pages.map(n => <TouchableOpacity key={n} accessibilityRole="button" accessibilityLabel={`Page ${n}`} accessibilityState={{ selected: page === n, disabled: busy || page === n, busy }} disabled={busy || page === n} onPress={() => change(n)} style={{ minWidth: compact.touch, minHeight: compact.touch, alignItems: 'center', justifyContent: 'center' }}><View style={{ borderRadius: radii.chip, padding: space.sm, backgroundColor: page === n ? colors.surface : 'transparent' }}><Text style={{ ...type.compactLabel, color: colors.onYellow, fontVariant: ['tabular-nums'] }}>{n}</Text></View></TouchableOpacity>)}
    </ScrollView>
    {arrow('Next', page === total, page + 1)}
  </View>;
}
