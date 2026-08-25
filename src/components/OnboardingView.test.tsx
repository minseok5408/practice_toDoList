import { fireEvent, render } from '@testing-library/react-native';

import { OnboardingView } from './AppViews';

describe('OnboardingView', () => {
  it('세 단계를 진행한 뒤 시작 콜백을 호출한다', async () => {
    const onDone = jest.fn();
    const screen = await render(<OnboardingView locale="ko" onDone={onDone} />);

    expect(screen.getByText('오늘을 가볍게 정리해요')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('밀어서 빠르게 처리해요')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('데이터는 이 기기에 저장돼요')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
