const { safeWebUrl } = require('./conversationPolicy.cjs');

// Never rewrite private/signed delivery URLs or route documents through a viewer service.
function attachmentPreview(document, page = 1) {
  const originalUrl = safeWebUrl(document?.file_url);
  if (!originalUrl) return { originalUrl: null, previewUrl: null, paged: false };
  const url = new URL(originalUrl);
  if (url.username || url.password) return { originalUrl: null, previewUrl: null, paged: false };
  const imageExtension = /\.(webp|png|jpe?g|gif|bmp)$/i.test(url.pathname);
  const pdf = !imageExtension && (/\.pdf$/i.test(url.pathname) || /\.pdf$/i.test(document.file_name || '') || document.mime_type === 'application/pdf');
  const image = imageExtension || (!pdf && /^image\//i.test(document.mime_type || ''));
  if (image) return { originalUrl, previewUrl: originalUrl, paged: false };
  const cloudinary = url.hostname === 'res.cloudinary.com' && url.pathname.match(/^\/([^/]+)\/(image|auto)\/upload\/(.+)$/);
  if (pdf && cloudinary && !cloudinary[3].split('/').some(part => part.startsWith('s--')) && !url.search) {
    const rest = cloudinary[3];
    const version = rest.match(/(?:^|\/)(v\d+\/.*)$/);
    // Existing transformations precede the version. Without a version, accept only
    // a plain asset path; guessing where transformations end could change its identity.
    const asset = version ? version[1] : /^[^,]+\.pdf$/i.test(rest) && !rest.split('/').some(part => /^(?:fl|pg|f|w|h|c|q)_/.test(part)) ? rest : null;
    if (asset) {
      const number = Number.isSafeInteger(page) && page > 0 ? page : 1;
      url.pathname = `/${cloudinary[1]}/image/upload/f_webp,q_auto,pg_${number}/${asset.replace(/\.pdf$/i, '.webp')}`;
      return { originalUrl, previewUrl: url.href, paged: true };
    }
  }
  return { originalUrl, previewUrl: null, paged: false };
}

// History exposes names, not document IDs. Link only an unambiguous CURRENT file
// from the most recent change mentioning it. Never link an old name to a later replacement.
function currentHistoryAttachments(log, entries = [], documents = [], staff = false) {
  if (!staff || !['added', 'replaced'].includes(log?.attachment_change?.action)) return [];
  return (log.attachment_change.new_files || []).flatMap(name => {
    const candidates = documents.filter(doc => doc.is_current !== false && doc.file_name === name && safeWebUrl(doc.file_url));
    if (candidates.length !== 1) return [];
    const latest = entries.filter(entry => entry.attachment_change?.new_files?.includes(name))
      .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
    const doc = candidates[0];
    if (latest?.log_id !== log.log_id) return [];
    if (doc.uploaded_at) {
      const uploaded = new Date(doc.uploaded_at).getTime(), changed = new Date(log.changed_at).getTime();
      if (!Number.isFinite(uploaded) || !Number.isFinite(changed) || uploaded > changed) return [];
    }
    return [doc];
  });
}

module.exports = { attachmentPreview, currentHistoryAttachments };
