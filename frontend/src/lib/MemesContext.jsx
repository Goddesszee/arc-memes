import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Contract, formatUnits } from "ethers";
import { getReadProvider } from "./provider";
import { FACTORY_ADDRESS, TOTAL_SUPPLY, GRADUATION_THRESHOLD_USDC } from "./config";
import { FACTORY_ABI, CURVE_ABI } from "./abis";

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
            const [priceRaw, tokenReserveRaw, realReserveRaw, graduated] = await Promise.all([
              curve.spotPriceUsdcPerToken(),
              curve.tokenReserve(),
              curve.realUsdcReserve(),
              curve.isGraduated(),
            ]);
            const priceUsdc = Number(formatUnits(priceRaw, 18));
            const tokenReserve = Number(formatUnits(tokenReserveRaw, 18));
            const realUsdc = Number(formatUnits(realReserveRaw, 6));
            const circulatingSupply = Math.max(TOTAL_SUPPLY - tokenReserve, 0);
            const marketCapUsdc = priceUsdc * circulatingSupply;
            const bondingProgress = Math.min(realUsdc / GRADUATION_THRESHOLD_USDC, 1);

            return { ...base, priceUsdc, circulatingSupply, marketCapUsdc, graduated, bondingProgress };
          } catch {
            return { ...base, priceUsdc: 0, circulatingSupply: 0, marketCapUsdc: 0, graduated: false, bondingProgress: 0 };
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

    // Heuristic: recency-weighted market cap. Favors tokens that have built
    // up cap quickly rather than just whatever is biggest overall. A real
    // volume-based ranking needs indexed Buy/Sell events, which this app
    // doesn't index yet.
    const trending = [...memes]
      .map((m) => {
        const ageHours = Math.max((now - m.launchedAt) / 3600, 0.5);
        return { ...m, _trendScore: m.marketCapUsdc / ageHours };
      })
      .sort((a, b) => b._trendScore - a._trendScore);

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
