'use strict';
require('dotenv').config();

function num(v, d) {
  if (v === undefined || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
const lowerOrNull = (v) => (v ? String(v).trim().toLowerCase() : null);

// Blockscout instance for Robinhood Chain — the holder count comes from here.
const explorerApi = (process.env.EXPLORER_API || 'https://robinhoodchain.blockscout.com').replace(/\/$/, '');

const config = {
  port: num(process.env.PORT, 3000),

  // BULL's contract address. Blank until the token is launched — every stat
  // then resolves to null, which the site renders as "—" rather than a zero.
  tokenAddress: lowerOrNull(process.env.TOKEN_ADDRESS),
  // The site's ticker is $BULL (SITE.ticker in its config/site.js).
  tokenSymbol: process.env.TOKEN_SYMBOL || 'BULL',
  tokenName: process.env.TOKEN_NAME || 'Artificial Bull',
  // Whole-token total supply, used ONLY to compute the pre-graduation market
  // cap when Blockscout (the normal source of supply + decimals) is
  // unreachable. Blank = no fallback. Pons V2 launches mint 1,000,000,000.
  tokenTotalSupply: num(process.env.TOKEN_TOTAL_SUPPLY, null),
  tokenDecimals: num(process.env.TOKEN_DECIMALS, 18),

  explorerApi,
  // DexScreener's slug for the chain — the market cap comes from here.
  dexscreenerChainId: process.env.DEXSCREENER_CHAIN_ID || 'robinhood',

  // How long a fetched value is served before refreshing. The site polls /stats
  // every 30s per browser tab, so without this the upstreams would see one
  // request per visitor per 30s.
  marketTtlMs: num(process.env.MARKET_TTL_MS, 30_000),
  holdersTtlMs: num(process.env.HOLDERS_TTL_MS, 120_000),

  // ── Pons rewards ("Total <reward> Rewarded") ──────────────────────────────
  // This launch does NOT distribute anything itself. BULL's creator tax
  // accrues in the curve's quote asset and routes — with no creator claim — to
  // pons's own per-token fee distributor, which pushes payouts straight to
  // holder wallets. Everything here just READS what pons already paid: the
  // cumulative total from pons's public API (services/rewards.js) and the
  // individual payouts from the distributor's on-chain outflows
  // (services/rewardsfeed.js). There is no wallet key in this project.
  ponsApi: (process.env.PONS_API || 'https://www.ponsfamily.com').replace(/\/$/, ''),
  // The curve's quote asset, which is also the reward asset: NVDA (tokenized
  // NVIDIA stock, "NVIDIA • Robinhood Token", 18 decimals). Verified on chain
  // 2026-09-11 — Blockscout names it, ~146k holders, deep USDG/WETH pools on
  // DexScreener. There are impostor "NVDA" tokens on this chain, so never
  // replace this by searching the ticker. Its DexScreener USD price converts
  // the bonding-curve price to USD.
  rewardTokenAddress: lowerOrNull(process.env.REWARD_TOKEN_ADDRESS) || '0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec',
  // Decimals of the reward asset.
  rewardDecimals: num(process.env.REWARD_DECIMALS, 18),
  // Ticker of the reward asset, without the "$". Labels log lines, the preflight
  // and the `<asset>Rewarded` alias in /stats — so changing REWARD_TOKEN_ADDRESS
  // to a different stock does not leave the API calling it NVDA.
  rewardSymbol: (process.env.REWARD_SYMBOL || 'NVDA').trim().toUpperCase(),
  rewardsTtlMs: num(process.env.REWARDS_TTL_MS, 60_000),

  // ── Rewards feed (GET /rewards) ────────────────────────────────────────────
  // Every payout is a reward-asset transfer OUT of the fee distributor, listed
  // by Blockscout (see src/services/rewardsfeed.js). The distributor address is
  // normally resolved from the Pons API; this pins it instead.
  distributorAddress: lowerOrNull(process.env.DISTRIBUTOR_ADDRESS),
  feedTtlMs: num(process.env.FEED_TTL_MS, 30_000),

  // Comma-separated allowlist of browser origins. Non-browser requests (no
  // Origin header) always pass; "*" allows any origin.
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

module.exports = config;
