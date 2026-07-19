import { Contract, formatUnits } from "ethers";
import { CURVE_ABI } from "./abis";

const DAY_SECONDS = 86400;

/// Sums USDC volume (buys + sells) for a curve over the last 24h, by
/// reading Buy/Sell events directly. This is a real signal, not a proxy —
/// but it does mean one queryFilter + block-timestamp round trip per meme
/// per refresh. Fine at the scale of dozens of tokens; a real indexer
/// would be worth it once launches are in the hundreds+.
export async function getVolume24h(curveAddress, provider) {
  try {
    const curve = new Contract(curveAddress, CURVE_ABI, provider);
    const [buyEvents, sellEvents] = await Promise.all([
      curve.queryFilter(curve.filters.Buy()),
      curve.queryFilter(curve.filters.Sell()),
    ]);
    const allEvents = [...buyEvents, ...sellEvents];
    if (allEvents.length === 0) return 0;

    const blockNumbers = [...new Set(allEvents.map((e) => e.blockNumber))];
    const blocks = await Promise.all(blockNumbers.map((bn) => provider.getBlock(bn)));
    const timestampByBlock = new Map(blockNumbers.map((bn, i) => [bn, blocks[i]?.timestamp || 0]));

    const nowSeconds = Date.now() / 1000;
    let volume = 0;
    for (const e of allEvents) {
      const ts = timestampByBlock.get(e.blockNumber) || 0;
      if (nowSeconds - ts > DAY_SECONDS) continue;
      const isBuy = e.fragment?.name === "Buy";
      const amount = isBuy ? e.args.usdcIn : e.args.usdcOut;
      volume += Number(formatUnits(amount, 6));
    }
    return volume;
  } catch {
    return 0;
  }
}
