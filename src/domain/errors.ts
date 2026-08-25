export type TodoDomainErrorCode =
  | 'EMPTY_TITLE'
  | 'TODO_NOT_FOUND'
  | 'INVALID_RECURRENCE'
  | 'INVALID_PROJECT_NAME'
  | 'INVALID_TAG_NAME';

export class TodoDomainError extends Error {
  constructor(
    public readonly code: TodoDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TodoDomainError';
  }
}

export function assertTodoTitle(title: string) {
  if (!title.trim()) {
    throw new TodoDomainError(
      'EMPTY_TITLE',
      '할 일 제목은 비어 있을 수 없습니다.',
    );
  }
}

export function assertRecurrence(interval: number) {
  if (!Number.isInteger(interval) || interval < 1) {
    throw new TodoDomainError(
      'INVALID_RECURRENCE',
      '반복 간격은 1 이상의 정수여야 합니다.',
    );
  }
}

export function assertProjectName(name: string) {
  if (!name.trim()) {
    throw new TodoDomainError(
      'INVALID_PROJECT_NAME',
      '프로젝트 이름은 비어 있을 수 없습니다.',
    );
  }
}

export function assertTagName(name: string) {
  if (!name.trim()) {
    throw new TodoDomainError(
      'INVALID_TAG_NAME',
      '태그 이름은 비어 있을 수 없습니다.',
    );
  }
}
