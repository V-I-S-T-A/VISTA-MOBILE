# Mobile image assets

Updated 29 October 2026.

All bundled in-app raster images in this directory use WebP. Static React Native `require()` references were updated from PNG/JPEG to WebP. User-uploaded photographs, scanned documents, remote organization logos, and API image URLs retain their existing formats and behavior.

- `login-illustration-hq.webp`: enhanced portrait artwork derived from the original `login-illustration.webp` using built-in image generation. The login displays it full-screen behind a compact form, matching the original portrait reference. The original is preserved. Enhancement reconstructs detail and is not a pixel-identical upscale.
- `login-campus.webp`: copied from `vista-web/src/assets/public/vista-campus.webp`, 1672 × 941; retained but no longer used on the login screen.
- `logo.webp` and `vista-logo.webp`: lossless WebP conversions of the existing 261 × 261 VISTA mark. The old general logo was 163 × 163; both in-app logo files now use the larger existing source. No new logo was generated and no additional detail is claimed through upscaling.
- `default_user.webp` and `google-icon-logo-svgrepo-com.webp`: lossless conversions, preserving actual transparency where present.
- Remaining illustrations and legacy splash artwork: WebP conversions retaining source dimensions. Artwork uses quality 90; transparency is retained where the source has transparent pixels.

`assets/native/app-icon.png` at the project root retains the original PNG source for Expo launcher/adaptive-icon and native splash configuration. Platform-generated Android resource images are build assets and retain their existing formats. These are deliberately separate from the in-app WebP assets. Do not point Expo launcher configuration at an unsupported image format just to remove the last PNG.

The nine original in-app raster files totaled 851,757 bytes. Their WebP replacements, including the larger general logo, total 206,894 bytes. The newly reused high-resolution login artwork adds 443,446 bytes. These figures exclude generated native resources and the separate PNG build source.

Future artwork should reuse the established VISTA brand, use WebP for in-app raster images, preserve alpha for logos, and be checked at its actual displayed dimensions. Avoid enlarging a small source and describing it as newly detailed high-resolution artwork.
