import { useBottomNavClearance } from '../../../theme/layout';
import { ScrollView } from "react-native";
import AnalysisActions from "./AnalysisActions";
import AnalysisPreviewCard from "./AnalysisPreviewCard";
import AnalysisResultsHeader from "./AnalysisResultsHeader";
import ExtractedDataCard from "./ExtractedDataCard";
import SystemHealthCard from "./SystemHealthCard";

export default function StaffAnalysisResultsContent({ onBackPress, onRedoPress }) {
  const footerClearance = useBottomNavClearance();
  return (
    <ScrollView
      className="flex-1 pt-2"
      contentContainerStyle={{ paddingBottom: footerClearance }}
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
