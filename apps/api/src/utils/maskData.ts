/**
 * Utility for Data Masking (ISP Policy 5)
 * Protects PII (Personally Identifiable Information) in Admin views.
 */

/**
 * Masks account number, leaving only the last 4 digits visible.
 * Example: "1234567890" -> "XXXX-XXXX-7890"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber === '-') return accountNumber;
  if (accountNumber.length < 4) return 'XXXX';
  const lastFour = accountNumber.slice(-4);
  return `XXXX-XXXX-${lastFour}`;
}

/**
 * Masks email address for privacy.
 * Example: "john.doe@example.com" -> "j***e@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Masks LINE User ID.
 */
export function maskLineId(lineId: string): string {
  if (!lineId) return 'N/A';
  return `U***${lineId.slice(-4)}`;
}
