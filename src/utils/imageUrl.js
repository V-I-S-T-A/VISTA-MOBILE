/**
 * Utility for Cloudinary avatar delivery URL optimization.
 * Downscales images to stable dimensions (160px or 256px) for fast loading
 * and cache sharing across avatar sizes.
 *
 * Preserves original URLs for non-Cloudinary, signed, private, or already-transformed images.
 */

const CLOUDINARY_UPLOAD_REGEX = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/;

/**
 * Returns a stable target dimension based on avatar display size.
 * Uses discrete tiers to maximize cache hit rates across components.
 * @param {number} size
 * @returns {number}
 */
export function getAvatarTargetDimension(size = 34) {
  return size > 48 ? 256 : 160;
}

/**
 * Safely generates an appropriately sized delivery URL for Cloudinary avatar display.
 * @param {string|null|undefined} url
 * @param {number} size
 * @returns {string|null}
 */
export function getOptimizedAvatarUrl(url, size = 34) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Local device URIs (file://, content://, data:, blob:) must not be transformed
  if (/^(file|content|data|blob):/i.test(trimmed)) {
    return trimmed;
  }

  // Must match standard Cloudinary image upload path
  const match = trimmed.match(CLOUDINARY_UPLOAD_REGEX);
  if (!match) {
    return trimmed;
  }

  const [, cloudName, remainder] = match;

  // Never alter signed Cloudinary URLs (/s--...--) - modifying breaks signature verification
  if (remainder.startsWith('s--') || remainder.includes('/s--')) {
    return trimmed;
  }

  // Check the first path segment after /image/upload/
  const slashIndex = remainder.indexOf('/');
  const firstSegment = slashIndex === -1 ? remainder : remainder.slice(0, slashIndex);

  // If the first segment is already a transformation (e.g. w_..., c_..., q_..., f_...)
  // avoid double-transforming or corrupting existing parameters.
  if (/^[a-z]{1,3}_/.test(firstSegment)) {
    return trimmed;
  }

  const targetDim = getAvatarTargetDimension(size);
  const transformation = `c_fill,w_${targetDim},h_${targetDim},q_auto`;

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${remainder}`;
}

