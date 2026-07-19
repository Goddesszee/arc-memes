// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MemeToken.sol";
import "./BondingCurve.sol";

/// @title MemeFactory
/// @notice Anyone can launch a new meme token for a small USDC fee. The
/// factory deploys a MemeToken + BondingCurve pair and keeps a registry
/// so the frontend can list every meme ever launched.
contract MemeFactory is Ownable {
    using SafeERC20 for IERC20;

    struct Meme {
        address token;
        address curve;
        address creator;
        string name;
        string symbol;
        string imageURI;
        uint256 launchedAt;
    }

    IERC20 public immutable usdc;
    uint256 public launchFee; // in USDC base units (6 decimals)
    address public feeRecipient;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether; // 1B tokens, 18 decimals
    uint256 public constant VIRTUAL_USDC_RESERVE = 30_000_000; // 30 USDC (6 decimals) seeds starting price

    Meme[] public memes;
    mapping(address => uint256) public tokenToMemeIndex;

    event MemeLaunched(
        uint256 indexed index,
        address indexed token,
        address indexed curve,
        address creator,
        string name,
        string symbol,
        string imageURI
    );

    constructor(IERC20 usdc_, uint256 launchFee_, address feeRecipient_) Ownable(msg.sender) {
        usdc = usdc_;
        launchFee = launchFee_;
        feeRecipient = feeRecipient_;
    }

    function launchMeme(
        string calldata name_,
        string calldata symbol_,
        string calldata imageURI_
    ) external returns (address tokenAddr, address curveAddr) {
        if (launchFee > 0) {
            usdc.safeTransferFrom(msg.sender, feeRecipient, launchFee);
        }

        // Precompute curve address by deploying token first with a placeholder,
        // then curve, then... instead we deploy curve after token using CREATE
        // order: token needs curve address at construction, so deploy token with
        // this factory as temporary minter is avoided by minting straight to curve.
        // We deploy in two steps using a deterministic pattern: deploy curve shell
        // is not possible without token address, so instead MemeToken mints to an
        // address we compute via nonce-based prediction is overkill for a hackathon
        // build — simplest robust approach: deploy token to THIS factory, deploy
        // curve, then move the balance from factory to curve.
        MemeToken newToken = new MemeToken(
            name_,
            symbol_,
            imageURI_,
            msg.sender,
            address(this),
            TOTAL_SUPPLY
        );

        BondingCurve newCurve = new BondingCurve(
            usdc,
            newToken,
            TOTAL_SUPPLY,
            VIRTUAL_USDC_RESERVE,
            feeRecipient
        );

        newToken.transfer(address(newCurve), TOTAL_SUPPLY);

        tokenAddr = address(newToken);
        curveAddr = address(newCurve);

        uint256 index = memes.length;
        memes.push(Meme({
            token: tokenAddr,
            curve: curveAddr,
            creator: msg.sender,
            name: name_,
            symbol: symbol_,
            imageURI: imageURI_,
            launchedAt: block.timestamp
        }));
        tokenToMemeIndex[tokenAddr] = index;

        emit MemeLaunched(index, tokenAddr, curveAddr, msg.sender, name_, symbol_, imageURI_);
    }

    function memeCount() external view returns (uint256) {
        return memes.length;
    }

    function getMemes(uint256 start, uint256 limit) external view returns (Meme[] memory result) {
        uint256 end = start + limit;
        if (end > memes.length) end = memes.length;
        if (start >= end) return new Meme[](0);
        result = new Meme[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = memes[i];
        }
    }

    function setLaunchFee(uint256 newFee) external onlyOwner {
        launchFee = newFee;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }
}
