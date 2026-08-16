import { View, Text, TouchableOpacity } from "react-native";

export default function StaffReviewPagination({
  currentPage = 1,
  totalPages = 1,
  onPrevious,
  onNext,
}) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Windowed page numbers: first, current-1..current+1, last, with ".."
  // between gaps -- same idea as the mock UI, just driven by real totals.
  const pageNumbers = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const set = new Set([1, totalPages, currentPage]);
    if (currentPage - 1 >= 1) set.add(currentPage - 1);
    if (currentPage + 1 <= totalPages) set.add(currentPage + 1);
    return Array.from(set).sort((a, b) => a - b);
  })();

  return (
    <View className="bg-[#FFD740] rounded-full py-3 px-5 flex-row justify-between items-center mb-8">
      <TouchableOpacity
        className="px-2"
        disabled={!canGoPrevious}
        onPress={onPrevious}
      >
        <Text
          className={`font-semibold text-sm ${
            canGoPrevious ? "text-gray-700" : "text-gray-400"
          }`}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center gap-3">
        {pageNumbers.map((page, index) => {
          const prevPage = pageNumbers[index - 1];
          const showGap = prevPage !== undefined && page - prevPage > 1;
          const isCurrent = page === currentPage;

          return (
            <View key={page} className="flex-row items-center">
              {showGap ? (
                <Text className="text-gray-700 font-semibold text-sm px-1">
                  ..
                </Text>
              ) : null}
              <TouchableOpacity disabled={isCurrent}>
                {isCurrent ? (
                  <View className="bg-white w-8 h-8 rounded-full items-center justify-center shadow-sm">
                    <Text className="text-gray-800 font-bold text-sm">
                      {page}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-700 font-semibold text-sm">
                    {page}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        className="bg-white rounded-full py-1.5 px-4 shadow-sm"
        disabled={!canGoNext}
        onPress={onNext}
        style={{ opacity: canGoNext ? 1 : 0.5 }}
      >
        <Text className="text-gray-800 font-bold text-sm">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
