import * as https from 'https';
import axios, { AxiosInstance } from 'axios';
import { Logger, LogLevels } from './log.model';
import { text } from '@core/localization/locale';
import { BOT_NAME, NEW_RELIC_LICENSE, NEW_RELIC_LOG_ENDPOINT } from '@core/env/load-env-data';

export class NewRelicLogger implements Logger {
  private readonly logger: AxiosInstance;
  private readonly headers = { 'Api-Key': NEW_RELIC_LICENSE };

  constructor() {
    axios.defaults.timeout = 60000;
    axios.defaults.baseURL = NEW_RELIC_LOG_ENDPOINT;
    axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

    this.logger = axios.create();
  }

  log(level: LogLevels, textId: string, params) {
    if (level === LogLevels.DEBUG) {
      return;
    }

    this.logger.request({
      method: 'POST',
      headers: this.headers,
      data: {
        level,
        message: text(textId, { ...params }),
        timestamp: Date.now(),
        attributes: { user: BOT_NAME },
      },
    });
  }
}
