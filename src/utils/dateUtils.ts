/**
 * Formats a date string to the format: "DD/MMM/YYYY" (e.g., "04/Nov/2025")
 * @param dateInput - The date to format (ISO string, Date object, Dayjs object, or any valid date string)
 * @returns Formatted date string in "DD/MMM/YYYY" format, or the original string if formatting fails
 */
export const formatDate = (
  dateInput: string | Date | null | undefined | unknown
): string => {
  if (!dateInput) return 'N/A';

  try {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (
      dateInput &&
      typeof dateInput === 'object' &&
      typeof dateInput.toDate === 'function'
    ) {
      date = dateInput.toDate();
    } else {
      date = new Date(dateInput);
    }
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
};
