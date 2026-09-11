# artificialbull-api — Design

**Date:** 2026-09-11
**Status:** built, pre-launch (no CA, no domain yet)

## What this is

Read-only stats API for **Artificial Bull** (`$BULL`, Robinhood Chain, Pons V2).
The ask: "recopy and rebrand the ryzeninu-api, same function, but paired with
NVIDIA, not AMD". So: a clone of `ryzeninu-api` with history (reporting family —
pons's own fee distributor pays holders, this project only reads it), rebranded,
with the reward asset switched to NVDA.

No wallet key, no bot, no database, one process. See the ryzeninu spec for why
the reporting family and not the distributing one.

## Substitutions from ryzeninu-api

| ryzeninu-api | artificialbull-api |
| --- | --- |
| `ryzeninu-api`, log prefix `[ryzeninu]` | `artificialbull-api`, `[artificialbull]` |
| `RYZENINU` / `Ryzen Inu` | `BULL` / `Artificial Bull` |
| `ryzeninu.com` | `artificialbull.example` — **placeholder**, no domain yet |
| reward default AMD `0x86923f…3fdc`, flagged "unconfirmed" | **NVDA** `0xd0601ce1…9eec`, verified |
| `REWARD_SYMBOL=AMD` → `/stats.amdRewarded` | `REWARD_SYMBOL=NVDA` → `/stats.nvdaRewarded` |

The ticker is **$BULL** — not the `$A…` pattern of `$ASHIBA`/`$ADOGE`. It is one env var,
`TOKEN_SYMBOL`, and the site shows whatever `/token` serves, so it must match.

`.example` is used for the domain, as in artidoge: it is reserved and can never
resolve, so a DEPLOY step run before the substitution fails loudly instead of
half-working against someone else's host.

## NVDA verification (2026-09-11)

The distributing forks' config records at least five impostor "NVDA" tokens on
this chain, so the address was checked rather than copied on trust:

- Blockscout: `NVIDIA • Robinhood Token`, symbol `NVDA`, 18 decimals, ~146k holders.
- DexScreener: 30 Robinhood pairs, deepest NVDA/USDG ~$7.7M liquidity, ~$220.
- End to end: `npm run check` against a real NVDA-paired pons token priced the
  bonding curve through NVDA/USD at **$0.00007655** against DexScreener's live
  **$0.00007639** — agreement to 0.2%. The same check under ryzeninu's AMD
  default had been off by ~2.2×, the AMD/NVDA price ratio, which is exactly the
  silent failure a wrong pair produces.

## One test change worth keeping upstream

`quoteprice.test.js` asserted the error message with a literal `/AMD/`. The
message is built from `config.rewardSymbol`, so switching the asset broke three
tests that were not about the asset at all. They now match
`` new RegExp(`${config.rewardSymbol} price unavailable`) ``. This belongs in
ryzeninu too, but it is harmless there (its default is AMD) and was left alone.

## Verification

- `npm test` — 87 pass, 0 fail.
- `npm run check` blank → documented pre-launch state; against a live NVDA-paired
  token → real market cap, holders, NVDA/USD and a curve price that matches.

## Open at hand-off

1. **No CA** — `TOKEN_ADDRESS` blank; every stat answers null by design.
2. **No domain** — replace `artificialbull.example` in `.env` and `DEPLOY.md`.
3. **Holder fee-sharing must be switched on at creation**, or there is no
   distributor and the rewards tile stays empty permanently. `npm run check`
   says which.
4. **Frontend unknown.** The "Artificial" name suggests the tokenmeme15 template
   used by Neko/Shiba/Doge. That template's `/rewards` normaliser wants a `data`
   array and a `meter` object — this API serves `transactions`/`rows`, the
   reporting-family shape. If that is the frontend, it will need either an
   adapter here or the Ryzen-style site.

## Repo

`d:\projects\artificialbull-api`, remote `https://github.com/blockfile/artificialbull.git`, branch `main`.
