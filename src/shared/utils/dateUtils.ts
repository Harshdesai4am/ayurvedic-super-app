/**
 * Date and Time Formatting Utilities for AyurvedicSuperApp
 * Enforces DD/MM/YYYY for dates and 12-Hour format with AM/PM for times.
 */

export const formatDateDDMMYYYY = (input?: Date | string | number): string => {
  if (!input) return '';
  let dateObj: Date;

  if (typeof input === 'string') {
    // Handle DD/MM/YYYY already
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      return input;
    }
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [year, month, day] = input.split('-');
      return `${day}/${month}/${year}`;
    }
    dateObj = new Date(input);
  } else if (typeof input === 'number') {
    dateObj = new Date(input);
  } else {
    dateObj = input;
  }

  if (isNaN(dateObj.getTime())) {
    return String(input);
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatTime12Hour = (input?: Date | string): string => {
  if (!input) return '';

  if (typeof input === 'string') {
    // Already in 12-hour format e.g. "10:00 AM" or "02:30 PM"
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(input.trim())) {
      return input.trim().toUpperCase();
    }
    // HH:MM 24-hour format
    const match24 = input.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      let hours = parseInt(match24[1], 10);
      const minutes = match24[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    }
  }

  const dateObj = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(dateObj.getTime())) {
    return String(input);
  }

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};
