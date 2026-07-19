// Fill these in once contracts are deployed (see contracts/README.md).
export const ARC_CHAIN_ID = 5042002;
export const ARC_CHAIN_ID_HEX = "0x" + ARC_CHAIN_ID.toString(16);
export const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";

export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || "";
export const PROFILE_REGISTRY_ADDRESS = import.meta.env.VITE_PROFILE_REGISTRY_ADDRESS || "";
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
export const EURC_ADDRESS = import.meta.env.VITE_EURC_ADDRESS || "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
// cirBTC — Circle's wrapped BTC product, live on Arc testnet. No confirmed
// contract address at time of writing; set this once you have it, the
// balance row just won't show until then.
export const CIRBTC_ADDRESS = import.meta.env.VITE_CIRBTC_ADDRESS || "";

export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || "https://testnet.arcscan.app";
export const explorerTxUrl = (hash) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddressUrl = (addr) => `${EXPLORER_URL}/address/${addr}`;
export const explorerTokenUrl = (addr) => `${EXPLORER_URL}/token/${addr}`;

export const USDC_DECIMALS = 6;
export const TOKEN_DECIMALS = 18;
export const TOTAL_SUPPLY = 1_000_000_000; // matches MemeFactory.TOTAL_SUPPLY
export const GRADUATION_THRESHOLD_USDC = 69_000; // matches BondingCurve.GRADUATION_THRESHOLD_USDC (human units)
