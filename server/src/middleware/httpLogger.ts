import morgan from 'morgan';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Send morgan's request lines through winston so all logs end up in one place
export const httpLogger = morgan(':method :url :status :response-time ms', {
  stream: { write: (line) => logger.http(line.trim()) },
  skip: () => env.isTest,
});
