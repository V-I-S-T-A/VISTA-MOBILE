// Feature copy follows the revised VISTA paper, sections 1.3–1.4.
// Tour selection explains workflows; it never assigns an account role.
export const ONBOARDING_MASCOTS = {
  student: [
    require('../assets/onboarding-mascot-tracking.webp'),
    require('../assets/onboarding-mascot-feedback.webp'),
    require('../assets/onboarding-mascot-notifications.webp'),
  ],
  staff: [
    require('../assets/onboarding-mascot-scan.webp'),
    require('../assets/onboarding-mascot-tracking.webp'),
    require('../assets/onboarding-mascot-review.webp'),
    require('../assets/onboarding-mascot-archive.webp'),
  ],
};
export const ONBOARDING_TOURS = {
  student: [
    { icon: 'file-text', tag: 'Submission visibility', title: 'Monitor every submission', description: 'See your document status, review history, and eligible organization records in one place.', highlights: ['Submission monitoring', 'Review history'] },
    { icon: 'message-circle', tag: 'Clearer communication', title: 'Keep feedback together', description: 'Read OSA remarks with your submission. Original submitters can reply; eligible organization members can follow along.', highlights: ['Staff remarks', 'Threaded replies'] },
    { icon: 'bell', tag: 'Stay informed', title: 'Stay up to date', description: 'Follow submission updates through your dashboard and notifications. OSA staff handle registration, reviews, and archiving.', highlights: ['Status updates', 'One shared record'] },
  ],
  staff: [
    { icon: 'maximize', tag: 'Assisted encoding', title: 'Scan for a head start', description: 'Scan supported event forms to get suggested details. OCR helps with encoding; you stay in control of the information.', highlights: ['Supported forms', 'OCR suggestions'] },
    { icon: 'file-text', tag: 'Centralized registration', title: 'Check, then register', description: 'Check and correct the suggested details, or enter them manually. Save the registration to create a shared document record.', highlights: ['Human confirmation', 'Document registration'] },
    { icon: 'check-square', tag: 'Centralized review', title: 'Review with a clear history', description: 'Manage review outcomes, remarks, and replies together. Your dashboard helps you see what needs attention.', highlights: ['Review decisions', 'Remarks & history'] },
    { icon: 'cloud', tag: 'Organized archiving', title: 'Archive approved documents', description: 'Start a Google Drive transfer for approved files. Check the upload outcome and saved location separately from the review status.', highlights: ['Approved files', 'Archive references'] },
  ],
};
