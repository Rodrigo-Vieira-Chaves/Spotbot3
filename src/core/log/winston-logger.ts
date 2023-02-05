import * as winston from 'winston';
import { Logger, LogLevels } from './log.model';
import { text } from '@core/localization/locale';
import { BOT_NAME } from '@core/env/load-env-data';

export class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new winston.transports.Console({
          level: 'info',
          format: winston.format.combine(
            winston.format.align(),
            winston.format.colorize(),
            winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
            winston.format.printf((info) => `[ ${info.timestamp} ][ ${info.level} ][ ${BOT_NAME} ] >> ${info.message}`),
          ),
        }),
      ],
    });
  }

  log(level: LogLevels, textId: string, params) {
    this.logger[level](text(textId, { ...params }));
  }
}
