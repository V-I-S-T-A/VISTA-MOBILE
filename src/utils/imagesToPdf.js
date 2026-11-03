import { File, Paths } from 'expo-file-system';
import { buildImagePdf } from './buildImagePdf.cjs';

// Load the native converter only for this action. Existing installations can
// still review submissions before rebuilding with the SDK-compatible module.
export async function imagesToPdf(files, name = 'Scanned_Documents.pdf') {
  const { requireOptionalNativeModule } = await import('expo-modules-core');
  if (!requireOptionalNativeModule('ExpoImageManipulator')) throw new Error('Rebuild the Android app to enable image-to-PDF conversion. Your selected files are retained.');
  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
  const images = [];
  for (const file of files) {
    const jpeg = await manipulateAsync(file.uri, [], { compress: 0.92, format: SaveFormat.JPEG });
    try {
      images.push({ width: jpeg.width, height: jpeg.height, bytes: await new File(jpeg.uri).bytes() });
    } finally { new File(jpeg.uri).delete(); }
  }
  const output = new File(Paths.cache, `review-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  output.create();
  output.write(buildImagePdf(images));
  return { uri: output.uri, name, driveName: name, type: 'application/pdf', size: output.size };
}
