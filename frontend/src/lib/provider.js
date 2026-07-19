import { JsonRpcProvider } from "ethers";
import { ARC_RPC_URL } from "./config";

// ethers batches multiple near-simultaneous calls into one JSON-RPC array
// request by default. Arc's testnet RPC doesn't handle that reliably —
// batched calls can come back with empty/missing data even though the
// same call works fine on its own. batchMaxCount: 1 sends every request
// individually instead.
export function getReadProvider() {
  return new JsonRpcProvider(ARC_RPC_URL, undefined, { batchMaxCount: 1 });
}
