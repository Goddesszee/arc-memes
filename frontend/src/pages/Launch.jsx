import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Contract, parseUnits } from "ethers";
import { useWallet } from "../lib/WalletContext";
import { useToast } from "../lib/ToastContext";
import { FACTORY_ADDRESS, USDC_ADDRESS, explorerTxUrl } from "../lib/config";
import { FACTORY_ABI, ERC20_ABI } from "../lib/abis";
import "./Launch.css";

const STEPS = {
  IDLE: "idle",
  APPROVING: "approving",
  LAUNCHING: "launching",
  DONE: "done",
};

export default function Launch() {
  const { address, signer, connect } = useWallet();
  const { push } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState(null);

  const canSubmit = name.trim() && symbol.trim() && imageURI.trim() && step === STEPS.IDLE;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!address) {
      await connect();
      return;
    }
    if (!FACTORY_ADDRESS) {
      setError("Contracts aren't deployed yet — set VITE_FACTORY_ADDRESS to enable launching.");
      return;
    }

    try {
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signer);

      const fee = await factory.launchFee();
      if (fee > 0n) {
        const allowance = await usdc.allowance(address, FACTORY_ADDRESS);
        if (allowance < fee) {
          setStep(STEPS.APPROVING);
          const approveTx = await usdc.approve(FACTORY_ADDRESS, fee);
          await approveTx.wait();
        }
      }

      setStep(STEPS.LAUNCHING);
      const tx = await factory.launchMeme(name.trim(), symbol.trim().toUpperCase(), imageURI.trim());
      const receipt = await tx.wait();

      const launchedEvent = receipt.logs
        .map((log) => { try { return factory.interface.parseLog(log); } catch { return null; } })
        .find((parsed) => parsed && parsed.name === "MemeLaunched");

      setStep(STEPS.DONE);

      push({
        title: `$${symbol.trim().toUpperCase()} launched`,
        message: `${receipt.hash.slice(0, 10)}…`,
        variant: "success",
        explorerUrl: explorerTxUrl(receipt.hash),
      });

      if (launchedEvent) {
        navigate(`/meme/${launchedEvent.args.token}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err.shortMessage || err.message || "Launch failed";
      setError(message);
      push({ title: "Launch failed", message, variant: "error" });
      setStep(STEPS.IDLE);
    }
  }

  return (
    <div className="launch">
      <div className="launch__card">
        <h1>Launch a meme</h1>
        <p className="launch__sub">
          Give it a name, a symbol, and an image. Your token deploys with its own
          bonding curve — trading opens the moment it's live.
        </p>

        <form onSubmit={handleSubmit} className="launch__form">
          <label>
            Name
            <input
              type="text"
              placeholder="e.g. Arc Frog"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </label>

          <label>
            Symbol
            <input
              type="text"
              placeholder="e.g. ARCFROG"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </label>

          <label>
            Image URL (IPFS recommended)
            <input
              type="text"
              placeholder="ipfs://... or https://..."
              value={imageURI}
              onChange={(e) => setImageURI(e.target.value)}
            />
          </label>

          {imageURI && (
            <div className="launch__preview">
              <img src={imageURI} alt="preview" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
          )}

          {error && <p className="launch__error">{error}</p>}

          <button type="submit" className="btn btn--primary launch__submit" disabled={!!address && !canSubmit}>
            {!address ? "Connect wallet to launch"
              : step === STEPS.APPROVING ? "Approving USDC…"
              : step === STEPS.LAUNCHING ? "Launching…"
              : "Launch meme"}
          </button>
        </form>
      </div>
    </div>
  );
}
