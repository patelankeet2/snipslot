import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// readable one line format for the terminal
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${extra}${stack ? `\n${stack}` : ''}`;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: consoleFormat, silent: env.isTest }),
];

// Write log files locally. In production Render already keeps the console output.
if (!env.isTest && !env.isProd) {
  const logDir = path.resolve(process.cwd(), 'logs');
  fs.mkdirSync(logDir, { recursive: true });

  const fileFormat = combine(timestamp(), errors({ stack: true }), json());
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // rotate after 5MB
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
    }),
  );
}

// Node caches modules, so every import shares this one logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  transports,
});
