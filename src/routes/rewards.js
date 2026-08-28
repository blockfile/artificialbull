'use strict';

// GET /rewards?cursor=<block>-<logIndex>&limit=<1..50> — the Rewards Feed modal.
//
// The site pages this with its PAGE_SIZE (12) and follows `nextCursor` until
// it is null:
//
//   { "rows": [{ "id", "amount", "wallet", "txHash", "at" }], "nextCursor": "47607407-27" | null }
//
// `amount` is an AMD token amount (the site formats it itself), `at` is epoch
// ms, `txHash` is linked to the Robinhood Chain explorer. See
// services/rewardsfeed.js for where the rows come from.

const express = require('express');
const { getFeedPage, parseCursor } = require('../services/rewardsfeed');

const router = express.Router();

const DEFAULT_LIMIT = 12; // PAGE_SIZE in the site's config/rewards.js
const MAX_LIMIT = 50; // one Blockscout page

/**
 * Pure: query string -> { cursor, limit }. Limit is clamped into 1..MAX and
 * junk falls back to the default; a malformed cursor throws with status 400.
 */
function parseQuery(query = {}) {
  const raw = typeof query.limit === 'string' ? Number(query.limit) : NaN;
  const limit = Number.isFinite(raw) ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(raw))) : DEFAULT_LIMIT;

  let cursor = query.cursor;
  if (cursor === undefined || cursor === '') cursor = null;
  parseCursor(cursor); // validates (arrays and garbage included) — throws 400
  return { cursor, limit };
}

router.get('/rewards', async (req, res) => {
  let q;
  try {
    q = parseQuery(req.query);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  try {
    res.json(await getFeedPage(q.cursor, q.limit));
  } catch (err) {
    // Nothing cached for this page and the upstream is down. A 502 makes the
    // modal show its retry button; an empty 200 would read as "end of feed".
    console.warn('[ryzenkitty] rewards feed unavailable:', err.message);
    res.status(502).json({ error: 'rewards feed unavailable' });
  }
});

module.exports = { router, parseQuery, DEFAULT_LIMIT, MAX_LIMIT };
