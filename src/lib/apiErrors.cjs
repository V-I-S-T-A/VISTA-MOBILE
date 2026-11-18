// Keep API validation text useful without rendering objects, HTML error pages,
// or response metadata as user-facing messages.
const metadata = new Set(['code', 'status', 'status_code', 'request_id', 'timestamp', 'traceback', 'stack', 'exception', 'access', 'refresh', 'token']);
const clean = value => typeof value === 'string' && !/<\/?[a-z][^>]*>/i.test(value)
  ? value.replace(/\s+/g, ' ').trim().slice(0, 400) : '';

function validationMessages(value, prefix = '', result = {}, depth = 0) {
  if (depth > 8 || Object.keys(result).length >= 40) return result;
  const text = clean(value);
  if (text) {
    const key = prefix || 'non_field_errors';
    if (!Object.hasOwn(result, key)) result[key] = [];
    result[key].push(text);
  }
  else if (Array.isArray(value)) value.slice(0, 20).forEach(item => validationMessages(item, prefix, result, depth + 1));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (metadata.has(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) continue;
      const nested = ['errors', 'non_field_errors'].includes(key) ? prefix : [prefix, key].filter(Boolean).join('.');
      validationMessages(item, nested, result, depth + 1);
    }
  }
  return result;
}

function normalizeApiError(error) {
  const data = error?.response?.data;
  const status = error?.response?.status ?? error?.status;
  const code = typeof data?.code === 'string' ? data.code : error?.code;
  const fieldErrors = status >= 500 ? {} : validationMessages(data && typeof data === 'object' ? data : null);
  const fallback = status >= 500 ? 'VISTA could not complete the request. Please try again shortly.' : {
    400: 'Please check the information you entered and try again.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to perform this action.',
    404: 'This item is no longer available.',
    409: 'This information has changed. Refresh and try again.',
    413: 'This file is too large. Choose a smaller file.',
    415: 'This file format is not supported.',
    422: 'Please check the information you entered and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
  }[status];
  const explicit = validationMessages(data?.detail ?? data?.non_field_errors ?? data?.message ?? data?.error);
  const first = Object.values(explicit).flat()[0];
  const field = Object.entries(fieldErrors).find(([, values]) => values.length);
  const label = field?.[0].replace(/[._]+/g, ' ');
  const fieldMessage = field && (field[0] === 'non_field_errors' ? field[1][0] : `${label.charAt(0).toUpperCase() + label.slice(1)}: ${field[1][0]}`);
  const network = ['ECONNABORTED', 'ETIMEDOUT'].includes(code)
    ? 'The request took too long. Check your connection and try again.'
    : code === 'ERR_NETWORK' ? 'VISTA cannot be reached. Check your connection and try again.'
    : code === 'ERR_CANCELED' ? 'The request was cancelled.' : '';
  const message = status >= 500 ? fallback : first || fieldMessage || fallback || network || clean(error?.message) || 'Something went wrong. Please try again.';
  const wrapped = new Error(message);
  wrapped.code = code;
  wrapped.status = status;
  wrapped.fieldErrors = fieldErrors;
  return wrapped;
}

module.exports = { normalizeApiError };
