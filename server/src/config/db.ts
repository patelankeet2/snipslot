import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Singleton: the whole app shares one connection (and its pool)
// instead of every module opening its own.
class Database {
  private static instance: Database | undefined;
  private connecting: Promise<typeof mongoose> | null = null;

  private constructor() {
    // filters with fields that are not in the schema are dropped instead of passed to Mongo
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
    mongoose.connection.on('error', (err) =>
      logger.error('MongoDB error', { message: err.message }),
    );
  }

  static getInstance(): Database {
    if (!Database.instance) Database.instance = new Database();
    return Database.instance;
  }

  get isConnected() {
    return mongoose.connection.readyState === 1;
  }

  async connect(uri = env.MONGODB_URI, dbName = env.MONGODB_DB, retries = 5) {
    if (this.isConnected) return mongoose;
    // if two callers ask at once, they both wait on the same attempt
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await mongoose.connect(uri, {
            dbName,
            maxPoolSize: 10, // enough for a small shop, keeps us under the free tier limit
            serverSelectionTimeoutMS: 10_000,
            retryWrites: true,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`MongoDB connection attempt ${attempt}/${retries} failed`, { message });
          if (attempt === retries) throw err;
          await wait(attempt * 2000); // back off a bit more each time
        }
      }
      throw new Error('Unreachable');
    })();

    try {
      return await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }

  // Used by the health check to show the replica set we are running on
  async replicaSetInfo() {
    if (!this.isConnected || !mongoose.connection.db) return null;
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    return {
      setName: hello.setName as string | undefined,
      members: Array.isArray(hello.hosts) ? hello.hosts.length : 1,
      isPrimary: Boolean(hello.isWritablePrimary),
    };
  }
}

export const database = Database.getInstance();
