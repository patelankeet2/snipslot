import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { startTestDb, stopTestDb } from '../helpers/db';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);

describe('API basics', () => {
  it('reports healthy with the database and replica set details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
    expect(res.body.replicaSet.members).toBe(1);
  });

  it('sends security headers on every response', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('answers unknown routes with a 404 in the usual error shape', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/nothing-here not found' },
    });
  });

  it('rejects a body that is not valid JSON', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .set('Content-Type', 'application/json')
      .send('{ "credential": ');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Request body is not valid JSON');
  });

  it('blocks NoSQL operators in the body and in the query string', async () => {
    const body = await request(app)
      .post('/api/auth/google')
      .send({ credential: { $ne: null } });
    expect(body.status).toBe(400);

    const query = await request(app).get('/api/services?active[$ne]=false');
    expect(query.status).toBe(400);
    expect(query.body.error.message).toBe('Request contains keys that are not allowed');
  });

  it('only allows our own front end through CORS', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const other = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
