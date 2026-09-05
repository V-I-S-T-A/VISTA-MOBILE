import { Text, TouchableOpacity, View } from "react-native";

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);
  return Array.from(pages).sort((first, second) => first - second);
}

export default function SubmissionPagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safeTotalPages;
  const pageNumbers = getPageNumbers(safeCurrentPage, safeTotalPages);

  const changePage = (page) => {
    if (page !== safeCurrentPage) onPageChange?.(page);
  };

  return (
    <View className="bg-[#FFD740] rounded-full py-3 px-5 flex-row justify-between items-center mb-8">
      <TouchableOpacity
        className="px-2"
        disabled={!canGoPrevious}
        onPress={() => changePage(safeCurrentPage - 1)}
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
          const previousPage = pageNumbers[index - 1];
          const showGap = previousPage !== undefined && page - previousPage > 1;
          const isCurrent = page === safeCurrentPage;

          return (
            <View key={page} className="flex-row items-center">
              {showGap ? (
                <Text className="text-gray-700 font-semibold text-sm px-1">
                  ...
                </Text>
              ) : null}
              <TouchableOpacity
                disabled={isCurrent}
                onPress={() => changePage(page)}
              >
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
        onPress={() => changePage(safeCurrentPage + 1)}
        style={{ opacity: canGoNext ? 1 : 0.5 }}
      >
        <Text className="text-gray-800 font-bold text-sm">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
