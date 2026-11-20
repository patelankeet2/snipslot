import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { database } from '../../src/config/db';

let replSet: MongoMemoryReplSet | null = null;

// A throwaway MongoDB that only lives for one test file.
// A one node replica set, like Atlas, so behaviour matches production.
export async function startTestDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await database.connect(replSet.getUri(), 'snipslot-test', 1);
  // make sure the unique indexes (eg the double booking guard) exist before tests run
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

export async function stopTestDb() {
  await database.disconnect();
  await replSet?.stop();
  replSet = null;
}

// Empty every collection between tests so each test starts clean
export async function clearTestDb() {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}
