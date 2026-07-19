// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MemeToken.sol";

/// @title BondingCurve
/// @notice One curve per launched meme token. Uses a constant-product
/// formula (x * y = k) with a "virtual" USDC reserve to seed the starting
/// price, pump.fun style. Real USDC only ever comes from actual buys, and
/// sells can never withdraw more than has actually been deposited.
contract BondingCurve is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for MemeToken;

    IERC20 public immutable usdc;
    MemeToken public immutable token;
    address public immutable feeRecipient;

    uint256 public immutable virtualUsdcReserve;
    uint256 public immutable k; // virtualUsdcReserve * totalSupply, held constant

    uint256 public realUsdcReserve; // actual USDC held by the curve
    uint256 public tokenReserve;    // tokens still held by the curve (not yet bought)

    uint16 public constant FEE_BPS = 100; // 1% trading fee
    uint16 private constant BPS_DENOM = 10_000;

    event Buy(address indexed buyer, uint256 usdcIn, uint256 feeAmount, uint256 tokensOut);
    event Sell(address indexed seller, uint256 tokensIn, uint256 usdcOut, uint256 feeAmount);

    constructor(
        IERC20 usdc_,
        MemeToken token_,
        uint256 totalSupply_,
        uint256 virtualUsdcReserve_,
        address feeRecipient_
    ) {
        usdc = usdc_;
        token = token_;
        feeRecipient = feeRecipient_;
        virtualUsdcReserve = virtualUsdcReserve_;
        tokenReserve = totalSupply_;
        k = virtualUsdcReserve_ * totalSupply_;
    }

    /// @notice Current spot price of one whole token, in USDC base units (6 decimals),
    /// scaled by 1e18 for precision.
    function spotPriceUsdcPerToken() external view returns (uint256) {
        uint256 totalUsdc = virtualUsdcReserve + realUsdcReserve;
        if (tokenReserve == 0) return 0;
        return (totalUsdc * 1e18) / tokenReserve;
    }

    /// @notice Buy meme tokens with USDC. Caller must approve USDC first.
    /// @param usdcIn Amount of USDC (6 decimals) to spend, including fee.
    /// @param minTokensOut Slippage protection.
    function buy(uint256 usdcIn, uint256 minTokensOut) external nonReentrant {
        require(usdcIn > 0, "usdcIn=0");

        uint256 fee = (usdcIn * FEE_BPS) / BPS_DENOM;
        uint256 usdcAfterFee = usdcIn - fee;

        usdc.safeTransferFrom(msg.sender, address(this), usdcIn);
        if (fee > 0) usdc.safeTransfer(feeRecipient, fee);

        realUsdcReserve += usdcAfterFee;
        uint256 newTotalUsdc = virtualUsdcReserve + realUsdcReserve;
        uint256 newTokenReserve = k / newTotalUsdc;
        require(newTokenReserve < tokenReserve, "no liquidity");

        uint256 tokensOut = tokenReserve - newTokenReserve;
        require(tokensOut >= minTokensOut, "slippage");

        tokenReserve = newTokenReserve;
        token.safeTransfer(msg.sender, tokensOut);

        emit Buy(msg.sender, usdcIn, fee, tokensOut);
    }

    /// @notice Sell meme tokens back into the curve for USDC. Caller must approve tokens first.
    /// @param tokensIn Amount of meme tokens to sell.
    /// @param minUsdcOut Slippage protection.
    function sell(uint256 tokensIn, uint256 minUsdcOut) external nonReentrant {
        require(tokensIn > 0, "tokensIn=0");

        token.safeTransferFrom(msg.sender, address(this), tokensIn);

        uint256 newTokenReserve = tokenReserve + tokensIn;
        uint256 newTotalUsdc = k / newTokenReserve;
        uint256 totalUsdc = virtualUsdcReserve + realUsdcReserve;
        require(newTotalUsdc < totalUsdc, "math");

        uint256 grossUsdcOut = totalUsdc - newTotalUsdc;
        require(grossUsdcOut <= realUsdcReserve, "insufficient real reserve");

        uint256 fee = (grossUsdcOut * FEE_BPS) / BPS_DENOM;
        uint256 usdcOut = grossUsdcOut - fee;
        require(usdcOut >= minUsdcOut, "slippage");

        tokenReserve = newTokenReserve;
        realUsdcReserve -= grossUsdcOut;

        if (fee > 0) usdc.safeTransfer(feeRecipient, fee);
        usdc.safeTransfer(msg.sender, usdcOut);

        emit Sell(msg.sender, tokensIn, usdcOut, fee);
    }
}
