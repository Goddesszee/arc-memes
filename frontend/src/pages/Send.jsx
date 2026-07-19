import { useState, useEffect, useCallback } from "react";
import { Contract, formatUnits, parseUnits, isAddress } from "ethers";
import { useWallet } from "../lib/WalletContext";
import { useToast } from "../lib/ToastContext";
import { getReadProvider } from "../lib/provider";
import { USDC_ADDRESS, EURC_ADDRESS, explorerTxUrl } from "../lib/config";
import { ERC20_ABI } from "../lib/abis";
import "./Send.css";

const TOKENS = [
  { key: "usdc", label: "USDC", address: USDC_ADDRESS },
  { key: "eurc", label: "EURC", address: EURC_ADDRESS },
];

export default function Send() {
  const { address, signer, connect } = useWallet();
  const { push } = useToast();

  const [tokenKey, setTokenKey] = useState("usdc");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [decimals, setDecimals] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const token = TOKENS.find((t) => t.key === tokenKey);

  const loadBalance = useCallback(async () => {
    if (!address) { setBalance(0); return; }
    try {
      const provider = getReadProvider();
      const contract = new Contract(token.address, ERC20_ABI, provider);
      const [balRaw, dec] = await Promise.all([contract.balanceOf(address), contract.decimals()]);
      setDecimals(Number(dec));
      setBalance(Number(formatUnits(balRaw, dec)));
    } catch {
      setBalance(0);
    }
  }, [address, token.address]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  function setPct(pct) {
    const value = balance * pct;
    if (value <= 0) return;
    setAmount(String(parseFloat(value.toFixed(6))));
  }

  const recipientValid = recipient.length === 0 || isAddress(recipient);
  const canSubmit = address && recipient && isAddress(recipient) && amount && Number(amount) > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!address) { await connect(); return; }
    if (!canSubmit) return;

    try {
      setBusy(true);
      const contract = new Contract(token.address, ERC20_ABI, signer);
      const amountRaw = parseUnits(amount, decimals);
      const tx = await contract.transfer(recipient, amountRaw);
      const receipt = await tx.wait();

      push({
        title: `Sent ${amount} ${token.label}`,
        message: `${receipt.hash.slice(0, 10)}…`,
        variant: "success",
        explorerUrl: explorerTxUrl(receipt.hash),
      });

      setAmount("");
      setRecipient("");
      await loadBalance();
    } catch (err) {
      const message = err.shortMessage || err.message || "Send failed";
      setError(message);
      push({ title: "Send failed", message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="send">
      <div className="send__card">
        <h1>Send</h1>
        <p className="send__sub">Send USDC or EURC directly to any wallet address on Arc.</p>

        <form onSubmit={handleSubmit} className="send__form">
          <div className="send__token-tabs">
            {TOKENS.map((t) => (
              <button
                type="button"
                key={t.key}
                className={tokenKey === t.key ? "active" : ""}
                onClick={() => setTokenKey(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label>
            Recipient address
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
            />
            {!recipientValid && <span className="send__field-error">That doesn't look like a valid address.</span>}
          </label>

          <label>
            <span className="send__label-row">
              Amount
              {address && (
                <span className="send__balance">
                  Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token.label}
                </span>
              )}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          {address && (
            <div className="send__pct-row">
              <button type="button" onClick={() => setPct(0.25)}>25%</button>
              <button type="button" onClick={() => setPct(0.5)}>50%</button>
              <button type="button" onClick={() => setPct(0.75)}>75%</button>
              <button type="button" onClick={() => setPct(1)}>Max</button>
            </div>
          )}

          {error && <p className="send__error">{error}</p>}

          <button type="submit" className="btn btn--primary send__submit" disabled={busy || (!!address && !canSubmit)}>
            {!address ? "Connect wallet"
              : busy ? "Sending…"
              : `Send ${token.label}`}
          </button>
        </form>
      </div>
    </div>
  );
}
