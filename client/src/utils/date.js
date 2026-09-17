/**
 * Formats a Date object or ISO date string to YYYY-MM-DD
 */
export function toISODateString(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns date range { startDate, endDate, label } for a predefined period key
 */
export function getDateRangePreset(presetKey, customRange = {}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (presetKey) {
    case 'this_week': {
      // Start of week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      return {
        key: 'this_week',
        label: 'This Week',
        startDate: toISODateString(startOfWeek),
        endDate: toISODateString(endOfWeek)
      };
    }

    case 'this_month': {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const monthName = now.toLocaleString('en-US', { month: 'long' });

      return {
        key: 'this_month',
        label: `${monthName} ${year}`,
        startDate: toISODateString(firstDay),
        endDate: toISODateString(lastDay)
      };
    }

    case 'last_month': {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const monthName = firstDay.toLocaleString('en-US', { month: 'long' });
      const lastMonthYear = firstDay.getFullYear();

      return {
        key: 'last_month',
        label: `${monthName} ${lastMonthYear}`,
        startDate: toISODateString(firstDay),
        endDate: toISODateString(lastDay)
      };
    }

    case 'this_year': {
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);

      return {
        key: 'this_year',
        label: `Year ${year}`,
        startDate: toISODateString(firstDay),
        endDate: toISODateString(lastDay)
      };
    }

    case 'all_time': {
      return {
        key: 'all_time',
        label: 'All Time',
        startDate: '',
        endDate: ''
      };
    }

    case 'custom': {
      const start = customRange.startDate || '';
      const end = customRange.endDate || '';
      let label = 'Custom Range';
      if (start && end) {
        label = `${formatDateShort(start)} - ${formatDateShort(end)}`;
      } else if (start) {
        label = `From ${formatDateShort(start)}`;
      } else if (end) {
        label = `Until ${formatDateShort(end)}`;
      }
      return {
        key: 'custom',
        label,
        startDate: start,
        endDate: end
      };
    }

    default:
      return getDateRangePreset('this_month');
  }
}

/**
 * Format "2026-09-17" to "Sep 17" or "Sep 17, 2026"
 */
export function formatDate(dateStr, includeYear = true) {
  if (!dateStr) return '';
  // Avoid timezone offset issues with pure date strings
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, monthIndex, day);
    const month = date.toLocaleString('en-US', { month: 'short' });
    return includeYear ? `${month} ${day}, ${year}` : `${month} ${day}`;
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined
  });
}

export function formatDateShort(dateStr) {
  return formatDate(dateStr, false);
}

/**
 * Relative date or friendly date: "Today", "Yesterday", or "Sep 15"
 */
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const todayStr = toISODateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toISODateString(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  return formatDate(dateStr, false);
}
