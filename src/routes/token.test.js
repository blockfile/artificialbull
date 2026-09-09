'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { buildToken } = require('./token');

test('ticker carries the "$" the site displays; symbol does not', () => {
  const out = buildToken({ name: 'Ryzen Inu', symbol: 'RYZENINU', tokenAddress: '0xabc' });
  assert.strictEqual(out.ticker, '$RYZENINU');
  assert.strictEqual(out.symbol, 'RYZENINU');
  assert.strictEqual(out.name, 'Ryzen Inu');
  assert.strictEqual(out.contractAddress, '0xabc');
  assert.strictEqual(out.chain, 'Robinhood Chain');
});

test('pre-launch the contract address is null, not an empty string', () => {
  assert.strictEqual(buildToken({ name: 'Ryzen Inu', symbol: 'RYZENINU', tokenAddress: null }).contractAddress, null);
});
