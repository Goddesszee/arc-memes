# Memes on Arc: Contracts

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

> Update: contracts have now been compiled and verified error-free (via a
> standalone `solc` compile, since the sandbox that built this repo couldn't
> reach `binaries.soliditylang.org` for Hardhat's normal compiler download).
> `npx hardhat compile` should work fine on a normal machine with regular
> internet access. If it ever can't reach the compiler download for some
> reason, `node compile-standalone.js` is a fallback that compiles directly
> via the `solc` npm package and writes ABI + bytecode to `artifacts-manual/`.

## Deploy to Arc testnet

```bash
npx hardhat run scripts/deploy.js --network arcTestnet
```

This deploys `MemeFactory`, which is the only contract you deploy directly —
it deploys a `MemeToken` + `BondingCurve` pair per launched meme.

After deploying, copy the printed `MemeFactory` address into
`frontend/.env` as `VITE_FACTORY_ADDRESS`.

## Update the launch fee (already deployed)

`MemeFactory` has an owner-only `setLaunchFee()`, so you don't need to
redeploy to change the fee — only the deployer wallet can call this:

```bash
FACTORY_ADDRESS=0x0C68748f5eF6d59739086beFa892356fb18B0951 NEW_FEE=2000000 npx hardhat run scripts/set-launch-fee.js --network arcTestnet
```

`NEW_FEE` is in USDC base units (6 decimals) — `2000000` = 2 USDC.

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
