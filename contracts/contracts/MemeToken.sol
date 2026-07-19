// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MemeToken
/// @notice Simple ERC20 for a community-launched meme. The entire supply is
/// minted once, at deployment, directly to its BondingCurve contract, which
/// is the only place tokens can be acquired from (via buy) or sold back to.
contract MemeToken is ERC20 {
    string public imageURI;
    address public creator;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory imageURI_,
        address creator_,
        address curve_,
        uint256 totalSupply_
    ) ERC20(name_, symbol_) {
        imageURI = imageURI_;
        creator = creator_;
        _mint(curve_, totalSupply_);
    }
}
