import { ScrollView } from "react-native";
import AnalysisActions from "./AnalysisActions";
import AnalysisPreviewCard from "./AnalysisPreviewCard";
import AnalysisResultsHeader from "./AnalysisResultsHeader";
import ExtractedDataCard from "./ExtractedDataCard";
import SystemHealthCard from "./SystemHealthCard";

export default function StaffAnalysisResultsContent({ onBackPress, onRedoPress }) {
  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <AnalysisResultsHeader onBackPress={onBackPress} />
      <SystemHealthCard />
      <AnalysisPreviewCard />
      <ExtractedDataCard />
      <AnalysisActions onRedoPress={onRedoPress} />
    </ScrollView>
  );
}