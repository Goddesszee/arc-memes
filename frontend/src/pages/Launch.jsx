import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Contract, formatUnits } from "ethers";
import { useWallet } from "../lib/WalletContext";
import { useToast } from "../lib/ToastContext";
import { useReceipt } from "../lib/ReceiptContext";
import { FACTORY_ADDRESS, USDC_ADDRESS, explorerTxUrl } from "../lib/config";
import { FACTORY_ABI, ERC20_ABI } from "../lib/abis";
import { fileToLogoDataUri } from "../lib/imageUtils";
import "./Launch.css";

const STEPS = {
  IDLE: "idle",
  APPROVING: "approving",
  LAUNCHING: "launching",
  DONE: "done",
};

// Data-URI logos get stored on-chain as a plain string, so keep a hard cap
// to avoid an unexpectedly expensive launch transaction.
const MAX_LOGO_CHARS = 60_000;

export default function Launch() {
  const { address, signer, connect } = useWallet();
  const { push } = useToast();
  const { openReceipt } = useReceipt();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [logoDataUri, setLogoDataUri] = useState("");
  const [logoError, setLogoError] = useState(null);
  const [processingLogo, setProcessingLogo] = useState(false);
  const [step, setStep] = useState(STEPS.IDLE);
  const [error, setError] = useState(null);

  const canSubmit = name.trim() && symbol.trim() && logoDataUri && step === STEPS.IDLE;

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("That's not an image file.");
      return;
    }
    setLogoError(null);
    setProcessingLogo(true);
    try {
      const dataUri = await fileToLogoDataUri(file);
      if (dataUri.length > MAX_LOGO_CHARS) {
        setLogoError("Image is too large even after compression. Try a simpler image.");
        setProcessingLogo(false);
        return;
      }
      setLogoDataUri(dataUri);
    } catch (err) {
      setLogoError(err.message || "Couldn't process that image");
    } finally {
      setProcessingLogo(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!address) {
      await connect();
      return;
    }
    if (!FACTORY_ADDRESS) {
      setError("Contracts aren't deployed yet. Set VITE_FACTORY_ADDRESS to enable launching.");
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
      const tx = await factory.launchMeme(name.trim(), symbol.trim().toUpperCase(), logoDataUri);
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
        openReceipt({
          type: "launch",
          meme: {
            token: launchedEvent.args.token,
            name: name.trim(),
            symbol: symbol.trim().toUpperCase(),
            imageURI: logoDataUri,
          },
          creator: address,
          launchFeeLabel: fee > 0n ? `${formatUnits(fee, 6)} USDC` : "Free",
          txHash: receipt.hash,
          timestamp: Date.now(),
        });
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
          Give it a name, a symbol, and a logo. Your token deploys with its own
          bonding curve. Trading opens the moment it's live.
        </p>

        <form onSubmit={handleSubmit} className="launch__form">
          <label>
            Logo
            <div
              className={`logo-drop ${logoDataUri ? "logo-drop--filled" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              {processingLogo ? (
                <span className="logo-drop__hint">Processing…</span>
              ) : logoDataUri ? (
                <img src={logoDataUri} alt="Logo preview" />
              ) : (
                <span className="logo-drop__hint">Click or drag an image here</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {logoDataUri && !processingLogo && (
              <button type="button" className="logo-drop__replace" onClick={() => fileInputRef.current?.click()}>
                Replace image
              </button>
            )}
            {logoError && <span className="launch__field-error">{logoError}</span>}
          </label>

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
