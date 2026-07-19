import { useState, useMemo } from "react";
import { Contract, formatUnits, parseUnits } from "ethers";
import { useWallet } from "../lib/WalletContext";
import { useMemes } from "../lib/MemesContext";
import { useToast } from "../lib/ToastContext";
import { USDC_ADDRESS, explorerTxUrl } from "../lib/config";
import { CURVE_ABI, ERC20_ABI } from "../lib/abis";
import "./Swap.css";

const USDC_OPTION = { key: "usdc", label: "USDC", isUsdc: true };

export default function Swap() {
  const { address, signer, connect } = useWallet();
  const { memes } = useMemes();
  const { push } = useToast();

  const options = useMemo(
    () => [USDC_OPTION, ...memes.map((m) => ({ key: m.token, label: `$${m.symbol}`, meme: m }))],
    [memes]
  );

  const [fromKey, setFromKey] = useState("usdc");
  const [toKey, setToKey] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const fromOpt = options.find((o) => o.key === fromKey);
  const toOpt = options.find((o) => o.key === toKey);

  function swapDirection() {
    setFromKey(toKey || "usdc");
    setToKey(fromKey === "usdc" ? "" : fromKey);
    setAmount("");
  }

  const canSubmit = fromOpt && toOpt && fromOpt.key !== toOpt.key && amount && Number(amount) > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!address) { await connect(); return; }
    if (!canSubmit) return;

    try {
      setBusy(true);

      // meme -> USDC only (plain sell)
      if (!fromOpt.isUsdc && toOpt.isUsdc) {
        const curve = new Contract(fromOpt.meme.curve, CURVE_ABI, signer);
        const token = new Contract(fromOpt.meme.token, ERC20_ABI, signer);
        const tokensIn = parseUnits(amount, 18);

        const allowance = await token.allowance(address, fromOpt.meme.curve);
        if (allowance < tokensIn) {
          setStatus("Approving token…");
          const approveTx = await token.approve(fromOpt.meme.curve, tokensIn);
          await approveTx.wait();
        }
        setStatus(`Selling $${fromOpt.meme.symbol}…`);
        const tx = await curve.sell(tokensIn, 0);
        const receipt = await tx.wait();
        finish(receipt, `Swapped $${fromOpt.meme.symbol} for USDC`);
        return;
      }

      // USDC -> meme only (plain buy)
      if (fromOpt.isUsdc && !toOpt.isUsdc) {
        const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
        const curve = new Contract(toOpt.meme.curve, CURVE_ABI, signer);
        const usdcIn = parseUnits(amount, 6);

        const allowance = await usdc.allowance(address, toOpt.meme.curve);
        if (allowance < usdcIn) {
          setStatus("Approving USDC…");
          const approveTx = await usdc.approve(toOpt.meme.curve, usdcIn);
          await approveTx.wait();
        }
        setStatus(`Buying $${toOpt.meme.symbol}…`);
        const tx = await curve.buy(usdcIn, 0);
        const receipt = await tx.wait();
        finish(receipt, `Swapped USDC for $${toOpt.meme.symbol}`);
        return;
      }

      // meme -> meme: sell fromOpt for USDC, then buy toOpt with that USDC
      const curveFrom = new Contract(fromOpt.meme.curve, CURVE_ABI, signer);
      const tokenFrom = new Contract(fromOpt.meme.token, ERC20_ABI, signer);
      const tokensIn = parseUnits(amount, 18);

      const allowanceFrom = await tokenFrom.allowance(address, fromOpt.meme.curve);
      if (allowanceFrom < tokensIn) {
        setStatus(`Approving $${fromOpt.meme.symbol}…`);
        const approveTx = await tokenFrom.approve(fromOpt.meme.curve, tokensIn);
        await approveTx.wait();
      }
      setStatus(`Step 1 of 2: selling $${fromOpt.meme.symbol}…`);
      const sellTx = await curveFrom.sell(tokensIn, 0);
      const sellReceipt = await sellTx.wait();

      const sellEvent = sellReceipt.logs
        .map((log) => { try { return curveFrom.interface.parseLog(log); } catch { return null; } })
        .find((parsed) => parsed && parsed.name === "Sell");
      const usdcOut = sellEvent?.args?.usdcOut;

      if (!usdcOut || usdcOut === 0n) {
        throw new Error("Sold, but received 0 USDC, stopping before the buy step.");
      }

      const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const curveTo = new Contract(toOpt.meme.curve, CURVE_ABI, signer);

      const allowanceTo = await usdc.allowance(address, toOpt.meme.curve);
      if (allowanceTo < usdcOut) {
        setStatus("Approving USDC…");
        const approveTx = await usdc.approve(toOpt.meme.curve, usdcOut);
        await approveTx.wait();
      }
      setStatus(`Step 2 of 2: buying $${toOpt.meme.symbol}…`);
      const buyTx = await curveTo.buy(usdcOut, 0);
      const buyReceipt = await buyTx.wait();

      finish(buyReceipt, `Swapped $${fromOpt.meme.symbol} for $${toOpt.meme.symbol}`);
    } catch (err) {
      const message = err.shortMessage || err.message || "Swap failed";
      setError(message);
      push({ title: "Swap failed", message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  function finish(receipt, title) {
    setStatus("Done");
    push({
      title,
      message: `${receipt.hash.slice(0, 10)}…`,
      variant: "success",
      explorerUrl: explorerTxUrl(receipt.hash),
    });
    setAmount("");
  }

  return (
    <div className="swap">
      <div className="swap__card">
        <h1>Swap</h1>
        <p className="swap__sub">
          Swap between any launched meme, or between a meme and USDC. Meme to meme
          swaps run as two transactions under the hood: sell, then buy.
        </p>

        <form onSubmit={handleSubmit} className="swap__form">
          <label>
            From
            <select value={fromKey} onChange={(e) => setFromKey(e.target.value)}>
              {options.map((o) => (
                <option key={o.key} value={o.key} disabled={o.key === toKey}>{o.label}</option>
              ))}
            </select>
          </label>

          <button type="button" className="swap__flip" onClick={swapDirection} aria-label="Flip direction">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M6 4v10M6 14l-3-3M6 14l3-3M14 16V6M14 6l3 3M14 6l-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <label>
            To
            <select value={toKey} onChange={(e) => setToKey(e.target.value)}>
              <option value="" disabled>Select a token</option>
              {options.map((o) => (
                <option key={o.key} value={o.key} disabled={o.key === fromKey}>{o.label}</option>
              ))}
            </select>
          </label>

          <label>
            Amount ({fromOpt?.label || "…"})
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          {status && <p className="swap__status">{status}</p>}
          {error && <p className="swap__error">{error}</p>}

          <button type="submit" className="btn btn--primary swap__submit" disabled={busy || (!!address && !canSubmit)}>
            {!address ? "Connect wallet"
              : busy ? "Swapping…"
              : "Swap"}
          </button>
        </form>
      </div>
    </div>
  );
}
