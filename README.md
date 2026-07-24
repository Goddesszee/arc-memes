# Memes on Arc

A meme token launchpad on Arc. Anyone can launch a meme as its own ERC20 token
for a small USDC fee — no liquidity to seed, no listing process. Each token
gets its own bonding curve that prices it automatically: buy pressure moves
the price up, sell pressure moves it down, pump.fun style.

Standalone project — no shared code, contracts, or infrastructure with any
other project.

## How it works

1. **Launch** — pick a name, symbol, and image. Pay a small USDC fee.
   `MemeFactory` deploys a fresh `MemeToken` + `BondingCurve` pair for it.
2. **Trade** — swap USDC (EURC support planned) for the meme token, or sell
   it back, directly against the bonding curve. No order book, no LP needed.
3. **Price discovery** — the curve uses a constant-product formula with a
   virtual USDC reserve to seed the starting price, then real USDC accumulates
   as people buy.

## Structure

- `contracts/` — Solidity contracts (Hardhat), deployed to Arc testnet
  (chain ID `5042002`)
- `frontend/` — React + Vite app: explore live memes, launch a new one, trade

## Contracts

- `MemeFactory.sol` — launches new meme token + curve pairs for a USDC fee,
  keeps a registry of every meme launched
- `MemeToken.sol` — plain ERC20, full supply minted once to its curve
- `BondingCurve.sol` — constant-product AMM (`x * y = k`) per token, with a
  1% trading fee, holding real USDC reserves against a virtual floor

See `contracts/README.md` and `frontend/README.md` for setup instructions.

## Status

Early build — contracts are unaudited and not yet deployed. Compile and test
locally before deploying anything to testnet or mainnet.
