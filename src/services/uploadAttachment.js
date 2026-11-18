export const ATTACHMENT_UPLOAD_TIMEOUT_MS = 120000;

const interrupted = (message, code) => Object.assign(new Error(message), { code });

// The deadline includes reading the response body. Race the work as well as
// aborting fetch: an old client/transport that ignores abort must release the UI.
export async function uploadAttachment(file, { signal, timeoutMs = ATTACHMENT_UPLOAD_TIMEOUT_MS } = {}) {
  if (signal?.aborted) throw interrupted('The file upload was stopped. Your file selection is retained.', 'ERR_CANCELED');
  const controller = new AbortController();
  let timer, stop, interruption;
  const abort = new Promise((resolve, reject) => {
    const interrupt = error => { interruption = error; reject(error); controller.abort(); };
    stop = () => interrupt(interrupted('The file upload was stopped. Your file selection is retained.', 'ERR_CANCELED'));
    signal?.addEventListener('abort', stop, { once: true });
    timer = setTimeout(() => interrupt(interrupted('The file upload took too long. Your file selection is retained. Check your connection and try again.', 'UPLOAD_TIMEOUT')), timeoutMs);
    if (signal?.aborted) stop();
  });
  const upload = Promise.resolve().then(async () => {
    if (controller.signal.aborted) throw interruption;
    const body = new FormData();
    body.append('file', { uri: file.uri, name: file.name, type: file.type || 'application/octet-stream' });
    body.append('upload_preset', 'vista_uploads');
    const response = await fetch('https://api.cloudinary.com/v1_1/djtdar2ex/auto/upload', { method: 'POST', body, signal: controller.signal });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('The upload service returned an unreadable response. Please try again.'); }
    if (controller.signal.aborted) throw interruption;
    if (!response.ok) {
      const message = response.status >= 500 ? 'The upload service is temporarily unavailable. Please try again.'
        : response.status === 429 ? 'Uploads are busy. Please wait a moment and try again.'
        : 'The file could not be uploaded. Check its format and size, then try again.';
      throw Object.assign(new Error(message), { status: response.status });
    }
    if (!result?.secure_url || !result.public_id || !result.resource_type) throw new Error('The file upload could not be confirmed. Your selection is retained.');
    return result;
  });
  try { return await Promise.race([upload, abort]); }
  catch (error) {
    if (interruption) throw interruption;
    if (error?.name === 'AbortError') throw interrupted('The file upload was stopped. Your file selection is retained.', 'ERR_CANCELED');
    if (error instanceof TypeError) throw interrupted('The upload service cannot be reached. Check your connection and try again.', 'ERR_NETWORK');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', stop);
  }
}
