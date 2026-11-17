import { useBottomNavClearance } from '../../../theme/layout';
import { ScrollView, RefreshControl, View } from "react-native";
import { useScreenRefresh } from '../../../hooks/useScreenRefresh';
import SubPageHeader from '../../../components/common/SubPageHeader';
import AnalysisActions from "./AnalysisActions";
import AnalysisPreviewCard from "./AnalysisPreviewCard";
import AnalysisResultsHeader from "./AnalysisResultsHeader";
import ExtractedDataCard from "./ExtractedDataCard";
import SystemHealthCard from "./SystemHealthCard";

export default function StaffAnalysisResultsContent({ onBackPress, onRedoPress, navScroll }) {
  const { refreshing, onRefresh } = useScreenRefresh([]);
  const footerClearance = useBottomNavClearance();
  return (
    <View className="flex-1">
      <SubPageHeader onBack={onBackPress} />
      <ScrollView {...navScroll?.scrollProps}
        alwaysBounceVertical overScrollMode="always"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: footerClearance }}
        showsVerticalScrollIndicator={false}
      >
        <AnalysisResultsHeader />
        <SystemHealthCard />
        <AnalysisPreviewCard />
        <ExtractedDataCard />
        <AnalysisActions onRedoPress={onRedoPress} />
      </ScrollView>
    </View>
  );
}
