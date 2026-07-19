import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Contract, JsonRpcProvider, formatUnits, parseUnits } from "ethers";
import { useWallet } from "../lib/WalletContext";
import { useToast } from "../lib/ToastContext";
import { FACTORY_ADDRESS, USDC_ADDRESS, ARC_RPC_URL, explorerTxUrl, explorerTokenUrl, explorerAddressUrl } from "../lib/config";
import { FACTORY_ABI, CURVE_ABI, ERC20_ABI } from "../lib/abis";
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

  const load = useCallback(async () => {
    if (!FACTORY_ADDRESS) return;
    const provider = new JsonRpcProvider(ARC_RPC_URL);
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
    } catch (err) {
      const message = err.shortMessage || err.message || "Transaction failed";
      setError(message);
      push({ title: "Transaction failed", message, variant: "error" });
    } finally {
      setBusy(false);
    }
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
            {price ? `$${price.toFixed(6)}` : "—"} <small>per token</small>
          </span>
          <p className="meme-detail__creator">
            Created by <a className="mono" href={explorerAddressUrl(meme.creator)} target="_blank" rel="noopener noreferrer">
              {meme.creator.slice(0, 6)}…{meme.creator.slice(-4)}
            </a>
          </p>
          <a className="meme-detail__explorer-link" href={explorerTokenUrl(meme.token)} target="_blank" rel="noopener noreferrer">
            View token on Explorer ↗
          </a>
        </div>

        <form className="meme-detail__trade" onSubmit={handleTrade}>
          <div className="trade__tabs">
            <button type="button" className={mode === "buy" ? "active" : ""} onClick={() => setMode("buy")}>Buy</button>
            <button type="button" className={mode === "sell" ? "active" : ""} onClick={() => setMode("sell")}>Sell</button>
          </div>

          <label>
            {mode === "buy" ? "USDC to spend" : "Tokens to sell"}
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

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
