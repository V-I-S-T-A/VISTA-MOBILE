/**
 * Role-Based User Manual Content for VISTA Mobile
 *
 * Source of Truth:
 * - Implemented Student workflows & capabilities (conversationPolicy, tracker, tickets)
 * - Implemented Staff review & intake workflows (review panel, document entry, Drive sync)
 */

export const STUDENT_MANUAL = {
  role: 'student',
  title: 'Student User Manual',
  badge: 'Student Guide',
  subtitle: 'Complete guide for students and student organizations navigating VISTA.',
  sections: [
    {
      id: 'student-signin',
      number: '01',
      title: 'Signing In & Account Management',
      summary: 'University Google sign-in and initial profile setup.',
      steps: [
        'Sign in using your institutional USTP Google account or registered university credentials.',
        'On your first sign-in, you will be prompted to complete your profile with your Student ID and College/Department.',
        'Update your profile photo anytime from the Profile screen by selecting camera or gallery upload.',
        'Passwords can be updated securely in Edit Profile using a 6-digit email verification code sent to your inbox.',
      ],
    },
    {
      id: 'student-dashboard',
      number: '02',
      title: 'Student Dashboard',
      summary: 'High-level overview of submission metrics and quick actions.',
      steps: [
        'The home dashboard displays your summary cards: Total submissions, Pending reviews, and Approved documents.',
        'Tapping any summary card navigates directly to the Review Tracker filtered to that status.',
        'The Recent Submissions section shows your latest 5 active submissions with their current status badge.',
        'Use the top bell icon to open your notifications and review recent alerts.',
      ],
    },
    {
      id: 'student-tracker',
      number: '03',
      title: 'Review Tracker & Filtering',
      summary: 'Tracking all submissions, searching titles, and filtering by academic year.',
      steps: [
        'Access the Review Tracker from the bottom navigation bar by tapping the Tracker icon.',
        'Use the Search bar to instantly locate submissions by title or tracking ID.',
        'Tap the Filter button to select a specific Academic Year (e.g., AY 2026-2027) to isolate records.',
        'Switch between status tabs (Total, Pending, Approved, Rejected) to view categorized submissions.',
      ],
    },
    {
      id: 'student-statuses',
      number: '04',
      title: 'Submission Statuses & Lifecycle',
      summary: 'What each official status means throughout the OSA review cycle.',
      steps: [
        'On Process (Under Review): Every new submission starts automatically in this state. It is officially logged and queued for OSA staff evaluation.',
        'Approved: The document proposal or liquidation has been verified and officially approved by the Office of Student Affairs.',
        'Rejected: The submission does not meet university guidelines or lacks required prerequisites. Check reviewer remarks for details.',
        'Resubmission Required: OSA reviewers require revisions, missing attachments, or signature corrections before approval can proceed.',
      ],
    },
    {
      id: 'student-org-submissions',
      number: '05',
      title: 'Organization Submissions & Peer Access',
      summary: 'How submissions work within accredited student organizations.',
      steps: [
        'Submissions filed on behalf of an organization are visible to fellow registered organization members.',
        'Organization members who are not the original submitter have "View Only" access to monitor progress.',
        'The original submitter retains active reply privileges to communicate directly with OSA reviewers.',
      ],
    },
    {
      id: 'student-remarks',
      number: '06',
      title: 'Reading Staff Remarks & Tracking History',
      summary: 'Inspecting chronological feedback, reviewer notes, and decision logs.',
      steps: [
        'Open any submission card from the Tracker or Dashboard to view the Track Details screen.',
        'The ticket displays the cosmic banner, submission metadata, and full document history.',
        'Reviewer remarks appear in the conversation thread with the reviewer name and official timestamp.',
        'A "Latest" tag highlights the most recent evaluation or feedback from OSA staff.',
      ],
    },
    {
      id: 'student-replies',
      number: '07',
      title: 'Replying to Conversation Threads',
      summary: 'Responding to OSA staff notes, drafting messages, and attaching links.',
      steps: [
        'When staff leave remarks or request clarification, a Reply button appears on the remark card.',
        'Tap Reply to focus the compact reply composer immediately above the bottom navigation bar.',
        'Enter your clarification or explanation (up to 4,000 characters). A live character counter appears when nearing the limit.',
        'Tap the Link icon to embed verified HTTPS web links (e.g., Google Drive links or event pages).',
        'Drafts are safely preserved if you navigate away or switch targets before sending.',
      ],
    },
    {
      id: 'student-notifications',
      number: '08',
      title: 'Notifications & Alerts',
      summary: 'Three-channel notification delivery for genuine status changes.',
      steps: [
        'In-App Notification Center: Tap the bell in the top header to view unread alerts with unread badges.',
        'Native Android Push: Registered Android devices receive native push notifications via FCM for immediate updates.',
        'Email Dispatches: Official status changes trigger an automated confirmation email to your institutional inbox.',
        'Tapping any notification navigates directly to the specific submission details.',
      ],
    },
    {
      id: 'student-confidentiality',
      number: '09',
      title: 'Document Access & Confidentiality',
      summary: 'Privacy rules safeguarding student records and attachments.',
      steps: [
        'Your submitted proposals and financial attachments are strictly confidential.',
        'Only authorized OSA reviewers and accredited organization officers can view uploaded files.',
        'Staff-only internal documents and notes are automatically restricted from student view.',
      ],
    },
  ],
};

