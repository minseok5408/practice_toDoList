import { buildMonthGrid, getWeekdayLabels } from './CalendarScreen';

describe('CalendarScreen calendar grid', () => {
  it('일요일부터 토요일까지 요일을 표시한다', () => {
    expect(getWeekdayLabels('ko')).toEqual([
      '일',
      '월',
      '화',
      '수',
      '목',
      '금',
      '토',
    ]);
    expect(getWeekdayLabels('en')).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
  });

  it('각 주에서 일요일부터 토요일까지 날짜를 빠짐없이 배치한다', () => {
    const grid = buildMonthGrid(new Date(2026, 7, 1), new Date(2026, 7, 27));

    expect(grid).toHaveLength(42);
    expect(grid[0].date.getDay()).toBe(0);
    expect(grid[6].date.getDay()).toBe(6);

    for (let row = 0; row < 6; row += 1) {
      expect(grid[row * 7].date.getDay()).toBe(0);
      expect(grid[row * 7 + 6].date.getDay()).toBe(6);
    }

    const saturday = grid.find((day) => day.key === '2026-08-01');
    expect(saturday?.date.getDay()).toBe(6);
    expect(saturday?.inMonth).toBe(true);
  });
});
