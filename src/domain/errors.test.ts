import {
  assertProjectName,
  assertRecurrence,
  assertTagName,
  assertTodoTitle,
  TodoDomainError,
} from './errors';

describe('TodoDomainError', () => {
  it('빈 제목, 프로젝트 및 태그 이름을 코드가 있는 오류로 거부한다', () => {
    expect(() => assertTodoTitle('   ')).toThrow(TodoDomainError);
    expect(captureError(() => assertProjectName(''))).toMatchObject({
      code: 'INVALID_PROJECT_NAME',
    });
    expect(captureError(() => assertTagName(' '))).toMatchObject({
      code: 'INVALID_TAG_NAME',
    });
  });

  it('반복 간격은 1 이상의 정수만 허용한다', () => {
    expect(captureError(() => assertRecurrence(0))).toMatchObject({
      code: 'INVALID_RECURRENCE',
    });
    expect(() => assertRecurrence(1.5)).toThrow(TodoDomainError);
    expect(() => assertRecurrence(1)).not.toThrow();
  });
});

function captureError(action: () => void) {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error('오류가 발생해야 합니다.');
}
