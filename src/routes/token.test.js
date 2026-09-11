'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { buildToken } = require('./token');

test('ticker carries the "$" the site displays; symbol does not', () => {
  const out = buildToken({ name: 'Artificial Bull', symbol: 'ABULL', tokenAddress: '0xabc' });
  assert.strictEqual(out.ticker, '$ABULL');
  assert.strictEqual(out.symbol, 'ABULL');
  assert.strictEqual(out.name, 'Artificial Bull');
  assert.strictEqual(out.contractAddress, '0xabc');
  assert.strictEqual(out.chain, 'Robinhood Chain');
});

test('pre-launch the contract address is null, not an empty string', () => {
  assert.strictEqual(buildToken({ name: 'Artificial Bull', symbol: 'ABULL', tokenAddress: null }).contractAddress, null);
});
