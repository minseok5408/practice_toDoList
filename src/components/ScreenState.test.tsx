import { fireEvent, render } from '@testing-library/react-native';

import { ScreenState } from './ScreenState';

describe('ScreenState', () => {
  it('오류 설명과 복구 동작을 사용자에게 제공한다', async () => {
    const onRetry = jest.fn();
    const screen = await render(
      <ScreenState
        actionLabel="다시 시도"
        description="저장소를 읽지 못했습니다."
        onAction={onRetry}
        title="저장 확인 필요"
        variant="error"
      />,
    );

    expect(screen.getByText('저장소를 읽지 못했습니다.')).toBeTruthy();
    await fireEvent.press(screen.getByText('다시 시도'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
