import { useEffect, useState, useCallback } from "react";
import { Contract, formatUnits } from "ethers";
import { getReadProvider } from "./provider";
import { CURVE_ABI } from "./abis";

/// Reads Buy/Sell events for a curve and turns them into a time-ordered
/// trade list. Execution price per trade is usdcAmount / tokenAmount —
/// the standard way to derive price from AMM trade events without needing
/// a full indexer.
export function useTradeHistory(curveAddress) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!curveAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const provider = getReadProvider();
      const curve = new Contract(curveAddress, CURVE_ABI, provider);

      const [buyEvents, sellEvents] = await Promise.all([
        curve.queryFilter(curve.filters.Buy()),
        curve.queryFilter(curve.filters.Sell()),
      ]);

      const allEvents = [...buyEvents, ...sellEvents].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
        return a.index - b.index;
      });

      // Fetch each unique block's timestamp once
      const blockNumbers = [...new Set(allEvents.map((e) => e.blockNumber))];
      const blocks = await Promise.all(blockNumbers.map((bn) => provider.getBlock(bn)));
      const timestampByBlock = new Map(blockNumbers.map((bn, i) => [bn, blocks[i]?.timestamp]));

      const parsed = allEvents.map((e) => {
        const isBuy = e.fragment?.name === "Buy";
        const args = e.args;
        const usdcAmount = Number(formatUnits(isBuy ? args.usdcIn : args.usdcOut, 6));
        const tokenAmount = Number(formatUnits(isBuy ? args.tokensOut : args.tokensIn, 18));
        const price = tokenAmount > 0 ? usdcAmount / tokenAmount : 0;
        return {
          type: isBuy ? "buy" : "sell",
          trader: isBuy ? args.buyer : args.seller,
          usdcAmount,
          tokenAmount,
          price,
          timestamp: timestampByBlock.get(e.blockNumber) || 0,
          txHash: e.transactionHash,
        };
      });

      setTrades(parsed);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load trade history");
    } finally {
      setLoading(false);
    }
  }, [curveAddress]);

  useEffect(() => { refresh(); }, [refresh]);

  return { trades, loading, error, refresh };
}
