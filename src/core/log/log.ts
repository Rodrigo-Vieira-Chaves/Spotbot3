import { DEV } from '../env/load-env-data';
import { Logger, LogLevels } from './log.model';
import { WinstonLogger } from './winston-logger';
import { NewRelicLogger } from './new-relic-logger';

const logger: Logger = DEV ? new WinstonLogger() : new NewRelicLogger();

export function log(level: LogLevels, textId: string, params) {
  logger.log(level, textId, params);
}
