const DEPLOYED_API_URL = 'https://vista-backend-production-10d7.up.railway.app/api';
function resolveApiUrl({ development, override }) {
  const value = (development ? override || 'http://127.0.0.1:8000/api' : DEPLOYED_API_URL).replace(/\/$/, '');
  const url = new URL(value);
  if (!development && (url.protocol !== 'https:' || /^(localhost|127\.|0\.|10\.|192\.168\.|\[?::1)/i.test(url.hostname))) {
    throw new Error('Release builds require the deployed HTTPS API.');
  }
  return value;
}
module.exports = { resolveApiUrl, DEPLOYED_API_URL };
