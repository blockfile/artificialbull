# ryzenkitty-api — Design

Date: 2026-08-29
Status: approved (reward asset flagged below)

## Purpose

Backend stats API for the **RyzenKitty** site — **ryzenkitty.meme**, API at
`api.ryzenkitty.meme`. It is a rebranded copy of `peccy-api`
(`d:\projects\peccy-api`, spec `2026-08-28-peccy-api-design.md` there), with
identical functions:

- `GET /stats` — market cap, holders, total rewarded (token + USD), price.
- `GET /rewards?cursor&limit` — the cursor-paginated rewards feed (payouts out
  of the Pons fee distributor, read from Blockscout).
- `GET /health`, `GET /` — as before. Router mounted at `/` and `/api`.

Token: **$RYZENKITTY** on **Robinhood Chain**, launching on the Pons V2
launchpad. Contract address is not yet known — every stat resolves to `null`
(never `0`) and the feed to an empty page until `TOKEN_ADDRESS` is set.

## Substitutions from peccy-api

| peccy-api                                    | ryzenkitty-api                                |
| -------------------------------------------- | --------------------------------------------- |
| package `peccy-api`, log prefix `[peccy]`    | `ryzenkitty-api`, `[ryzenkitty]`              |
| `TOKEN_SYMBOL` default `PECCY`               | `RYZENKITTY`                                  |
| site `peccy.fun` (CORS)                      | `ryzenkitty.meme`, `www.ryzenkitty.meme`      |
| reward asset AMZN `0x12f190…bF54`            | **AMD** `0x86923f96303D656E4aa86D9d42D1e57ad2023fdC` ("AMD • Robinhood Token", 18 decimals) |
| `/stats.amznRewarded`                        | `/stats.amdRewarded` (+ generic `rewarded`)   |

Everything else — services, cache, cursor scheme, error rules, tests — is
unchanged apart from the wording.

## `GET /stats` response

```json
{
  "marketCap": 4189702,
  "holders": 12879,
  "totalRewarded": 826.7,
  "totalRewardedUsd": 140439.0,
  "amdRewarded": 140439.0,
  "rewarded": 140439.0,
  "priceUsd": 0.0000042,
  "price": 0.0000042,
  "liquidityUsd": 120000,
  "symbol": "RYZENKITTY",
  "tokenAddress": "0x…",
  "updatedAt": "2026-08-29T12:00:00.000Z"
}
```

- `totalRewarded` — AMD token amount paid to holders; the tile's small line.
- `amdRewarded` — the USD figure the site's rewards tile shows big.
- `rewarded` — the same USD figure under the generic name the frontend
  normalizer accepts as a fallback (`raw.<x>Rewarded ?? raw.<x>_rewarded ?? raw.rewarded`),
  so a frontend copied from peccy works whether or not its field was renamed.

## Frontend: `d:\projects\ryzen\Meme1` (the "icat-guild" template)

Checked 2026-08-29. Different template from peccy's. In live mode
(`VITE_USE_MOCK=false`) it calls exactly three endpoints via `src/api/client.js`,
`${VITE_API_BASE_URL}${path}`; `/how-it-works`, `/eligibility`, `/socials` are
listed in `ENDPOINTS` but never fetched.

| Call (component)                          | Reads                                              | API field                          |
| ----------------------------------------- | -------------------------------------------------- | ---------------------------------- |
| `GET /token` (App.jsx, once)              | `ticker` (falls back to `SITE.ticker` = `$RYZEN`)  | `/token` → `{ name, ticker: "$RYZEN", symbol, contractAddress, chain }` |
| `GET /stats` (VideoTV.jsx BOOT window)    | `marketCap` (`compact(…,'$')`), `ketDistributed` (`compact(…)`, no `$` → **AMD token amount**), optional `distributedSymbol` | `marketCap`, `ketDistributed` = `totalRewarded`; `distributedSymbol` omitted so `SITE.rewardTicker` applies |
| `GET /rewards` (RewardsScene.jsx, polled every 15 s, no query) | `transactions[]` `{ id, wallet, amount, txHash, timestamp }` — whole list in a scrollable ledger with wallet search; `symbol`/`txUrl` optional | `transactions` (ISO `timestamp`), default page = 50 rows; `rows`/`nextCursor` kept for the paging frontends |

Frontend `.env.local`: `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=https://api.ryzenkitty.meme`.
No frontend code changes needed. Hand-edited `src/config/site.js` still holds a
Solana-style placeholder in `contractAddress` — replace with the real Robinhood
Chain CA on launch.

Because the ticker on the site is **$RYZEN**, `TOKEN_SYMBOL` defaults to
`RYZEN` (and `TOKEN_NAME` to `Ryzen Kitty`).

## Launch-day findings (2026-08-29)

Token launched at `0x50d0d0da00ffd195d2d1d2448617ad039855ad2b` — on-chain name
"Ryzen Kitty", symbol **RYZEN**, 18 decimals, total supply 1,000,000,000.

- **Cloudflare vs Blockscout.** Blockscout's Cloudflare front now 403-challenges
  any request whose User-Agent is missing *or* a bare `<name>/<version>`; the
  standard self-identifying crawler form `Mozilla/5.0 (compatible; <name>/<version>;
  +<homepage>)` passes consistently. `fetchJson` sends that by default
  (`package.json` `homepage`, `USER_AGENT` env overrides).
- **Supply fallback.** Because Blockscout is the only source of supply +
  decimals, an outage there also nulls the pre-graduation market cap. New env
  `TOKEN_TOTAL_SUPPLY` (whole tokens; `TOKEN_DECIMALS`, default 18) feeds
  `buildStats` a fallback; explorer values win whenever present.
- **No distributor yet.** Pons answers `state: "none"` for the token, so
  `ketDistributed`/rewards are null and the feed is empty until Pons creates
  the fee distributor — a real state, not a fault.
- Deployed `.env` must carry `TOKEN_SYMBOL=RYZEN` (the site prefers the API's
  ticker over its own fallback, so `RYZENKITTY` there would show on the page).

## Flagged assumptions

1. **Reward asset is AMD** — now corroborated by the site (`rewardTicker: '$AMD'`,
   `rewardContractAddress` = the same AMD token). Still an env default.
2. `ketDistributed` is served as the **AMD token amount** because the site
   renders it without a `$`; if USD is wanted, swap to `totalRewardedUsd` in
   `buildStats` (and the site would need to add its `$` prefix).

## Delivery

New repo at `d:\projects\ryzenkitty-api`, initial commit, remote
`https://github.com/blockfile/ryzenkitty.git`, push `main`.
