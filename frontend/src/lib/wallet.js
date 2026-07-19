import { BrowserProvider } from "ethers";
import { ARC_CHAIN_ID_HEX, ARC_RPC_URL } from "./config";

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Install Rabby or MetaMask to continue.");
  }

  await window.ethereum.request({ method: "eth_requestAccounts" });
  await ensureArcNetwork();

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
}

async function ensureArcNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // 4902 = chain not added to wallet yet
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: ARC_CHAIN_ID_HEX,
          chainName: "Arc Testnet",
          rpcUrls: [ARC_RPC_URL],
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
        }],
      });
    } else {
      throw switchError;
    }
  }
}
