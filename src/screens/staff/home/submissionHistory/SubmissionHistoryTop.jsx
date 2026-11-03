import PageHeading from "../../../../components/common/PageHeading";
import { View } from "react-native";

export default function SubmissionHistoryTop() {
  return (
    <View>
      <PageHeading compact title="Submission History" subtitle="Review all submissions." style={{ marginBottom: 2 }} />
    </View>
  );
}
