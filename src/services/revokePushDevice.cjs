// Never replace a failed capability with an unauthenticated or cross-owner delete.
async function revokePushDevice(record, { revokeReceipt, client }) {
  if (record.revokeKey) {
    try { await revokeReceipt(record.revokeKey); return; }
    catch (error) {
      if (error.response?.status !== 400 || error.response?.data?.detail !== 'Invalid revocation credential.') throw error;
      const { data: user } = await client.get('/auth/me/');
      if (record.userId == null || user?.user_id == null || String(record.userId) !== String(user.user_id)) throw error;
    }
  }
  // Existing endpoint filters by BOTH authenticated user and device token.
  await client.delete('/notifications/devices/', { data: { token: record.token } });
}
module.exports = { revokePushDevice };
