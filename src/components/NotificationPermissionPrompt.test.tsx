import { fireEvent, render, screen } from '@testing-library/react-native';

import { createTranslator } from '../i18n';
import { ThemeContext, lightTheme } from '../theme';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';

describe('NotificationPermissionPrompt', () => {
  it('알림 권한의 필요성을 설명하고 사용자 선택을 전달한다', () => {
    const onAllow = jest.fn();
    const onLater = jest.fn();

    render(
      <ThemeContext.Provider value={lightTheme}>
        <NotificationPermissionPrompt
          onAllow={onAllow}
          onLater={onLater}
          requesting={false}
          t={createTranslator('ko')}
          visible
        />
      </ThemeContext.Provider>,
    );

    expect(screen.getByText('할 일 알림을 받을까요?')).toBeTruthy();
    expect(
      screen.getByText(
        '마감 알림을 배너와 알림창으로 받으려면 알림 권한이 필요합니다.',
      ),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('notification-permission-later'));
    fireEvent.press(screen.getByTestId('notification-permission-allow'));

    expect(onLater).toHaveBeenCalledTimes(1);
    expect(onAllow).toHaveBeenCalledTimes(1);
  });
});
