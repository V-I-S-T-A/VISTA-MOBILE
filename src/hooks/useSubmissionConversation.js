import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { uuid } from 'expo-modules-core';
import { reviewLogsService } from '../services/reviewLogsService';
import { canReplyTo, nextPage, prepareReply, uniqueRows } from '../components/submissions/conversationPolicy.cjs';
import { confirmReply } from '../components/submissions/confirmReply.cjs';

export default function useSubmissionConversation({ submissionId, scope, access, enabled, onAccessLost }) {
  const client = useQueryClient();
  const draftKey = ['review-drafts', submissionId, scope];
  const [drafts, setDrafts] = useState(() => client.getQueryData(draftKey) || {});
  const [target, setTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  const abort = useRef(null);
  const logs = useInfiniteQuery({
    queryKey: ['review-logs', submissionId, scope],
    queryFn: ({ pageParam, signal }) => reviewLogsService.listReviewLogs(submissionId, { page: pageParam, pageSize: 20, signal }),
    initialPageParam: 1, getNextPageParam: nextPage, enabled, retry: false, staleTime: 0,
  });
  const entries = logs.isError ? [] : uniqueRows(logs.data?.pages, 'log_id');
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; abort.current?.abort(); };
  }, []);
  useEffect(() => {
    if ([403, 404].includes(logs.error?.status)) onAccessLost();
  }, [logs.error, onAccessLost]);
  const targetKey = target ? JSON.stringify([target.log.log_id, target.parentId]) : '';
  const draft = drafts[targetKey]?.message || '';
  function selectTarget(log, reply = null) {
    if (pending.current || !canReplyTo(log, access)) return;
    setTarget({ log, parentId: reply?.reply_id || null, name: reply?.author_name || log.changed_by_name || 'OSA Staff' });
    setError(''); setNotice('');
  }
  function changeDraft(message) {
    if (!target || pending.current) return;
    const updated = { ...drafts, [targetKey]: { ...drafts[targetKey], message } };
    setDrafts(updated); client.setQueryData(draftKey, updated); setNotice('');
  }
  async function send() {
    if (pending.current || !target || !canReplyTo(target.log, access) || !enabled) return;
    let payload;
    const requests = { ...drafts[targetKey]?.requests };
    try { payload = prepareReply(draft, target.log.log_id, target.parentId, requests, () => uuid.v4()); }
    catch (err) { setError(err.message); return; }
    const updated = { ...drafts, [targetKey]: { message: draft, requests } };
    setDrafts(updated); client.setQueryData(draftKey, updated);
    pending.current = true; setSending(true); setError(''); setNotice('');
    abort.current = new AbortController();
    const options = { signal: abort.current.signal };
    try {
      const saved = await reviewLogsService.createReply(target.log.log_id, payload, options);
      const fresh = await confirmReply(saved, page => reviewLogsService.getReplies(target.log.log_id, { page, ...options }));
      if (!mounted.current) return;
      client.setQueryData(['review-replies', submissionId, scope, target.log.log_id], fresh);
      await client.invalidateQueries({ queryKey: ['review-logs', submissionId, scope] });
      if (!mounted.current) return;
      const cleared = { ...updated }; delete cleared[targetKey];
      setDrafts(cleared); client.setQueryData(draftKey, cleared);
      setTarget(null); setNotice('Reply sent and confirmed.');
    } catch (err) {
      if (!mounted.current) return;
      if ([403, 404].includes(err.status)) onAccessLost();
      else setError(`${err.message || 'Reply could not be confirmed.'} Your draft is retained. Retry uses the same request ID.`);
    } finally {
      pending.current = false;
      if (mounted.current) setSending(false);
    }
  }
  return { logs, entries, target, draft, sending, error, notice, selectTarget, changeDraft, send,
    cancel: () => { if (!pending.current) { setTarget(null); setError(''); } },
    hasReply: entries.some(log => canReplyTo(log, access)) };
}
