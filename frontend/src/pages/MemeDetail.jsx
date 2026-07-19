import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Contract, formatUnits, parseUnits } from "ethers";
import { getReadProvider } from "../lib/provider";
import { useWallet } from "../lib/WalletContext";
import { useToast } from "../lib/ToastContext";
import { FACTORY_ADDRESS, USDC_ADDRESS, explorerTxUrl, explorerTokenUrl } from "../lib/config";
import { FACTORY_ABI, CURVE_ABI, ERC20_ABI } from "../lib/abis";
import PriceChart from "../components/PriceChart";
import ActivityFeed from "../components/ActivityFeed";
import ShareButton from "../components/ShareButton";
import "./MemeDetail.css";

export default function MemeDetail() {
  const { tokenAddress } = useParams();
  const { address, signer, connect } = useWallet();
  const { push } = useToast();

  const [meme, setMeme] = useState(null);
  const [price, setPrice] = useState(null);
  const [mode, setMode] = useState("buy"); // buy | sell
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [activityVersion, setActivityVersion] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);

  const loadBalances = useCallback(async (memeData) => {
    if (!address || !memeData) {
      setUsdcBalance(0);
      setTokenBalance(0);
      return;
    }
    try {
      const provider = getReadProvider();
      const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, provider);
      const token = new Contract(memeData.token, ERC20_ABI, provider);
      const [usdcRaw, tokenRaw] = await Promise.all([
        usdc.balanceOf(address),
        token.balanceOf(address),
      ]);
      setUsdcBalance(Number(formatUnits(usdcRaw, 6)));
      setTokenBalance(Number(formatUnits(tokenRaw, 18)));
    } catch {
      setUsdcBalance(0);
      setTokenBalance(0);
    }
  }, [address]);

  const load = useCallback(async () => {
    if (!FACTORY_ADDRESS) return;
    const provider = getReadProvider();
    const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const count = Number(await factory.memeCount());
    const all = await factory.getMemes(0, count);
    const found = all.find((m) => m.token.toLowerCase() === tokenAddress.toLowerCase());
    if (!found) return;

    const curve = new Contract(found.curve, CURVE_ABI, provider);
    const spotPrice = await curve.spotPriceUsdcPerToken();

    setMeme(found);
    setPrice(Number(formatUnits(spotPrice, 18)));
  }, [tokenAddress]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadBalances(meme); }, [meme, loadBalances]);

  async function handleTrade(e) {
    e.preventDefault();
    setError(null);
    setTxStatus(null);

    if (!address) { await connect(); return; }
    if (!meme || !amount) return;

    try {
      setBusy(true);
      const curve = new Contract(meme.curve, CURVE_ABI, signer);
      let receipt;

      if (mode === "buy") {
        const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
        const usdcIn = parseUnits(amount, 6);
        const allowance = await usdc.allowance(address, meme.curve);
        if (allowance < usdcIn) {
          setTxStatus("Approving USDC…");
          const approveTx = await usdc.approve(meme.curve, usdcIn);
          await approveTx.wait();
        }
        setTxStatus("Buying…");
        const tx = await curve.buy(usdcIn, 0);
        receipt = await tx.wait();
      } else {
        const token = new Contract(meme.token, ERC20_ABI, signer);
        const tokensIn = parseUnits(amount, 18);
        const allowance = await token.allowance(address, meme.curve);
        if (allowance < tokensIn) {
          setTxStatus("Approving token…");
          const approveTx = await token.approve(meme.curve, tokensIn);
          await approveTx.wait();
        }
        setTxStatus("Selling…");
        const tx = await curve.sell(tokensIn, 0);
        receipt = await tx.wait();
      }

      setTxStatus("Done");
      push({
        title: mode === "buy" ? `Bought $${meme.symbol}` : `Sold $${meme.symbol}`,
        message: `${receipt.hash.slice(0, 10)}…`,
        variant: "success",
        explorerUrl: explorerTxUrl(receipt.hash),
      });
      setAmount("");
      await load();
      await loadBalances(meme);
      setActivityVersion((v) => v + 1);
    } catch (err) {
      const message = err.shortMessage || err.message || "Transaction failed";
      setError(message);
      push({ title: "Transaction failed", message, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  function setPct(pct) {
    const base = mode === "buy" ? usdcBalance : tokenBalance;
    const value = base * pct;
    if (value <= 0) return;
    setAmount(String(parseFloat(value.toFixed(6))));
  }

  if (!FACTORY_ADDRESS) {
    return <div className="meme-detail__empty">Contracts aren't deployed yet.</div>;
  }

  if (!meme) {
    return <div className="meme-detail__empty">Loading meme…</div>;
  }

  return (
    <div className="meme-detail">
      <Link to="/" className="meme-detail__back">← Explore</Link>

      <div className="meme-detail__layout">
        <div className="meme-detail__info">
          <div className="meme-detail__image">
            {meme.imageURI ? <img src={meme.imageURI} alt={meme.name} /> : <span>${meme.symbol}</span>}
          </div>
          <h1>{meme.name}</h1>
          <span className="meme-detail__symbol">${meme.symbol}</span>
          <span className="meme-detail__price">
            {price ? `$${price.toFixed(6)}` : "N/A"} <small>per token</small>
          </span>
          <p className="meme-detail__creator">
            Created by <Link className="mono" to={`/profile/${meme.creator}`}>
              {meme.creator.slice(0, 6)}…{meme.creator.slice(-4)}
            </Link>
          </p>
          <div className="meme-detail__actions">
            <a className="meme-detail__explorer-link" href={explorerTokenUrl(meme.token)} target="_blank" rel="noopener noreferrer">
              View token on Explorer ↗
            </a>
            <ShareButton meme={meme} priceUsdc={price} />
          </div>

          <div className="meme-detail__chart">
            <PriceChart key={`chart-${activityVersion}`} curveAddress={meme.curve} />
          </div>

          <div className="meme-detail__activity">
            <h2>Activity</h2>
            <ActivityFeed key={`activity-${activityVersion}`} curveAddress={meme.curve} symbol={meme.symbol} />
          </div>
        </div>

        <form className="meme-detail__trade" onSubmit={handleTrade}>
          <div className="trade__tabs">
            <button type="button" className={mode === "buy" ? "active" : ""} onClick={() => setMode("buy")}>Buy</button>
            <button type="button" className={mode === "sell" ? "active" : ""} onClick={() => setMode("sell")}>Sell</button>
          </div>

          <label>
            <span className="trade__label-row">
              {mode === "buy" ? "USDC to spend" : "Tokens to sell"}
              {address && (
                <span className="trade__balance">
                  Balance: {mode === "buy" ? usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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
            <div className="trade__pct-row">
              <button type="button" onClick={() => setPct(0.25)}>25%</button>
              <button type="button" onClick={() => setPct(0.5)}>50%</button>
              <button type="button" onClick={() => setPct(0.75)}>75%</button>
              <button type="button" onClick={() => setPct(1)}>Max</button>
            </div>
          )}

          {txStatus && <p className="trade__status">{txStatus}</p>}
          {error && <p className="trade__error">{error}</p>}

          <button type="submit" className={`btn btn--primary trade__submit ${mode === "sell" ? "trade__submit--sell" : ""}`} disabled={busy || (!!address && !amount)}>
            {!address ? "Connect wallet"
              : busy ? "Processing…"
              : mode === "buy" ? "Buy" : "Sell"}
          </button>
        </form>
      </div>
    </div>
  );
}
