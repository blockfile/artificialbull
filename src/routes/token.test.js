'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { buildToken } = require('./token');

test('ticker carries the "$" the site displays; symbol does not', () => {
  const out = buildToken({ name: 'Ryzen Kitty', symbol: 'RYZEN', tokenAddress: '0xabc' });
  assert.strictEqual(out.ticker, '$RYZEN');
  assert.strictEqual(out.symbol, 'RYZEN');
  assert.strictEqual(out.name, 'Ryzen Kitty');
  assert.strictEqual(out.contractAddress, '0xabc');
  assert.strictEqual(out.chain, 'Robinhood Chain');
});

test('pre-launch the contract address is null, not an empty string', () => {
  assert.strictEqual(buildToken({ name: 'Ryzen Kitty', symbol: 'RYZEN', tokenAddress: null }).contractAddress, null);
});
