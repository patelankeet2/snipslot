import { Router } from 'express';
import { database } from '../config/db';

const router = Router();

// Used by Render's health check and the keep-awake job.
// Also shows which replica set we are on, handy for the replication evidence.
router.get('/', async (_req, res) => {
  const replicaSet = await database.replicaSetInfo().catch(() => null);
  const healthy = database.isConnected;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptime: Math.round(process.uptime()),
    database: healthy ? 'connected' : 'disconnected',
    replicaSet,
  });
});

export default router;
