// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ProfileRegistry
/// @notice Lets any address set a display name and avatar for itself. Kept
/// deliberately simple — one slot per address, caller can only write their
/// own. No backend/database needed; anyone can read any profile by address,
/// which is what makes a profile link shareable and consistent for everyone.
contract ProfileRegistry {
    struct Profile {
        string name;
        string avatarURI;
        bool exists;
    }

    mapping(address => Profile) private profiles;

    event ProfileUpdated(address indexed user, string name, string avatarURI);

    function setProfile(string calldata name_, string calldata avatarURI_) external {
        profiles[msg.sender] = Profile({ name: name_, avatarURI: avatarURI_, exists: true });
        emit ProfileUpdated(msg.sender, name_, avatarURI_);
    }

    function getProfile(address user) external view returns (string memory name, string memory avatarURI, bool exists) {
        Profile memory p = profiles[user];
        return (p.name, p.avatarURI, p.exists);
    }
}
