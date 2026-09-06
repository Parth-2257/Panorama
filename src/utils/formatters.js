/**
 * Terminal UI Formatting Utilities for Panorama CLI.
 */

/**
 * Creates a framed header box.
 * @param {string} title
 * @param {number} width
 * @returns {string}
 */
function createHeader(title, width = 56) {
  const line = '='.repeat(width);
  const padding = Math.max(0, Math.floor((width - title.length) / 2));
  const centeredTitle = ' '.repeat(padding) + title;
  return `${line}\n${centeredTitle}\n${line}`;
}

/**
 * Formats a report status with brackets and indicators.
 * @param {string} status - 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
 * @returns {string}
 */
function formatStatusBadge(status) {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
      return '[✓ APPROVED]';
    case 'SUBMITTED':
      return '[⏳ SUBMITTED]';
    case 'REJECTED':
      return '[✗ REJECTED]';
    case 'DRAFT':
    default:
      return '[📝 DRAFT]';
  }
}

/**
 * Formats key-value pairs with alignment.
 * @param {string} key
 * @param {string|number} value
 * @param {number} keyWidth
 * @returns {string}
 */
function formatKeyValue(key, value, keyWidth = 18) {
  const paddedKey = key.padEnd(keyWidth, ' ');
  return `  • ${paddedKey}: ${value}`;
}

module.exports = {
  createHeader,
  formatStatusBadge,
  formatKeyValue,
};
