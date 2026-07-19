# Arc Memes — Frontend

React + Vite app for exploring, launching, and trading meme tokens on Arc.

## Setup

```bash
npm install
cp .env.example .env
# set VITE_FACTORY_ADDRESS after deploying contracts (see ../contracts/README.md)
npm run dev
```

## Pages

- `/` — Explore: live ticker + grid of every launched meme, pulled straight
  from the `MemeFactory` registry
- `/launch` — Launch: name, symbol, image URL → deploys a new meme token
- `/meme/:tokenAddress` — Trade: buy/sell against that meme's bonding curve

## Wallet

Connects via `window.ethereum` (Rabby, MetaMask, etc.), prompts a network
switch/add to Arc testnet if needed.

## Notes

- Images are expected as URLs (IPFS gateway links work well) — no upload
  pipeline is included yet.
- All on-chain reads use a plain JSON-RPC provider so the Explore page works
  even without a wallet connected; writes (launch, buy, sell) need a
  connected signer.
