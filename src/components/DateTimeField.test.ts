import { commitSelectedDate } from './DateTimeField';

describe('DateTimeField Android date selection', () => {
  it('시간 선택을 마치기 전에도 선택한 토요일 날짜를 저장한다', () => {
    const initialDate = new Date(2026, 7, 27, 23, 59, 0, 0);
    const selectedSaturday = new Date(2026, 7, 29, 12, 0, 0, 0);
    const onChange = jest.fn();

    const committed = commitSelectedDate(
      selectedSaturday,
      initialDate,
      onChange,
    );

    expect(committed.getDay()).toBe(6);
    expect(committed.getFullYear()).toBe(2026);
    expect(committed.getMonth()).toBe(7);
    expect(committed.getDate()).toBe(29);
    expect(committed.getHours()).toBe(23);
    expect(committed.getMinutes()).toBe(59);
    expect(onChange).toHaveBeenCalledWith(committed.getTime());
  });
});
