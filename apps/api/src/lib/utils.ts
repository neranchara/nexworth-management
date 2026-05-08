/**
 * Validates if a date string or object is within the professional "Safe Zone" (1900-2100).
 * This prevents garbage data from corrupting reports and analytics.
 */
export const validateTransactionDate = (dateInput: string | Date | null | undefined): { isValid: boolean; date: Date | null; error?: string } => {
  if (!dateInput) return { isValid: true, date: null };

  const date = new Date(dateInput);
  
  // Check if it's a valid date object
  if (isNaN(date.getTime())) {
    return { isValid: false, date: null, error: "Invalid date format" };
  }

  const year = date.getFullYear();
  
  // Requirement: Safe Zone is 1900 - 2100
  if (year < 1900 || year > 2100) {
    return { isValid: false, date, error: `Date year ${year} is outside the allowed range (1900-2100)` };
  }

  return { isValid: true, date };
};
