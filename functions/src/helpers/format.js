// helpers/format.js
// All date formatting for Firestore keys and display labels.
// Centralised here so key formats never diverge between functions.

/**
 * Format a Date to YYYY-MM-DD (Firestore order document key).
 * @param {Date} date
 * @return {string} e.g. "2026-06-28"
 */
function formatDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Format a Date to YYYY-MM (payment document key prefix).
 * @param {Date} date
 * @return {string} e.g. "2026-06"
 */
function formatMonth(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 7);
}

/**
 * Alias for formatDate — explicit name for use as a Firestore doc key.
 * @param {Date} date
 * @return {string}
 */
function formatDateKey(date = new Date()) {
  return formatDate(date);
}

/**
 * Human-readable month label for notification messages.
 * @param {string} yyyyMM e.g. "2026-06"
 * @return {string} e.g. "June 2026"
 */
function monthLabel(yyyyMM) {
  const [year, month] = yyyyMM.split("-");
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

module.exports = {formatDate, formatMonth, formatDateKey, monthLabel};
