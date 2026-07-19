export const FACTORY_ABI = [
  "function launchFee() view returns (uint256)",
  "function memeCount() view returns (uint256)",
  "function getMemes(uint256 start, uint256 limit) view returns (tuple(address token, address curve, address creator, string name, string symbol, string imageURI, uint256 launchedAt)[])",
  "function launchMeme(string name, string symbol, string imageURI) returns (address, address)",
  "event MemeLaunched(uint256 indexed index, address indexed token, address indexed curve, address creator, string name, string symbol, string imageURI)"
];

export const CURVE_ABI = [
  "function buy(uint256 usdcIn, uint256 minTokensOut)",
  "function sell(uint256 tokensIn, uint256 minUsdcOut)",
  "function spotPriceUsdcPerToken() view returns (uint256)",
  "function realUsdcReserve() view returns (uint256)",
  "function tokenReserve() view returns (uint256)",
  "event Buy(address indexed buyer, uint256 usdcIn, uint256 feeAmount, uint256 tokensOut)",
  "event Sell(address indexed seller, uint256 tokensIn, uint256 usdcOut, uint256 feeAmount)"
];

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];
