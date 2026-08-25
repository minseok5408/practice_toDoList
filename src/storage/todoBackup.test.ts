import {
  exportRawTodoStorageBackup,
  type TodoBackupDependencies,
} from './todoBackup';

function createDependencies(
  rawData: string | null,
): jest.Mocked<TodoBackupDependencies> {
  return {
    readRawData: jest.fn().mockResolvedValue(rawData),
    isSharingAvailable: jest.fn().mockResolvedValue(true),
    writeBackupFile: jest
      .fn()
      .mockReturnValue('file:///practice-todo-recovery.txt'),
    shareBackupFile: jest.fn().mockResolvedValue(undefined),
  };
}

describe('todoBackup', () => {
  it('손상 여부와 관계없이 저장소 원문을 그대로 파일에 기록한다', async () => {
    const rawData = '{broken-json';
    const dependencies = createDependencies(rawData);

    await exportRawTodoStorageBackup(dependencies);

    expect(dependencies.writeBackupFile).toHaveBeenCalledWith(rawData);
    expect(dependencies.shareBackupFile).toHaveBeenCalledWith(
      'file:///practice-todo-recovery.txt',
    );
  });

  it('원본 데이터가 없으면 빈 백업을 만들지 않는다', async () => {
    const dependencies = createDependencies(null);

    await expect(exportRawTodoStorageBackup(dependencies)).rejects.toThrow(
      '내보낼 원본 저장 데이터가 없습니다.',
    );
    expect(dependencies.writeBackupFile).not.toHaveBeenCalled();
  });

  it('공유 기능을 사용할 수 없으면 파일을 만들지 않는다', async () => {
    const dependencies = createDependencies('{}');
    dependencies.isSharingAvailable.mockResolvedValue(false);

    await expect(exportRawTodoStorageBackup(dependencies)).rejects.toThrow(
      '이 기기에서는 파일 공유 기능을 사용할 수 없습니다.',
    );
    expect(dependencies.writeBackupFile).not.toHaveBeenCalled();
  });
});
