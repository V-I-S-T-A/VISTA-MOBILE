// A POST response alone is not a persistence check. Read the authorized thread
// again and locate the saved row, including threads with more than one page.
async function confirmReply(saved, getPage) {
  const pages = [], pageParams = [];
  for (let page = 1; ; page++) {
    const fresh = await getPage(page);
    pages.push(fresh); pageParams.push(page);
    const row = fresh.results?.find(reply => reply.reply_id === saved.reply_id);
    if (row && row.message === saved.message && row.parent_reply === saved.parent_reply) return { pages, pageParams };
    if (!fresh.next) throw new Error('Reply could not be confirmed. Your draft is retained; retry to confirm it.');
  }
}
module.exports = { confirmReply };
