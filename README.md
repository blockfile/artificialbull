# artificialbull-api

Read-only stats API for **Artificial Bull** (`$ABULL`, Robinhood Chain, Pons V2).
Serves the site at **artificialbull.example** from **api.artificialbull.example**.

## What it does — and what it deliberately does not

This project **reports**. It does not distribute.

Artificial Bull launches with Pons's holder fee-sharing switched on, so the creator
tax routes straight to Pons's own per-token **fee distributor** contract, which
pushes payouts to holder wallets on its own schedule. Nobody claims, swaps or
sends anything by hand. This API's entire job is to show what that distributor
has already paid.

Consequently there is:

- **no wallet key** — nothing here signs a transaction;
- **no bot process** — one `server.js`, that is all;
- **no database** — every number is fetched live from a public upstream and
  cached in memory;
- **no on-chain deployment** — no disperser, no swap router.

The sibling forks in this family (`artificialneko`, `ashiba`, `artidoge`,
`mars`) do the opposite: they keep the creator fees and a bot claims, swaps,
burns and airdrops them. The two designs are mutually exclusive — a token whose
fees route to a distributor leaves a bot with nothing to claim. If distribution
is ever moved in-house for this token, that is a port from `ashiba-api`, not a
setting here.

## Endpoints

| Route | Serves |
| --- | --- |
| `GET /token` | name, ticker, contract address, chain |
| `GET /stats` | market cap, holder count, total rewarded (token + USD), price |
| `GET /rewards?cursor&limit` | individual payouts from the distributor, newest first |
| `GET /health` | liveness |

Each is mounted at both `/` and `/api`, so the site works whether
`VITE_API_BASE_URL` ends in the host or in `/api`.

A field that cannot be sourced is **null, never 0** — the site renders a null as
"—" but would render a 0 as a real number. Before launch (`TOKEN_ADDRESS`
blank), every stat is null and the feed is empty. That is the correct state.

## Where the numbers come from

| Number | Upstream |
| --- | --- |
| Market cap (after graduation) | DexScreener pair |
| Market cap (on the curve) | Pons chart price × quote/USD × total supply |
| Holder count | Blockscout token page |
| Total rewarded | Pons `/api/pons-v2-market/{token}/distributor` |
| Payout feed | Blockscout: reward-token transfers **out of** the distributor |
| Quote/USD | DexScreener |

Reads are cached with stale-while-revalidate (`src/services/cache.js`): a failing
upstream keeps serving its last good value instead of blanking a tile, and
`/stats` degrades per-field — one dead upstream cannot take the others down.

## Paired with NVDA

Pons V2 tokens are paired with a tokenized stock, and that same asset is what
holders are paid in. Artificial Bull is paired with **NVDA** — "NVIDIA •
Robinhood Token", `0xd0601ce1…9eec`, 18 decimals — verified on chain: Blockscout
names it, it has ~146k holders, and it has multi-million-dollar USDG and WETH
pools on DexScreener. There are impostor "NVDA" tokens on Robinhood Chain; if
this address ever needs changing, copy it from the token's Pons page, never
from a ticker search.

The asset is still a setting (`REWARD_TOKEN_ADDRESS`, `REWARD_DECIMALS`,
`REWARD_SYMBOL`), because the forks in this lineage pair with different
stocks. `REWARD_SYMBOL` also names the `<asset>Rewarded` field in `/stats` —
`nvdaRewarded` here — alongside the always-present generic `rewarded` and
`rewardSymbol`, so the API never publishes a figure under the name of an asset
it is not reading.

## Running it

```bash
npm install
cp .env.example .env     # then set TOKEN_ADDRESS and CORS_ORIGINS
npm run check            # calls every upstream once, prints what /stats would answer
npm run dev              # or: npm start
npm test
```

`npm run check` is the preflight to run on the server after editing `.env`. It
is the fastest way to tell a config mistake (wrong CA, wrong chain slug, wrong
quote asset) apart from a token that is simply not listed yet — the two look
identical in the JSON.

Deployment: see [DEPLOY.md](DEPLOY.md).

## Lineage

Cloned from `ryzeninu-api` (AMD-paired), which came from `ryzenkitty-api` and
`peccy-api`. Shared history, so `git cherry-pick <sha>` moves a fix between any
of them. The only difference from `ryzeninu-api` is the brand and the default
reward asset.
