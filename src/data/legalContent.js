/**
 * VISTA Mobile Legal and Information Documents
 *
 * Source of Truth:
 * - Privacy Policy: vista-web/src/modules/LegalPages.jsx (Approved)
 * - Terms of Service: vista-web/src/modules/LegalPages.jsx (Approved)
 * - Community Guidelines: VISTA Submission Policies (Draft pending OSA approval)
 * - About VISTA: Institutional Platform Summary
 */

export const CONTACT_EMAIL = 'vista.ustp.edu.ph@gmail.com';
export const LAST_UPDATED = 'October 2026';
export const APP_VERSION = '1.0.4';

export const LEGAL_DOCUMENTS = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    status: 'Approved',
    isDraft: false,
    eyebrow: 'VISTA / Trust & Transparency',
    summary:
      'This policy explains how VISTA handles information when you use its account, student-organization document, review, and Google integration features.',
    lastUpdated: LAST_UPDATED,
    sourceFile: 'vista-web/src/modules/LegalPages.jsx',
    sections: [
      {
        number: '01',
        title: '1. About VISTA and this policy',
        paragraphs: [
          'VISTA is a document submission and review platform for Office of Student Affairs workflows. Students and organization representatives submit records, while authorized staff and administrators manage accounts, review documents, and track decisions. This policy covers this VISTA deployment and its connected services.',
          `For privacy questions, contact the VISTA project administrator at ${CONTACT_EMAIL}. This contact is for VISTA; it is not Google support.`,
        ],
      },
      {
        number: '02',
        title: '2. Information we process',
        bullets: [
          'Account details, including your name, email address, assigned role, organization, account status, and any profile image you provide.',
          'Documents and information you submit, including file contents, filenames, event or activity details, organization information, and academic-year and document-type selections. Documents may include information about other people.',
          'Review decisions, remarks, status changes, notifications, and audit records associated with account and document activity.',
          'Authentication information, including password hashes, verification codes, session or access tokens, and Google OAuth credentials where an integration is authorized.',
          'Operational information needed to run and protect the service, such as request/error logs, access times, and technical information handled by our hosting providers.',
        ],
      },
      {
        number: '03',
        title: '3. How information is used',
        paragraphs: [
          'We use this information to authenticate users, administer access, process and review submissions, generate reports, maintain activity history, provide notifications, send account and password-verification emails, troubleshoot failures, and protect the service against misuse.',
          'OCR processes uploaded documents to suggest registration fields. Suggestions can be inaccurate and must be reviewed by a person before submission. Access to documents and review information is governed by the user’s assigned role and the organization’s administrative workflow.',
        ],
      },
      {
        number: '04',
        title: '4. Google API access and use',
        paragraphs: [
          'Google Drive: staff who connect a Google account authorize VISTA to list or select folders, create workflow folders, and upload submission documents to the selected destination. Depending on the granted permission, Drive access may be broader than files created by VISTA. The consent screen shows the requested scope. VISTA uses that access for the document-management features initiated through the application.',
          'Drive connection information may include the authorized account identifier, granted scopes, selected folder identifiers, token expiry, and access/refresh tokens. Drive tokens are stored encrypted in the backend database. Uploaded files and folder metadata are processed as needed to complete the requested transfer.',
          'Gmail: VISTA’s configured sender account authorizes the Gmail send permission to deliver welcome messages, temporary account credentials, and password-verification codes. Recipients do not need to connect their Gmail accounts. The Gmail integration does not request permission to read recipients’ inboxes. The sender’s OAuth credentials are kept in backend configuration.',
          'VISTA does not sell Google user data, use it for advertising or credit decisions, or use it to train generalized artificial-intelligence or machine-learning models. Human access to Google user data is limited to authorized, user-directed document workflows and circumstances permitted by Google’s policies, such as security investigation or legal requirements.',
          'VISTA’s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy and the Google Workspace API User Data and Developer Policy, including the Limited Use requirements.',
        ],
      },
      {
        number: '05',
        title: '5. Access, service providers, and sharing',
        paragraphs: [
          'Authorized staff and administrators can access records needed for their assigned duties. VISTA uses Railway for application hosting and database/background-job infrastructure, Cloudinary for uploaded media and documents, and Google for authorized Drive storage and Gmail delivery. These providers process relevant data to supply those services and may process it in countries outside your location.',
          'Emails contain the recipient address and message content; approved Drive transfers contain the selected documents and associated folder/file metadata. We may also disclose information when required by applicable law or to investigate security incidents.',
        ],
      },
      {
        number: '06',
        title: '6. Storage and security',
        paragraphs: [
          'VISTA uses local client storage for login tokens and cached session information. Signing out clears the application’s login tokens. Do not use a shared device without signing out.',
          'The application uses HTTPS, hashed account passwords, role-based access controls, and encryption for stored Drive tokens. These measures reduce risk but cannot guarantee that every incident or unauthorized disclosure will be prevented. Never send your password, verification code, or OAuth token in a support message.',
        ],
      },
      {
        number: '07',
        title: '7. Retention, disconnection, and deletion',
        paragraphs: [
          'Account, submission, and audit records are retained for the administrative workflow, recordkeeping, security, and applicable institutional or legal requirements. This deployment does not promise a single automatic deletion period for all record types.',
          'You may disconnect Drive using VISTA’s integration controls and revoke Google authorization through your Google Account connections. Revocation stops future authorized API access; it does not automatically delete documents already transferred to Drive, sent emails, or institutional submission records.',
          `Request access, correction, account closure, or deletion by contacting ${CONTACT_EMAIL}. Some records may need to remain for authorized recordkeeping, security, or legal reasons.`,
        ],
      },
      {
        number: '08',
        title: '8. Changes and contact',
        paragraphs: [
          'Updates will be published with a revised date. Material changes to Google data access or use will be communicated and additional consent requested where required before introducing that new use.',
          `Questions and privacy requests: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Terms of Service',
    status: 'Approved',
    isDraft: false,
    eyebrow: 'VISTA / Clear Guidelines',
    summary:
      'These terms describe the responsibilities of people using VISTA for account access, document submission, review, and related integrations. Read them together with the Privacy Policy.',
    lastUpdated: LAST_UPDATED,
    sourceFile: 'vista-web/src/modules/LegalPages.jsx',
    sections: [
      {
        number: '01',
        title: '1. Purpose and access',
        paragraphs: [
          'VISTA supports Office of Student Affairs document workflows. Use the service only for activities you are authorized to perform. Your assigned role determines which functions and records you may access. If you do not agree to these terms, do not use the service and contact the administrator about an alternative process.',
          'These terms describe use of the platform; they do not replace applicable school policies, submission requirements, or legal rights.',
        ],
      },
      {
        number: '02',
        title: '2. Account responsibilities',
        paragraphs: [
          'Provide accurate account information, protect your credentials, change temporary passwords after first sign-in, and do not share verification codes. Do not use another person’s account or attempt to bypass role restrictions. Notify the administrator promptly if you suspect unauthorized access.',
        ],
      },
      {
        number: '03',
        title: '3. Documents and review decisions',
        paragraphs: [
          'Submit only material you have authority to provide, including any personal information about other people. Check document accuracy, required approvals, and your right to share attachments. You retain any rights you hold in submitted material; providing it authorizes the processing, storage, review, and authorized transfer needed for the requested VISTA workflow.',
          'OCR suggestions, status displays, and generated reports are aids. Review extracted fields before submitting. Uploading a document does not itself constitute institutional approval; authorized reviewers make decisions through the applicable process.',
        ],
      },
      {
        number: '04',
        title: '4. Acceptable use',
        paragraphs: [
          'Do not upload malicious or unlawful content, falsify records, impersonate others, access records without authorization, harvest personal information, disrupt the service, or exploit vulnerabilities. Report suspected security issues privately to the administrator rather than testing against other users’ data.',
        ],
      },
      {
        number: '05',
        title: '5. Google and connected services',
        paragraphs: [
          'Connect a Google Drive account only if you have permission to use it for the intended documents. Review requested permissions and the selected destination before authorizing a transfer. Files copied to Drive may remain there after you disconnect VISTA.',
          'Account and verification emails are operational messages. Delivery can be delayed or fail, and verification codes expire. Do not assume that a missing welcome email means the account was not created; contact the administrator before retrying account creation.',
        ],
      },
      {
        number: '06',
        title: '6. Availability and restrictions',
        paragraphs: [
          'Maintenance, connectivity problems, provider outages, and changes to external services can interrupt access or processing. VISTA does not promise uninterrupted operation or error-free OCR. Use the administrator’s alternative submission process when a deadline cannot wait for restoration.',
          'Authorized administrators may restrict accounts to address misuse, security concerns, or changes in eligibility. Contact the administrator to ask about a restriction, correction, or recovery of records you are entitled to receive.',
        ],
      },
      {
        number: '07',
        title: '7. Privacy and records',
        paragraphs: [
          'Our Privacy Policy explains the information processed, Google permissions, service providers, client storage, retention, and how to make a privacy request. Do not upload information that is unnecessary for your submission.',
        ],
      },
      {
        number: '08',
        title: '8. Changes and contact',
        paragraphs: [
          'We may update these terms as the service changes. The current version and its date will remain publicly available here. Material changes will be communicated through an appropriate service notice.',
          `For service questions or concerns, contact the VISTA project administrator at ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },

  guidelines: {
    id: 'guidelines',
    title: 'Community & Submission Guidelines',
    status: 'Draft — Pending Official OSA Approval',
    isDraft: true,
    eyebrow: 'VISTA / Institutional Standards',
    summary:
      'Standard operating and conduct guidelines for student organizations and individual submitters submitting official documents to the Office of Student Affairs.',
    lastUpdated: 'Proposed Draft (Pending OSA Review)',
    sourceFile: 'VISTA Submission System Policy (Draft)',
    sections: [
      {
        number: '01',
        title: '1. Authenticity of submissions',
        paragraphs: [
          'All documents submitted through VISTA must be genuine and accurately represent student activities, financial requests, and official student body events. Forgery or alteration of adviser signatures, official receipts, or administrative approvals is strictly prohibited and subject to institutional disciplinary action.',
        ],
      },
      {
        number: '02',
        title: '2. Attachment standards and readability',
        paragraphs: [
          'Submit scanned documents that are legible, upright, and complete. Ensure all pages of multi-page proposals or liquidation reports are included in sequence. Scans with excessive blur, cut-off content, or unreadable receipts may be returned with a request for resubmission.',
        ],
      },
      {
        number: '03',
        title: '3. Organization representation',
        paragraphs: [
          'Only authorized officers may file submissions on behalf of a recognized student organization. Peer members of the same organization are granted View-Only access to monitor status but may not modify or reply to submissions unless designated by the submitter.',
        ],
      },
      {
        number: '04',
        title: '4. Threaded conversation conduct',
        paragraphs: [
          'The conversation thread attached to each submission is an official administrative channel. Keep replies professional, concise, and focused on resolving reviewer remarks. Links included in replies must be HTTPS web addresses relevant to the submission.',
        ],
      },
      {
        number: '05',
        title: '5. Submission review timelines',
        paragraphs: [
          'Submissions enter the "On Process" queue immediately upon creation. Normal processing times range from 2 to 5 business days. Time-sensitive proposals must be submitted with sufficient lead time prior to the scheduled event date.',
        ],
      },
      {
        number: '06',
        title: '6. Confidentiality and data handling',
        paragraphs: [
          'Submissions containing personal student information, academic records, or financial disclosures must be treated with discretion. Do not share confidential submission download links outside authorized student organization leadership.',
        ],
      },
    ],
  },

  about: {
    id: 'about',
    title: 'About VISTA',
    status: 'Official System Information',
    isDraft: false,
    eyebrow: 'VISTA / University Platform',
    summary:
      'Verified Intake and Submission Tracking Assistant — the official document management platform for the University of Science and Technology of Southern Philippines (USTP) Office of Student Affairs.',
    lastUpdated: LAST_UPDATED,
    sourceFile: 'VISTA Architecture Documentation',
    sections: [
      {
        number: '01',
        title: '1. Platform mission',
        paragraphs: [
          'VISTA modernizes student organization document workflows, providing transparent tracking, automated audit history, and structured review processes for the Office of Student Affairs.',
        ],
      },
      {
        number: '02',
        title: '2. Core capabilities',
        bullets: [
          'Instant status tracking: Follow submissions from initial intake ("On Process") to final approval or remarks.',
          'Three-channel notifications: Receive real-time in-app alerts, native Android push notifications, and verified email dispatches.',
          'OCR-assisted processing: Rapid extraction of proposal metadata and activity dates from physical scans.',
          'Google Drive synchronization: Automated archival of approved student documents to institutional cloud repositories.',
        ],
      },
      {
        number: '03',
        title: '3. Technical architecture',
        paragraphs: [
          'VISTA Mobile is built with React Native and Expo, connecting securely to a Django REST Framework backend hosted on Railway, backed by PostgreSQL and Celery/Redis asynchronous workers.',
        ],
      },
      {
        number: '04',
        title: '4. Institutional ownership',
        paragraphs: [
          'Developed for and administered by the Office of Student Affairs, University of Science and Technology of Southern Philippines (USTP), Cagayan de Oro City.',
          `Support contact: ${CONTACT_EMAIL}`,
        ],
      },
    ],
  },
};
