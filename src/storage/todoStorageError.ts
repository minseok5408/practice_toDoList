export class TodoStorageDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TodoStorageDataError';
  }
}

export class TodoMigrationError extends TodoStorageDataError {
  constructor(message: string) {
    super(message);
    this.name = 'TodoMigrationError';
  }
}
