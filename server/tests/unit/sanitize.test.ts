import { describe, expect, it } from 'vitest';
import { findUnsafeKey } from '../../src/middleware/sanitize';

describe('findUnsafeKey (NoSQL injection guard)', () => {
  it('lets normal data through', () => {
    expect(findUnsafeKey({ name: 'Skin Fade', price: 45, tags: ['a', 'b'] })).toBeNull();
    expect(findUnsafeKey(null)).toBeNull();
    expect(findUnsafeKey('plain string')).toBeNull();
  });

  it('catches a Mongo operator at the top level', () => {
    expect(findUnsafeKey({ $where: 'sleep(1000)' })).toBe('$where');
  });

  it('catches an operator hidden inside a field', () => {
    expect(findUnsafeKey({ email: { $ne: null } })).toBe('$ne');
  });

  it('catches operators nested deep inside arrays and objects', () => {
    expect(findUnsafeKey({ a: [{ b: { c: { $gt: '' } } }] })).toBe('$gt');
  });

  it('catches dotted keys that could reach into sub documents', () => {
    expect(findUnsafeKey({ 'keys.auth': 'x' })).toBe('keys.auth');
  });

  it('catches operators written in query string form', () => {
    expect(findUnsafeKey({ 'role[$ne]': 'owner' })).toBe('role[$ne]');
  });
});
