import { test, describe } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { getProductQuery } from './queryHelpers.js';

describe('getProductQuery', () => {
  test('should return { _id: null } when idParam is empty', () => {
    const result = getProductQuery('');
    assert.deepStrictEqual(result, { _id: null });
  });

  test('should return { _id: null } when idParam is undefined or null', () => {
    // Note: The function expects a string but we can test runtime safety if we cast
    // For now we test with falsey string values as TS limits input type
    const result1 = getProductQuery(null as unknown as string);
    assert.deepStrictEqual(result1, { _id: null });

    const result2 = getProductQuery(undefined as unknown as string);
    assert.deepStrictEqual(result2, { _id: null });
  });

  test('should return $or query for valid MongoDB ObjectId', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const result = getProductQuery(validId);

    // Check if result has $or
    assert.ok(result.$or);
    assert.strictEqual(result.$or.length, 2);

    // Verify first $or condition (matching _id)
    assert.ok(result.$or[0]._id instanceof mongoose.Types.ObjectId);
    assert.strictEqual(result.$or[0]._id.toString(), validId);

    // Verify second $or condition (matching slug)
    assert.strictEqual(result.$or[1].slug, validId);
  });

  test('should return { slug: idParam } for non-ObjectId string', () => {
    const slug = 'test-product-slug';
    const result = getProductQuery(slug);
    assert.deepStrictEqual(result, { slug });
  });
});
