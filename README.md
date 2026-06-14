# SkyOracle - AI-Powered Onchain Weather Prediction Markets

A global weather prediction market platform powered by **GenLayer Intelligent Contracts**.
Weather data sourced from [Open-Meteo](https://open-meteo.com/) (free, no API key required).

---

## Market Types

| Type | Description | Rule |
|------|-------------|------|
| **Rain YES/NO** | Will it rain in a city on a specific date? | `> 1mm` precipitation = YES |
| **Temperature** | Will the temperature exceed X degrees? | Custom threshold (°C) |
| **City Duel** | Which city will be hotter? | Higher max temp wins |

---

## What Makes SkyOracle Unique

Unlike traditional prediction markets that rely on centralized oracles, SkyOracle uses **GenLayer Intelligent Contracts** to:

1. Fetch real-time weather data directly from the Open-Meteo API on-chain
2. Use AI consensus (`eq_principle.prompt_comparative`) to deterministically resolve markets
3. Expose transparent reasoning on every resolved market card

---

## Project Structure

```
skyoracle/
  contracts/
    sky_oracle.py               # GenLayer Intelligent Contract
  frontend/
    app/
      page.tsx                  # Main page (orchestrator)
      globals.css               # Mobile-responsive styles
    components/
      RainBg.tsx                # Animated rain background
      WalletBar.tsx             # Connect / disconnect dropdown
      MarketCard.tsx            # Market card with reasoning display
      BetModal.tsx              # Place bet modal
      CreateMarketModal.tsx     # Create new market
      CitySearch.tsx            # Open-Meteo geocoding picker
      ClaimPanel.tsx            # Claim winnings UI
      BettorListModal.tsx       # All bettors per market
      Leaderboard.tsx           # Top winners
    hooks/
      useWallet.ts              # MetaMask connect + disconnect
      useMarkets.ts             # Markets / bets / leaderboard / owner
    lib/
      genlayer.ts               # Client + parseEther helper
```

---

## Setup

### 1. Redeploy contract (REQUIRED)

The contract has new storage fields and methods — existing deploys must be replaced.

```bash
genlayer network set studionet
genvm-lint check contracts/sky_oracle.py
genlayer deploy --contract contracts/sky_oracle.py
```

Copy the new contract address.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local — paste the new contract address
npm run dev
```

### 3. Get test GEN tokens

Use the Studionet faucet — click the droplet icon in the GenLayer Studio UI, or visit:
```
https://testnet-faucet.genlayer.foundation/
```

---

## Contract Methods

### Write (costs GEN gas)

| Method | Description |
|--------|-------------|
| `create_market(...)` | Create a new prediction market |
| `place_bet(market_id, side)` | Stake GEN on YES/NO/CITY1/CITY2 (payable) |
| `resolve_market(market_id)` | Trigger AI + weather resolution (~2–3 min consensus) |
| `claim_winnings(bet_index)` | Claim payout and update leaderboard |
| `cancel_market(market_id)` | Creator/owner only; only if no bets have been placed |
| `withdraw_fees()` | Owner only; collect accumulated platform fees |

### Read (free)

| Method | Description |
|--------|-------------|
| `get_all_markets()` | List all markets including the reasoning field |
| `get_market(id)` | Single market by ID |
| `get_my_bets(addr)` | Bets placed by a given address |
| `get_bets_for_market(market_id)` | All bets for a specific market |
| `get_leaderboard()` | All leaderboard entries sorted by winnings |
| `get_owner()` | Contract owner address |
| `get_market_count()` | Total number of markets |
| `get_min_bet()` | Minimum bet amount (default: 1 GEN) |

---

## Resolution Logic

| Market Type | Data Source | Rule |
|-------------|-------------|------|
| Rain | Open-Meteo `precipitation_sum` | `> 1mm` = YES |
| Temperature | Open-Meteo `temperature_2m_max` | `> threshold` = YES |
| City Duel | Open-Meteo `temperature_2m_max` (both cities) | Higher temp wins |

All resolutions go through `gl.eq_principle.prompt_comparative` for AI consensus across multiple validators.

---

## What's New

- **Reasoning display** — every resolved market shows the AI reasoning directly on the card (e.g. *"Precipitation on 2026-05-10 is 2.60mm, greater than 1mm"*)
- **Resolve date gate** — the Resolve button only appears when `resolve_date <= today`, preventing premature resolution
- **Rain threshold fix** — threshold changed from `> 0` to `> 1` mm to avoid false YES on trace precipitation
- **Bet amount fix** — bet amount now uses `parseEther` from `viem` so `0.1 GEN` is exactly `1e17` wei
- **Auto-resolve** — when a user opens the app and a market's `resolve_date` has passed, the frontend automatically calls `resolve_market()` (once per page load)
- **Disconnect wallet** — dropdown menu with localStorage persistence
- **Bettors per market** — the `Bettors` button shows all bettors in YES/NO columns with amounts and claim status
- **Leaderboard** — `Leaderboard` tracks total wagered, wins, losses, and net profit per address
- **Mobile responsive** — modals, header, and bettor grid all adapt to narrow screens

---

## Notes

- Auto-resolve only triggers for markets with at least one bet — empty markets don't waste gas
- Leaderboard "Net Won" is profit only (payout minus stake)
- `Bet.timestamp` is `0` if `gl.message.timestamp` is unavailable — the UI hides it gracefully
- DRAW winner = full refund, no platform fee deducted
- Minimum bet: **1 GEN** (hardcoded in contract)
- Platform fee: **0.5%** of winner payout

---

## License

MIT
