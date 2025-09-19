import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/it';

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('it');

export const formatDate = (date: string | Date, format = 'DD/MM/YYYY') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date, format = 'DD/MM/YYYY HH:mm') => {
  return dayjs(date).format(format);
};

export const formatTime = (date: string | Date, format = 'HH:mm') => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).fromNow();
};

export const isToday = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const isTomorrow = (date: string | Date) => {
  return dayjs(date).isSame(dayjs().add(1, 'day'), 'day');
};

export const isYesterday = (date: string | Date) => {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

export const isThisWeek = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'week');
};

export const isThisMonth = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'month');
};

export const isThisYear = (date: string | Date) => {
  return dayjs(date).isSame(dayjs(), 'year');
};

export const addDays = (date: string | Date, days: number) => {
  return dayjs(date).add(days, 'day').toDate();
};

export const subtractDays = (date: string | Date, days: number) => {
  return dayjs(date).subtract(days, 'day').toDate();
};

export const getDaysBetween = (startDate: string | Date, endDate: string | Date) => {
  return dayjs(endDate).diff(dayjs(startDate), 'day');
};

export const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (start.isSame(end, 'day')) {
    return start.format('DD/MM/YYYY');
  }

  if (start.isSame(end, 'month')) {
    return `${start.format('DD')}-${end.format('DD/MM/YYYY')}`;
  }

  if (start.isSame(end, 'year')) {
    return `${start.format('DD/MM')}-${end.format('DD/MM/YYYY')}`;
  }

  return `${start.format('DD/MM/YYYY')}-${end.format('DD/MM/YYYY')}`;
};

export const getSmartDateFormat = (date: string | Date) => {
  if (isToday(date)) {
    return `Oggi ${formatTime(date)}`;
  }

  if (isYesterday(date)) {
    return `Ieri ${formatTime(date)}`;
  }

  if (isTomorrow(date)) {
    return `Domani ${formatTime(date)}`;
  }

  if (isThisWeek(date)) {
    return dayjs(date).format('dddd HH:mm');
  }

  if (isThisYear(date)) {
    return dayjs(date).format('DD MMM HH:mm');
  }

  return formatDateTime(date);
};

export const getCalendarWeeks = (year: number, month: number) => {
  const firstDay = dayjs().year(year).month(month).startOf('month');
  const lastDay = dayjs().year(year).month(month).endOf('month');
  
  const startWeek = firstDay.startOf('week');
  const endWeek = lastDay.endOf('week');
  
  const weeks = [];
  let current = startWeek;
  
  while (current.isBefore(endWeek) || current.isSame(endWeek, 'day')) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(current.add(i, 'day'));
    }
    weeks.push(week);
    current = current.add(1, 'week');
  }
  
  return weeks;
};

export const parseItalianDate = (dateString: string) => {
  // Parse dates in DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return dayjs(`${year}-${month}-${day}`).toDate();
  }
  return dayjs(dateString).toDate();
};

export const formatItalianDate = (date: Date | string) => {
  return dayjs(date).format('DD/MM/YYYY');
};

export const formatItalianDateTime = (date: Date | string) => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};
