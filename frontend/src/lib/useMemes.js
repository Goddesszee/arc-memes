import { useEffect, useState, useCallback, useMemo } from "react";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { FACTORY_ADDRESS, ARC_RPC_URL, TOTAL_SUPPLY } from "./config";
import { FACTORY_ABI, CURVE_ABI } from "./abis";

export function useMemes() {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!FACTORY_ADDRESS) {
      setLoading(false);
      setError("not-configured");
      return;
    }
    setLoading(true);
    try {
      const provider = new JsonRpcProvider(ARC_RPC_URL);
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
            const [priceRaw, tokenReserveRaw, graduated] = await Promise.all([
              curve.spotPriceUsdcPerToken(),
              curve.tokenReserve(),
              curve.isGraduated(),
            ]);
            const priceUsdc = Number(formatUnits(priceRaw, 18));
            const tokenReserve = Number(formatUnits(tokenReserveRaw, 18));
            const circulatingSupply = Math.max(TOTAL_SUPPLY - tokenReserve, 0);
            const marketCapUsdc = priceUsdc * circulatingSupply;

            return { ...base, priceUsdc, circulatingSupply, marketCapUsdc, graduated };
          } catch {
            return { ...base, priceUsdc: 0, circulatingSupply: 0, marketCapUsdc: 0, graduated: false };
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

  useEffect(() => { refresh(); }, [refresh]);

  const categories = useMemo(() => {
    const now = Date.now() / 1000;

    const byNew = [...memes].sort((a, b) => b.launchedAt - a.launchedAt);
    const byMarketCap = [...memes].sort((a, b) => b.marketCapUsdc - a.marketCapUsdc);
    const graduated = memes.filter((m) => m.graduated).sort((a, b) => b.marketCapUsdc - a.marketCapUsdc);

    // Heuristic: recency-weighted market cap. Favors tokens that have built
    // up cap quickly rather than just whatever is biggest overall.
    const trending = [...memes]
      .map((m) => {
        const ageHours = Math.max((now - m.launchedAt) / 3600, 0.5);
        return { ...m, _trendScore: m.marketCapUsdc / ageHours };
      })
      .sort((a, b) => b._trendScore - a._trendScore);

    return { trending, new: byNew, topMarketCap: byMarketCap, graduated };
  }, [memes]);

  return { memes, categories, loading, error, refresh };
}
