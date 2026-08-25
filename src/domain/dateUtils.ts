export function startOfLocalDay(value: Date | number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function addLocalDays(value: Date | number, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function addLocalMonths(value: Date | number, months: number) {
  const date = new Date(value);
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return date;
}

export function isSameLocalDay(first: Date | number, second: Date | number) {
  const firstDate = new Date(first);
  const secondDate = new Date(second);
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

export function isOverdue(dueAt: number | null, now = Date.now()) {
  return dueAt !== null && dueAt < now;
}

export function getNextWeekday(value: Date | number, interval = 1) {
  let date = new Date(value);
  let remainingWeekdays = Math.max(1, interval);

  while (remainingWeekdays > 0) {
    date = addLocalDays(date, 1);
    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      remainingWeekdays -= 1;
    }
  }

  return date;
}

export function formatLocalDateTime(timestamp: number, locale: 'ko' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
