import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subDays
} from 'date-fns';

export type TimeDimension = 'today' | 'week' | 'month' | 'year' | 'custom';

export function getDateRangeByDimension(dimension: TimeDimension): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (dimension) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    default:
      start = subDays(now, 7);
      end = now;
  }

  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

