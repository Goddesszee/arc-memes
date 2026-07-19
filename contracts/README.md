# Arc Memes — Contracts

Hardhat project targeting Arc testnet (chain ID `5042002`).

## Setup

```bash
npm install
cp .env.example .env
# fill in PRIVATE_KEY, ARC_RPC_URL, USDC_ADDRESS, LAUNCH_FEE, FEE_RECIPIENT
```

## Compile

```bash
npx hardhat compile
```

> Note: this was scaffolded in a sandboxed environment that couldn't reach
> `binaries.soliditylang.org` to download the solc compiler, so compilation
> hasn't been verified yet. Run this locally first and fix anything that
> comes up before deploying.

## Deploy to Arc testnet

```bash
npx hardhat run scripts/deploy.js --network arcTestnet
```

This deploys `MemeFactory`, which is the only contract you deploy directly —
it deploys a `MemeToken` + `BondingCurve` pair per launched meme.

After deploying, copy the printed `MemeFactory` address into
`frontend/.env` as `VITE_FACTORY_ADDRESS`.

## Contracts

- **`MemeFactory.sol`** — `launchMeme(name, symbol, imageURI)` charges the
  configured USDC `launchFee` and deploys a token + curve pair. Registry
  readable via `getMemes(start, limit)`.
- **`MemeToken.sol`** — ERC20, 1,000,000,000 supply (18 decimals) minted once
  to its `BondingCurve` at deploy time.
- **`BondingCurve.sol`** — `buy(usdcIn, minTokensOut)` / `sell(tokensIn, minUsdcOut)`.
  Constant-product curve (`k = virtualUsdcReserve * totalSupply`) with a 1%
  fee on both sides, sent to `feeRecipient`. Sells can never drain more USDC
  than has actually been deposited by buyers.

## TODO before mainnet

- Get an external audit — this is unaudited, hackathon-stage code
- Add tests (`test/` is scaffolded but empty)
- Decide on curve "graduation" to a real DEX pool once a token hits a market
  cap milestone (not implemented in v1 — everything trades on the curve)
- Confirm the correct USDC address for Arc testnet vs. mainnet
