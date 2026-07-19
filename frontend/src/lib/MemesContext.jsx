import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Contract, formatUnits } from "ethers";
import { getReadProvider } from "./provider";
import { FACTORY_ADDRESS, TOTAL_SUPPLY, GRADUATION_THRESHOLD_USDC } from "./config";
import { FACTORY_ABI, CURVE_ABI } from "./abis";
import { getVolume24h } from "./volume";

const MemesContext = createContext(null);
const REFRESH_MS = 30_000;

export function MemesProvider({ children }) {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!FACTORY_ADDRESS) {
      setLoading(false);
      setError("not-configured");
      return;
    }
    try {
      const provider = getReadProvider();
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
      const count = Number(await factory.memeCount());
      const raw = await factory.getMemes(0, count);

      const enriched = await Promise.all(
        raw.map(async (m) => {
          const base = {
            token: m.token,
            curve: m.curve,
            creator: m.creator,
            name: m.name,
            symbol: m.symbol,
            imageURI: m.imageURI,
            launchedAt: Number(m.launchedAt),
          };
          try {
            const curve = new Contract(m.curve, CURVE_ABI, provider);
            const [priceRaw, tokenReserveRaw, realReserveRaw, graduated, volume24h] = await Promise.all([
              curve.spotPriceUsdcPerToken(),
              curve.tokenReserve(),
              curve.realUsdcReserve(),
              curve.isGraduated(),
              getVolume24h(m.curve, provider),
            ]);
            const priceUsdc = Number(formatUnits(priceRaw, 18));
            const tokenReserve = Number(formatUnits(tokenReserveRaw, 18));
            const realUsdc = Number(formatUnits(realReserveRaw, 6));
            const circulatingSupply = Math.max(TOTAL_SUPPLY - tokenReserve, 0);
            const marketCapUsdc = priceUsdc * circulatingSupply;
            const bondingProgress = Math.min(realUsdc / GRADUATION_THRESHOLD_USDC, 1);

            return { ...base, priceUsdc, circulatingSupply, marketCapUsdc, graduated, bondingProgress, volume24h };
          } catch {
            return { ...base, priceUsdc: 0, circulatingSupply: 0, marketCapUsdc: 0, graduated: false, bondingProgress: 0, volume24h: 0 };
          }
        })
      );

      setMemes(enriched.reverse()); // newest first
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load memes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const categories = useMemo(() => {
    const now = Date.now() / 1000;

    const byNew = [...memes].sort((a, b) => b.launchedAt - a.launchedAt);
    const byMarketCap = [...memes].sort((a, b) => b.marketCapUsdc - a.marketCapUsdc);
    const graduated = memes.filter((m) => m.graduated).sort((a, b) => b.marketCapUsdc - a.marketCapUsdc);
    const bondingSoon = memes
      .filter((m) => !m.graduated)
      .sort((a, b) => b.bondingProgress - a.bondingProgress);

    // Real trending: sorted by actual 24h trade volume (from Buy/Sell
    // events), not a proxy. Falls back to a recency-weighted market cap
    // score as a tiebreaker when volume is flat (e.g. everything's at 0
    // during a quiet period) so the list still has a sensible order.
    const trending = [...memes]
      .map((m) => {
        const ageHours = Math.max((now - m.launchedAt) / 3600, 0.5);
        return { ...m, _trendTiebreak: m.marketCapUsdc / ageHours };
      })
      .sort((a, b) => {
        if (b.volume24h !== a.volume24h) return b.volume24h - a.volume24h;
        return b._trendTiebreak - a._trendTiebreak;
      });

    return { trending, new: byNew, topMarketCap: byMarketCap, graduated, bondingSoon };
  }, [memes]);

  return (
    <MemesContext.Provider value={{ memes, categories, loading, error, refresh }}>
      {children}
    </MemesContext.Provider>
  );
}

export function useMemes() {
  const ctx = useContext(MemesContext);
  if (!ctx) throw new Error("useMemes must be used within MemesProvider");
  return ctx;
}
