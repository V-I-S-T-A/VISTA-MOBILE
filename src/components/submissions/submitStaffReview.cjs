// Keep acknowledged writes/uploads across confirmation failures so retrying a
// fresh-read failure does not send another decision or start another Drive job.
async function submitStaffReview({ submission, status, remarks, priority, attachmentAction, file, finalFiles = [], reportFiles = [], folderId, journal, services, onQueued }) {
  const signature = JSON.stringify([status, remarks, priority, attachmentAction, file?.uri, finalFiles.map(f => [f.uri, f.driveName]), reportFiles.map(f => [f.uri, f.driveName])]);
  if (journal.signature !== signature) {
    Object.assign(journal, { signature, attempted: false, saved: false });
  }
  journal.uploads ||= new Map();
  if (file && journal.assetUri !== file.uri) {
    journal.asset = await services.prepareAttachment(file);
    journal.assetUri = file.uri;
  }
  const expectedStatus = status || submission.status;
  const attachment = file ? journal.asset : undefined;
  const verify = async () => {
    const fresh = await services.getSubmission(submission.submission_id);
    if (fresh.status !== expectedStatus || fresh.priority_escalation !== priority) throw new Error('The saved status or priority differs from this update. Reload to review it.');
    const documents = (fresh.documents || []).filter(doc => doc.is_current !== false);
    if (attachment && (!documents.some(doc => doc.file_url === attachment.file_url) || (attachmentAction === 'replace' && documents.length !== 1))) throw new Error('The attachment change could not be confirmed. Your selection is retained.');
    if (expectedStatus === 'rejected' && documents.length) throw new Error('The returned entry still has active attachments. Reload to review it.');
    if (remarks.trim() || attachment) {
      const history = await services.listReviewLogs(submission.submission_id);
      if (!history.results?.some(log => log.new_status === expectedStatus && (!remarks.trim() || log.remarks_text?.trim() === remarks.trim()) && (!attachment || log.attachment_change?.new_files?.includes(attachment.file_name)))) throw new Error('The reviewer remarks or attachment history could not be confirmed. Your draft is retained.');
    }
    return fresh;
  };
  if (journal.attempted && !journal.saved) {
    // A lost response can follow a committed transaction. Read before retrying.
    try { await verify(); journal.saved = true; } catch (error) {
      // Permission/network failures must not trigger another mutation.
      if (error.status || !/could not be confirmed|differs|still has/.test(error.message)) throw error;
    }
  }
  if (!journal.saved) {
    journal.attempted = true;
    await services.update({ submissionId: submission.submission_id, status, remarksText: remarks, priorityEscalation: priority,
      ...(attachment ? { attachmentAction, attachment } : {}) });
    journal.saved = true;
  }
  const fresh = await verify();
  const failures = [];
  for (const [uploadKind, files] of [['approved', finalFiles], ['report', reportFiles]]) {
    for (const uploadFile of files) {
      const key = JSON.stringify([uploadKind, uploadFile.uri, uploadFile.driveName]);
      if (journal.uploads.has(key)) {
        if (!journal.uploads.get(key)) failures.push('A Drive queue response was lost; check Notifications before retrying this file to avoid a duplicate upload.');
        continue;
      }
      // No task ID after a transport failure is ambiguous; never auto-queue twice.
      journal.uploads.set(key, null);
      try {
        const queued = await services.uploadDocument({ submissionId: submission.submission_id, file: uploadFile, fileName: uploadFile.driveName.trim(), folderId, uploadKind });
        if (!queued.task_id) throw new Error('Drive did not return a task ID.');
        journal.uploads.set(key, queued.task_id);
        onQueued?.({ taskId: queued.task_id, name: uploadFile.driveName });
      } catch (error) {
        if (error.status) journal.uploads.delete(key);
        failures.push(`${uploadFile.driveName}: ${error.message}`);
      }
    }
  }
  if (failures.length) throw new Error(`Status saved; Drive upload is unconfirmed: ${failures.join(' ')}`);
  return { fresh, queued: journal.uploads.size };
}
module.exports = { submitStaffReview };
