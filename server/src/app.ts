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

  // Requests reach us through proxies (Vercel, then Render's load balancer).
  // Trusting exactly that many hops lets req.ip be the real visitor, which the
  // rate limiter needs; trusting more would let anyone fake their IP.
  app.set('trust proxy', env.TRUST_PROXY);

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
