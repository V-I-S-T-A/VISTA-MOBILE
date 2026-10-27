import { Alert } from "react-native";
import { pickDocumentFile, scanDocument } from "./documentScan";

export function openDocumentEntryWithAttachment(navigation) {
  Alert.alert(
    "Add document",
    "Scan a document or choose a PDF or image file.",
    [
      {
        text: "Scan with Camera",
        onPress: async () => {
          try {
            const file = await scanDocument();
            if (!file) return;

            navigation.navigate("StaffDocumentEntry", {
              attachment: { uri: file.uri, name: file.name, type: file.type },
            });
          } catch (error) {
            Alert.alert(
              "Scan failed",
              error?.message || "Could not scan the document. Please try again.",
            );
          }
        },
      },
      {
        text: "Choose File",
        onPress: async () => {
          try {
            const file = await pickDocumentFile();
            if (!file) return;

            navigation.navigate("StaffDocumentEntry", {
              attachment: { uri: file.uri, name: file.name, type: file.type },
            });
          } catch (error) {
            Alert.alert(
              "File selection failed",
              error?.message || "Could not choose that file. Please try again.",
            );
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ],
  );
}
