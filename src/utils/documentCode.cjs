const VALID_CODES = new Set([
  "FM-USTP-OSA-04B",
  "FM-USTP-OSA-010",
  "FM-USTP-OSA-11",
]);

function normalizeDocumentCode(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  return VALID_CODES.has(normalized) ? normalized : null;
}

function visibleSubmissionDescription(value) {
  if (typeof value !== "string") return "";
  const description = value.trim();
  const documentCode = description.match(/^Document code:\s*([\s\S]*)$/i);
  if (!documentCode) return description;

  const normalized = normalizeDocumentCode(documentCode[1]);
  return normalized ? `Document code: ${normalized}` : "";
}

module.exports = { normalizeDocumentCode, visibleSubmissionDescription };
