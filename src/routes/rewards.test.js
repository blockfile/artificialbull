'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { parseQuery, DEFAULT_LIMIT, MAX_LIMIT } = require('./rewards');

test('defaults to the site\'s page size from the top of the feed', () => {
  assert.deepStrictEqual(parseQuery({}), { cursor: null, limit: DEFAULT_LIMIT });
  assert.strictEqual(DEFAULT_LIMIT, 12); // PAGE_SIZE in the frontend's config/rewards.js
});

test('clamps limit into 1..MAX and ignores junk', () => {
  assert.strictEqual(parseQuery({ limit: '0' }).limit, 1);
  assert.strictEqual(parseQuery({ limit: '-5' }).limit, 1);
  assert.strictEqual(parseQuery({ limit: '999' }).limit, MAX_LIMIT);
  assert.strictEqual(parseQuery({ limit: '7.9' }).limit, 7);
  assert.strictEqual(parseQuery({ limit: 'abc' }).limit, DEFAULT_LIMIT);
  assert.strictEqual(parseQuery({ limit: ['5', '6'] }).limit, DEFAULT_LIMIT);
});

test('passes a well-formed cursor through untouched', () => {
  assert.strictEqual(parseQuery({ cursor: '47607407-27' }).cursor, '47607407-27');
  assert.strictEqual(parseQuery({ cursor: '' }).cursor, null);
});

test('rejects a malformed cursor with a 400', () => {
  assert.throws(() => parseQuery({ cursor: 'nope' }), (err) => err.status === 400);
  assert.throws(() => parseQuery({ cursor: ['1-2'] }), (err) => err.status === 400);
});
