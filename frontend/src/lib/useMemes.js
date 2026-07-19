import { useEffect, useState, useCallback } from "react";
import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { FACTORY_ADDRESS, ARC_RPC_URL, USDC_DECIMALS } from "./config";
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

      const withPrices = await Promise.all(
        raw.map(async (m) => {
          try {
            const curve = new Contract(m.curve, CURVE_ABI, provider);
            const priceRaw = await curve.spotPriceUsdcPerToken();
            return {
              token: m.token,
              curve: m.curve,
              creator: m.creator,
              name: m.name,
              symbol: m.symbol,
              imageURI: m.imageURI,
              launchedAt: Number(m.launchedAt),
              priceUsdc: Number(formatUnits(priceRaw, 18)),
            };
          } catch {
            return {
              token: m.token, curve: m.curve, creator: m.creator,
              name: m.name, symbol: m.symbol, imageURI: m.imageURI,
              launchedAt: Number(m.launchedAt), priceUsdc: 0,
            };
          }
        })
      );

      setMemes(withPrices.reverse()); // newest first
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load memes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { memes, loading, error, refresh };
}
