import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import SubmissionListCard from "../../../components/submissions/SubmissionListCard";

export default function StaffReviewList({
  submissions = [],
  isLoading,
  isError,
  onRetry,
  onOpen,
}) {
  if (isLoading) {
    return (
      <View className="py-10 items-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-10 items-center">
        <Text className="text-gray-500 mb-3">Could not load submissions.</Text>
        <TouchableOpacity
          onPress={onRetry}
          className="bg-vistaNavy rounded-full px-4 py-2"
        >
          <Text className="text-white font-semibold text-xs">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submissions.length === 0) {
    return (
      <View className="py-10 items-center">
        <Text className="text-gray-500 font-medium">
          No submissions to review.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      {submissions.map((submission) => (
        <SubmissionListCard
          key={submission.submission_id}
          submission={submission}
          compact
          onPress={() => onOpen?.(submission)}
        />
      ))}
    </View>
  );
}
