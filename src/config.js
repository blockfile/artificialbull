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

  // RYZENINU's contract address. Blank until the token is launched — every stat
  // then resolves to null, which the site renders as "—" rather than a zero.
  tokenAddress: lowerOrNull(process.env.TOKEN_ADDRESS),
  // The site's ticker is $RYZENINU (SITE.ticker in its config/site.js).
  tokenSymbol: process.env.TOKEN_SYMBOL || 'RYZENINU',
  tokenName: process.env.TOKEN_NAME || 'Ryzen Inu',
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
  // This launch does NOT distribute anything itself. RYZENINU's creator tax
  // accrues in the curve's quote asset and routes — with no creator claim — to
  // pons's own per-token fee distributor, which pushes payouts straight to
  // holder wallets. Everything here just READS what pons already paid: the
  // cumulative total from pons's public API (services/rewards.js) and the
  // individual payouts from the distributor's on-chain outflows
  // (services/rewardsfeed.js). There is no wallet key in this project.
  ponsApi: (process.env.PONS_API || 'https://www.ponsfamily.com').replace(/\/$/, ''),
  // The curve's quote asset, which is also the reward asset. Defaults to AMD
  // (tokenized AMD stock, "AMD • Robinhood Token", 18 decimals) because that is
  // what the sibling Ryzen launch pairs with — CONFIRM IT against the token's
  // pons page before go-live and override here if the pair is a different
  // stock. Its DexScreener USD price converts the bonding-curve price to USD.
  rewardTokenAddress: lowerOrNull(process.env.REWARD_TOKEN_ADDRESS) || '0x86923f96303d656e4aa86d9d42d1e57ad2023fdc',
  // Decimals of the reward asset.
  rewardDecimals: num(process.env.REWARD_DECIMALS, 18),
  // Ticker of the reward asset, without the "$". Labels log lines, the preflight
  // and the `<asset>Rewarded` alias in /stats — so changing REWARD_TOKEN_ADDRESS
  // to a different stock does not leave the API calling it AMD.
  rewardSymbol: (process.env.REWARD_SYMBOL || 'AMD').trim().toUpperCase(),
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
