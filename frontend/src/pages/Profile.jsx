import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Contract, formatUnits } from "ethers";
import { getReadProvider } from "../lib/provider";
import { useWallet } from "../lib/WalletContext";
import { useMemes } from "../lib/MemesContext";
import { useToast } from "../lib/ToastContext";
import {
  PROFILE_REGISTRY_ADDRESS, USDC_ADDRESS, EURC_ADDRESS, CIRBTC_ADDRESS,
  explorerAddressUrl,
} from "../lib/config";
import { PROFILE_REGISTRY_ABI, ERC20_ABI } from "../lib/abis";
import { fileToLogoDataUri } from "../lib/imageUtils";
import "./Profile.css";

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

function fmtBalance(n) {
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

const STABLE_TOKENS = [
  { key: "usdc", label: "USDC", address: USDC_ADDRESS },
  { key: "eurc", label: "EURC", address: EURC_ADDRESS },
  { key: "cirbtc", label: "cirBTC", address: CIRBTC_ADDRESS },
].filter((t) => t.address);

export default function Profile() {
  const { address: routeAddress } = useParams();
  const { address: myAddress, signer } = useWallet();
  const { memes } = useMemes();
  const { push } = useToast();
  const fileInputRef = useRef(null);

  const isOwnProfile = myAddress && routeAddress && myAddress.toLowerCase() === routeAddress.toLowerCase();

  const [profile, setProfile] = useState({ name: "", avatarURI: "", exists: false });
  const [balances, setBalances] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftAvatar, setDraftAvatar] = useState("");
  const [processingAvatar, setProcessingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const provider = getReadProvider();

    try {
      if (PROFILE_REGISTRY_ADDRESS) {
        const registry = new Contract(PROFILE_REGISTRY_ADDRESS, PROFILE_REGISTRY_ABI, provider);
        const [name, avatarURI, exists] = await registry.getProfile(routeAddress);
        setProfile({ name, avatarURI, exists });
        setDraftName(name);
        setDraftAvatar(avatarURI);
      }
    } catch {
      // registry not deployed yet — leave defaults
    }

    try {
      const stableResults = await Promise.all(
        STABLE_TOKENS.map(async (t) => {
          try {
            const c = new Contract(t.address, ERC20_ABI, provider);
            const [balRaw, decimals] = await Promise.all([c.balanceOf(routeAddress), c.decimals()]);
            return { ...t, balance: Number(formatUnits(balRaw, decimals)) };
          } catch {
            return { ...t, balance: 0 };
          }
        })
      );
      setBalances(stableResults);
    } catch {
      setBalances([]);
    }

    try {
      const held = await Promise.all(
        memes.map(async (m) => {
          try {
            const token = new Contract(m.token, ERC20_ABI, provider);
            const balRaw = await token.balanceOf(routeAddress);
            const balance = Number(formatUnits(balRaw, 18));
            return { ...m, balance, valueUsdc: balance * (m.priceUsdc || 0) };
          } catch {
            return { ...m, balance: 0, valueUsdc: 0 };
          }
        })
      );
      setHoldings(held.filter((h) => h.balance > 0).sort((a, b) => b.valueUsdc - a.valueUsdc));
    } catch {
      setHoldings([]);
    }

    setLoading(false);
  }, [routeAddress, memes]);

  useEffect(() => { load(); }, [load]);

  async function handleAvatarFile(file) {
    if (!file) return;
    setProcessingAvatar(true);
    try {
      const dataUri = await fileToLogoDataUri(file, 128);
      setDraftAvatar(dataUri);
    } catch (err) {
      push({ title: "Couldn't process image", message: err.message, variant: "error" });
    } finally {
      setProcessingAvatar(false);
    }
  }

  async function saveProfile() {
    if (!PROFILE_REGISTRY_ADDRESS) {
      push({ title: "Profiles aren't set up yet", message: "ProfileRegistry isn't deployed.", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const registry = new Contract(PROFILE_REGISTRY_ADDRESS, PROFILE_REGISTRY_ABI, signer);
      const tx = await registry.setProfile(draftName.trim(), draftAvatar);
      await tx.wait();
      setProfile({ name: draftName.trim(), avatarURI: draftAvatar, exists: true });
      setEditing(false);
      push({ title: "Profile saved", variant: "success" });
    } catch (err) {
      push({ title: "Couldn't save profile", message: err.shortMessage || err.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const totalStableValue = balances.reduce((sum, b) => sum + (b.key !== "cirbtc" ? b.balance : 0), 0);
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.valueUsdc, 0);

  return (
    <div className="profile">
      <div className="profile__header">
        <div className="profile__avatar">
          {(editing ? draftAvatar : profile.avatarURI) ? (
            <img src={editing ? draftAvatar : profile.avatarURI} alt="" />
          ) : (
            <span>{routeAddress.slice(2, 4).toUpperCase()}</span>
          )}
          {editing && (
            <button type="button" className="profile__avatar-edit" onClick={() => fileInputRef.current?.click()}>
              {processingAvatar ? "…" : "Edit"}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
        </div>

        <div className="profile__identity">
          {editing ? (
            <input
              className="profile__name-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Display name"
              maxLength={32}
            />
          ) : (
            <h1>{profile.name || shortAddr(routeAddress)}</h1>
          )}

          <div className="profile__address-row">
            <span className="mono">{shortAddr(routeAddress)}</span>
            <a href={explorerAddressUrl(routeAddress)} target="_blank" rel="noopener noreferrer">View on Explorer ↗</a>
          </div>
        </div>

        {isOwnProfile && (
          editing ? (
            <div className="profile__edit-actions">
              <button className="btn btn--ghost" onClick={() => { setEditing(false); setDraftName(profile.name); setDraftAvatar(profile.avatarURI); }} disabled={saving}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={saveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          ) : (
            <button className="btn btn--ghost" onClick={() => setEditing(true)}>Edit profile</button>
          )
        )}
      </div>

      <div className="profile__grid">
        <section className="profile__section">
          <h2>Wallet balances</h2>
          {balances.length === 0 ? (
            <p className="state-msg">No stablecoin addresses configured.</p>
          ) : (
            <div className="balance-list">
              {balances.map((b) => (
                <div className="balance-row" key={b.key}>
                  <span className="balance-row__label">{b.label}</span>
                  <span className="balance-row__value">{fmtBalance(b.balance)}</span>
                </div>
              ))}
              <div className="balance-row balance-row--total">
                <span>USDC + EURC combined (face value, not FX-adjusted)</span>
                <span>{totalStableValue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </section>

        <section className="profile__section">
          <h2>Meme holdings</h2>
          {loading ? (
            <p className="state-msg">Loading…</p>
          ) : holdings.length === 0 ? (
            <p className="state-msg">No meme tokens held yet.</p>
          ) : (
            <div className="holdings-list">
              {holdings.map((h) => (
                <Link to={`/meme/${h.token}`} className="holding-row" key={h.token}>
                  <div className="holding-row__thumb">
                    {h.imageURI ? <img src={h.imageURI} alt="" /> : <span>${h.symbol[0]}</span>}
                  </div>
                  <div className="holding-row__info">
                    <span className="holding-row__name">{h.name}</span>
                    <span className="holding-row__symbol">${h.symbol}</span>
                  </div>
                  <div className="holding-row__stats">
                    <span className="holding-row__balance">{fmtBalance(h.balance)}</span>
                    <span className="holding-row__value">${h.valueUsdc.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
              <div className="holdings-total">
                <span>Total holdings value</span>
                <span>${totalHoldingsValue.toFixed(2)}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
