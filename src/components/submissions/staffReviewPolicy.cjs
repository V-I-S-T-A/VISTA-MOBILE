// Verified against merged Web main (PR 76) and Backend main (PR 61).
// Backend states remain broader than the actions offered in the staff decision form.
const STAFF_REVIEW_ACTIONS = Object.freeze([
  { id: 'under_review', label: 'On Process' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Returned' },
]);
const PROCESS_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/*'];
const APPROVAL_FILE_TYPES = ['application/pdf', 'image/*'];
const isImage = file => file.type?.startsWith('image/');
const isPdf = file => file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
function validateReviewFile(file, approval = false) {
  const supported = isImage(file) || isPdf(file) || (!approval && /\.(docx|xlsx)$/i.test(file.name || ''));
  if (!supported) throw new Error(approval ? 'Choose PDF or image files.' : 'Choose a PDF, DOCX, XLSX or image file.');
}
function validateDecision({ status, currentStatus, finalFiles = [], reportFiles = [], returnConfirmation = '' }) {
  if (status && !STAFF_REVIEW_ACTIONS.some(action => action.id === status)) throw new Error('Select a valid action.');
  if (status === 'rejected' && returnConfirmation !== 'RETURNED') throw new Error('Type RETURNED to confirm.');
  if (status === 'approved') {
    if (currentStatus === 'rejected' && !finalFiles.length) throw new Error('Add the approved document before approving this rejected entry.');
    if (finalFiles.length > 10 || reportFiles.length > 10) throw new Error('You can attach up to 10 files in each group.');
    for (const file of [...finalFiles, ...reportFiles]) {
      validateReviewFile(file, true);
      if (!isPdf(file)) throw new Error('Convert the selected images to PDF before submitting.');
      if (!file.driveName?.trim()) throw new Error('Enter a Google Drive filename for each file.');
    }
  }
}
module.exports = { STAFF_REVIEW_ACTIONS, PROCESS_FILE_TYPES, APPROVAL_FILE_TYPES, isImage, isPdf, validateReviewFile, validateDecision };
