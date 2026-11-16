import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { httpLogger } from './middleware/httpLogger';
import { rejectNoSqlOperators } from './middleware/sanitize';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  // Render puts the app behind a proxy, so trust the first hop.
  // Needed for secure cookies and for rate limiting by the real client IP.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true, // allow the auth cookie to be sent
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(httpLogger);
  app.use(rejectNoSqlOperators);

  app.use('/api', apiRoutes);

  // these two must stay last
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
