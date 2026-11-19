import { createApp } from './app';
import { env } from './config/env';
import { database } from './config/db';
import { logger } from './utils/logger';
import { notificationFactory, pushService, reminderJob } from './container';
import { registerNotificationListener } from './listeners/notificationListener';

async function start() {
  // connect first so we never accept requests we cannot serve
  await database.connect();

  // booking events now trigger push notifications
  registerNotificationListener(pushService, notificationFactory);
  if (env.cronEnabled) reminderJob.schedule();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`SnipSlot API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Render sends SIGTERM on every deploy, so finish open requests and close the pool cleanly
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await database.disconnect();
      process.exit(0);
    });
    // do not hang forever if a connection refuses to close
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

start().catch((err) => {
  logger.error('Failed to start the server', {
    message: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
