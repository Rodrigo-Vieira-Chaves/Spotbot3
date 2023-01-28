export enum LogLevels {
  INFO = 'info',
  WARN = 'warn',
  DEBUG = 'debug',
  ERROR = 'error',
}

export interface Logger {
  log(level: LogLevels, textId: string, params): void;
}
