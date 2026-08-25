import { fireEvent, render } from '@testing-library/react-native';

import { createTranslator } from '../i18n';
import { StorageRecoveryState } from './StorageRecoveryState';

describe('StorageRecoveryState', () => {
  it('마이그레이션 실패 시 재시도·원본 내보내기·초기화를 제공한다', async () => {
    const onRetry = jest.fn();
    const onBackup = jest.fn();
    const onReset = jest.fn();
    const screen = await render(
      <StorageRecoveryState
        message="저장 데이터 마이그레이션에 실패했습니다."
        onBackup={onBackup}
        onReset={onReset}
        onRetry={onRetry}
        t={createTranslator('ko')}
      />,
    );

    expect(
      screen.getByText('저장 데이터 마이그레이션에 실패했습니다.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByTestId('storage-retry'));
    await fireEvent.press(screen.getByTestId('storage-backup'));
    await fireEvent.press(screen.getByTestId('storage-reset'));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBackup).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
