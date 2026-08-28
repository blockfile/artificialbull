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

## Frontend

The frontend (a copy of `d:\projects\peccy`, not yet created) needs
`VITE_API_BASE_URL=https://api.ryzenkitty.meme`, `VITE_USE_MOCK=false`, and —
if the stats normalizer is renamed — `amdRewarded` / `amdRewardedTokens`; with
no rename it still works through the `rewarded` / `totalRewarded` fallbacks.

## Flagged assumptions

1. **Reward asset is AMD** (tokenized Advanced Micro Devices), inferred from
   the name "RyzenKitty". It is only a default (`REWARD_TOKEN_ADDRESS`); if the
   launch pairs with a different asset, change that env value and the
   `amdRewarded` field name in `routes/stats.js`.
2. Ticker is `RYZENKITTY` (`TOKEN_SYMBOL`, env-configurable).

## Delivery

New repo at `d:\projects\ryzenkitty-api`, initial commit, remote
`https://github.com/blockfile/ryzenkitty.git`, push `main`.
