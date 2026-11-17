import { ScrollView, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../common/FontText";
import { colors, compact, motion, radii, sizes, space, type } from "../../theme/tokens";

const PILL_TINT = "rgba(255, 255, 255, 0.52)";

export default function SubmissionPagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "mt-1",
  busy = false,
  variant = "default",
}) {
  const total = Math.max(1, totalPages),
    page = Math.min(Math.max(1, currentPage), total);
  const pages =
    total <= 5
      ? Array.from({ length: total }, (_, index) => index + 1)
      : [...new Set([1, page - 1, page, page + 1, total])]
          .filter((n) => n > 0 && n <= total)
          .sort((a, b) => a - b);
  const items = [];
  pages.forEach((n, index) => {
    if (index > 0 && n - pages[index - 1] > 1) items.push(`ellipsis-${n}`);
    items.push(n);
  });
  const change = (n) => {
    if (!busy && n !== page && n >= 1 && n <= total) onPageChange?.(n);
  };
  if (variant === "history") {
    const arrow = (direction, disabled, next) => (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${direction} page`}
        accessibilityState={{ disabled: disabled || busy, busy }}
        disabled={disabled || busy}
        activeOpacity={motion.pressedOpacity}
        onPress={() => change(next)}
        style={{
          minWidth: sizes.touch,
          minHeight: sizes.touch,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.field,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.chip,
          borderCurve: "continuous",
          opacity: disabled || busy ? motion.disabledOpacity : 1,
        }}
      >
        <Feather
          name={direction === "Previous" ? "chevron-left" : "chevron-right"}
          size={sizes.icon}
          color={colors.navy}
          accessible={false}
          importantForAccessibility="no"
        />
      </TouchableOpacity>
    );
    return (
      <View className={className} style={{
        marginTop: space.md,
        padding: space.sm,
        gap: space.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.field,
        borderCurve: "continuous",
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
          {arrow("Previous", page === 1, page - 1)}
          <Text accessibilityLiveRegion="polite" style={{ ...type.label, flex: 1, textAlign: "center", color: colors.muted, fontVariant: ["tabular-nums"] }}>
            Page {page} of {total}
          </Text>
          {arrow("Next", page === total, page + 1)}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: space.sm }}>
          {items.map(item => typeof item === "string" ? (
            <Text key={item} accessible={false} style={{ ...type.meta, color: colors.muted }}>…</Text>
          ) : (
            <TouchableOpacity
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Page ${item}`}
              accessibilityState={{ selected: page === item, disabled: busy || page === item, busy }}
              disabled={busy || page === item}
              activeOpacity={motion.pressedOpacity}
              onPress={() => change(item)}
              style={{
                minWidth: sizes.touch,
                minHeight: sizes.touch,
                paddingHorizontal: space.sm,
                paddingVertical: space.sm,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: page === item ? colors.blue : colors.field,
                borderRadius: radii.chip,
                borderCurve: "continuous",
                opacity: busy ? motion.disabledOpacity : 1,
              }}
            >
              <Text style={{ ...type.label, color: page === item ? colors.onBrand : colors.navy, fontVariant: ["tabular-nums"] }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }
  const navPill = (direction, disabled, next) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${direction} page`}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={() => change(next)}
      style={{
        minHeight: compact.chipHeight + 6,
        paddingHorizontal: space.md,
        borderRadius: radii.pill,
        backgroundColor: PILL_TINT,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled || busy ? 0.45 : 1,
      }}
    >
      <Text style={{ ...type.compactLabel, color: colors.navy }}>
        {direction}
      </Text>
    </TouchableOpacity>
  );
  return (
    <View
      className={className}
      accessibilityLabel={`Page ${page} of ${total}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.yellow,
        borderRadius: radii.pill,
        padding: space.xs + 2,
        gap: space.xs,
      }}
    >
      {navPill("Previous", page === 1, page - 1)}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          gap: 2,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {items.map((item) =>
          typeof item === "string" ? (
            <View
              key={item}
              style={{
                minWidth: 20,
                height: compact.chipHeight + 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.compactLabel, color: colors.navy }}>
                ...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`Page ${item}`}
              accessibilityState={{
                selected: page === item,
                disabled: busy || page === item,
                busy,
              }}
              disabled={busy || page === item}
              onPress={() => change(item)}
              style={{
                minWidth: 34,
                minHeight: compact.chipHeight + 6,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  minWidth: 34,
                  height: 34,
                  borderRadius: radii.pill,
                  paddingHorizontal: space.xs,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: page === item ? PILL_TINT : "transparent",
                }}
              >
                <Text
                  style={{
                    ...type.compactLabel,
                    color: colors.navy,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {item}
                </Text>
              </View>
            </TouchableOpacity>
          )
        )}
      </ScrollView>
      {navPill("Next", page === total, page + 1)}
    </View>
  );
}
