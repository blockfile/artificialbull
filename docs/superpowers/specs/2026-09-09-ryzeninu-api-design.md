# ryzeninu-api — Design

**Date:** 2026-09-09
**Status:** built, pre-launch (no CA yet)

## What this is

Backend stats API for **Ryzen Inu** — site **ryzeninu.com**, API at
`api.ryzeninu.com`. A rebranded clone of `ryzenkitty-api`
(`d:\projects\ryzenkitty-api`), which itself came from `peccy-api`. Cloned with
history, so `git cherry-pick <sha>` moves a fix between any of them.

Token: **$RYZENINU** on **Robinhood Chain**, Pons V2 launchpad.

## The requirement, and why this lineage rather than the other one

The ask was "recopy and rebrand, **stats part only, no distribution**", with
distribution handled by "pons factory / pons distribution … we will use
ponsfamily function".

There are two distinct families of fork here and they are not variations of
each other:

| | distributing forks | reporting forks |
| --- | --- | --- |
| examples | `artificialneko`, `ashiba`, `artidoge`, `mars` | `peccy`, `ryzenkitty`, **`ryzeninu`** |
| who pays holders | a bot in the repo | pons's per-token fee distributor |
| processes | `server.js` + `bot.js` | `server.js` |
| wallet key | required | **none** |
| MongoDB | required (the payout ledger) | **none** |
| `/rewards` source | the bot's own ledger | the distributor's on-chain outflows |

Pons's holder fee-sharing is set **at token creation**: switching it on
reassigns `creatorFeeRecipient` to a distributor contract, which leaves a bot
with nothing to claim. So the two designs are mutually exclusive, and "stats
only, pons distributes" is exactly the reporting family — already built and
running twice.

**Decision: clone `ryzenkitty-api`, not `ashiba-api`.** Starting from ashiba
would have meant deleting `bot.js`, `src/jobs/`, the EVM write path, the wallet,
the split config and MongoDB, and then *rebuilding* the distributor-reading
services that ashiba had already replaced — arriving at a worse copy of a repo
that exists. Six ashiba services (`burns`, `burnsfeed`, `feegauge`, `rewards`,
`rewardsfeed`, plus the distribution state) read data only its bot writes; with
the bot gone they have no writer at all.

## Substitutions from ryzenkitty-api

| ryzenkitty-api | ryzeninu-api |
| --- | --- |
| package `ryzenkitty-api`, log prefix `[ryzenkitty]` | `ryzeninu-api`, `[ryzeninu]` |
| `TOKEN_SYMBOL` default `RYZEN`, name `Ryzen Kitty` | `RYZENINU`, `Ryzen Inu` |
| site `ryzenkitty.meme` (CORS, homepage) | `ryzeninu.com`, `www.ryzeninu.com` |
| reward asset AMD, hardcoded in ~25 strings | AMD **as the default**, named by `REWARD_SYMBOL` |
| `/stats.amdRewarded` (fixed key) | `` `${rewardSymbol.toLowerCase()}Rewarded` `` (+ generic `rewarded`, + `rewardSymbol`) |
| no README, no DEPLOY.md | both added |

## Why the reward asset became a setting

Ryzen Kitty is paired with AMD, and its code says so in prose, in log lines, in
the preflight output and in a response field name. Ryzen Inu's pair is **not
confirmed** — the token does not exist yet — and the pair is fixed at creation,
not chosen here.

Copying `AMD` across unchanged would have produced an API that asserts an
unverified fact in a dozen places and, worse, publishes the USD figure under
`amdRewarded` even when pointed at a different stock. So:

- `REWARD_SYMBOL` (default `AMD`) labels every human-facing string;
- the `<asset>Rewarded` alias is derived from it, so an NVDA-paired launch gets
  `nvdaRewarded` and nothing claims to be AMD;
- `rewarded` (generic) and new `rewardSymbol` are always present, so a frontend
  need not hardcode the asset at all;
- the default keeps `amdRewarded` intact, so a site copied from Ryzen Kitty
  works unchanged.

Prose that asserted "paired with AMD" now says "a tokenized stock, AMD by
default — confirm on the token's pons page", in `.env.example`, `DEPLOY.md` and
the service headers. `combinePrices` stayed pure: its error message became
`quote price unavailable from DexScreener` rather than reading config.

## Verification

- `npm test` — **87 pass, 0 fail** (85 inherited + 2 for the alias).
- `npm run check` with `TOKEN_ADDRESS` blank → the documented pre-launch state.
- `npm run check` against a real launched pons token
  (`0x25cd…f354`) → live market cap 495,947, 1,920 holders, quote/USD 503.24,
  a real bonding-curve price, and *no distributor found for this token yet* —
  which is correct for that token, since its own bot distributes. The
  distributor lookup answers honestly instead of inventing a zero.

## Open questions at hand-off

1. **The pair is unconfirmed.** `REWARD_TOKEN_ADDRESS`/`REWARD_SYMBOL` default
   to AMD on the strength of the sibling Ryzen launch. Check the pons page at
   launch. Wrong values do not crash — they price the curve off the wrong stock
   and read an empty feed, which is indistinguishable from "not launched yet".
2. **Holder fee-sharing must actually be switched on at creation.** If it is
   not, there is no distributor, the rewards tile and payout feed stay empty
   permanently, and no setting in this repo can change it. `npm run check`
   reports which case it is.
3. **No CA yet.** `TOKEN_ADDRESS` is blank; every stat answers null by design.
4. **Frontend not yet checked** against this contract — no repo was named.
   `/stats` serves the Ryzen Kitty shape (`ketDistributed`, `totalHolders`)
   plus the cursor-paging shape, so both templates in the lineage should work.

## Repo

`d:\projects\ryzeninu-api`, remote `https://github.com/blockfile/ryzeninu.git`,
branch `main`.