export const STAFF_MANUAL = {
  role: 'staff',
  title: 'OSA Staff User Manual',
  badge: 'Staff SOP',
  subtitle: 'Standard operating procedures for OSA staff reviewers and administrators.',
  sections: [
    {
      id: 'staff-dashboard',
      number: '01',
      title: 'Staff Dashboard & Intake Overview',
      summary: 'Real-time review metrics and centralized management.',
      steps: [
        'The Staff Home dashboard summarizes current processing queues: Total, Pending, Approved, and Rejected counts.',
        'Quick Action shortcuts allow rapid navigation to Document Entry, Review Panel, and Google Drive Sync.',
        'Recent incoming submissions are displayed with submitter details and real-time status indicators.',
      ],
    },
    {
      id: 'staff-doc-entry',
      number: '02',
      title: 'Submission Registration & Document Entry',
      summary: 'Registering walk-in documents, scanning attachments, and intake logging.',
      steps: [
        'Open Document Entry from the bottom navigation bar (Profile/Doc Entry tab) or Dashboard action.',
        'Enter the submitter information, student organization name, academic year, and document classification.',
        'Attach scanned pages using camera capture or file selection. The system automatically converts images to optimized WebP and merges them into a standardized PDF.',
        'Every newly registered submission automatically starts with status "On Process" in the review queue.',
      ],
    },
    {
      id: 'staff-review-panel',
      number: '03',
      title: 'Review Panel & Queue Management',
      summary: 'Evaluating active submissions, filtering, and performing searches.',
      steps: [
        'The Review Panel displays all submissions awaiting evaluation or completed decisions.',
        'Use the Academic Year Filter button to isolate submissions for a specific term.',
        'Filter by status tab: All Status, Pending, Approved, or Rejected.',
        'Search submissions by student name, organization title, or submission ID.',
      ],
    },
    {
      id: 'staff-submission-history',
      number: '04',
      title: 'Submission History & Audit Records',
      summary: 'Comprehensive historical archive of processed student records.',
      steps: [
        'Access Submission History from the Staff Review Panel reports tab.',
        'Review complete audit histories, past evaluations, and historical decision remarks.',
        'Use the blue Filter button to filter historical records by Academic Year and status.',
      ],
    },
    {
      id: 'staff-ocr',
      number: '05',
      title: 'OCR-Assisted Document Processing',
      summary: 'Automatic field extraction and human verification requirements.',
      steps: [
        'Optical Character Recognition (OCR) scans uploaded documents to automatically suggest event titles, dates, and organization names.',
        'Important: OCR output is strictly an assistive recommendation. All extracted fields must be reviewed and verified by staff before confirming intake.',
      ],
    },
    {
      id: 'staff-status-updates',
      number: '06',
      title: 'Status Updates & Reviewer Remarks',
      summary: 'Recording decisions, updating statuses, and adding remarks.',
      steps: [
        'On the Submission Details screen, tap the "Status" button on the composer row to open the status evaluation sheet.',
        'Permitted transitions: Transition from On Process to Approved, Rejected, or Resubmission Required.',
        'Provide explanatory remarks for the student, especially when requesting resubmission or explaining rejections.',
        'Remarks-Only Updates: Adding notes without changing the status persists the comment to history without dispatching duplicate transition alerts.',
      ],
    },
    {
      id: 'staff-conversations',
      number: '07',
      title: 'Student Conversations & Thread Management',
      summary: 'Responding to student inquiries and managing threaded replies.',
      steps: [
        'Students can reply directly to remarks. Staff can review student replies chronologically.',
        'Tap Reply on any entry to provide follow-up feedback or confirm receipt of corrected files.',
        'Draft messages remain safely stored per target while reviewing other tabs or documents.',
      ],
    },
    {
      id: 'staff-priority',
      number: '08',
      title: 'Priority & Escalation Management',
      summary: 'Handling time-sensitive submissions with expedited review.',
      steps: [
        'Submissions flagged for priority escalation are highlighted with gold accents and distinct priority tags.',
        'Process priority submissions ahead of general intake to meet event deadlines or university schedules.',
      ],
    },
    {
      id: 'staff-document-previews',
      number: '09',
      title: 'Document Previews & Confidentiality',
      summary: 'Inspecting student files securely within the application.',
      steps: [
        'Tap any document attachment on the ticket to open the secure in-app previewer.',
        'Staff have authorized access to confidential receipts and financial attachments restricted from students.',
        'Never distribute or download confidential student documents to unapproved personal storage.',
      ],
    },
    {
      id: 'staff-gdrive-sync',
      number: '10',
      title: 'Google Drive Archival Workflow',
      summary: 'Syncing approved student submissions to institutional Google Drive folders.',
      steps: [
        'Connect an authorized USTP Google account via the GDrive Sync screen.',
        'Approved submissions can be archived to designated Google Drive folders.',
        'Background archival tasks execute asynchronously with status indicators and automatic retry handling.',
      ],
    },
    {
      id: 'staff-notifications-dispatch',
      number: '11',
      title: 'Multi-Channel Notification Dispatch',
      summary: 'How notifications are dispatched to students across all channels.',
      steps: [
        'Genuine status transitions automatically trigger in-app records, native Android push, and Gmail dispatch.',
        'Changes are strictly committed to the database before notifications are queued.',
        'Failure in one delivery channel does not interrupt or fail the underlying submission change.',
      ],
    },
    {
      id: 'staff-confidentiality-rules',
      number: '12',
      title: 'Staff Data Protection Standards',
      summary: 'Maintaining university privacy compliance and record safety.',
      steps: [
        'Adhere strictly to university data privacy standards when handling student information.',
        'Log out when using shared workstations or devices in the OSA office.',
      ],
    },
  ],
};

export const FALLBACK_MANUAL = {
  role: 'guest',
  title: 'VISTA General Platform Guide',
  badge: 'Platform Guide',
  subtitle: 'General overview of the VISTA submission and tracking system.',
  sections: [
    {
      id: 'general-overview',
      number: '01',
      title: 'About VISTA',
      summary: 'The university document management platform.',
      steps: [
        'VISTA (Verified Intake and Submission Tracking Assistant) is the official platform for USTP Office of Student Affairs workflows.',
        'Sign in with your university Google account to access role-specific features.',
      ],
    },
    {
      id: 'general-support',
      number: '02',
      title: 'Support & Assistance',
      summary: 'Contacting the Office of Student Affairs.',
      steps: [
        'For account or submission inquiries, visit the Office of Student Affairs at the Student Center Building.',
        'Email technical support: vista.ustp.edu.ph@gmail.com',
      ],
    },
  ],
};

export function getManualForRole(role) {
  if (role === 'student') return STUDENT_MANUAL;
  if (role === 'staff' || role === 'admin') return STAFF_MANUAL;
  return FALLBACK_MANUAL;
}
