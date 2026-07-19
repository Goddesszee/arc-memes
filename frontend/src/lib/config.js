// Fill these in once contracts are deployed (see contracts/README.md).
export const ARC_CHAIN_ID = 5042002;
export const ARC_CHAIN_ID_HEX = "0x" + ARC_CHAIN_ID.toString(16);
export const ARC_RPC_URL = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";

export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || "";
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
export const EURC_ADDRESS = import.meta.env.VITE_EURC_ADDRESS || "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

export const USDC_DECIMALS = 6;
export const TOKEN_DECIMALS = 18;
