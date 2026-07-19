const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileRegistry", function () {
  it("lets a user set and read back their own profile", async function () {
    const [user] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ProfileRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    await expect(registry.connect(user).setProfile("Zara", "data:image/jpeg;base64,abc"))
      .to.emit(registry, "ProfileUpdated")
      .withArgs(user.address, "Zara", "data:image/jpeg;base64,abc");

    const [name, avatarURI, exists] = await registry.getProfile(user.address);
    expect(name).to.equal("Zara");
    expect(avatarURI).to.equal("data:image/jpeg;base64,abc");
    expect(exists).to.equal(true);
  });

  it("returns exists=false for an address with no profile set", async function () {
    const [, other] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("ProfileRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();

    const [, , exists] = await registry.getProfile(other.address);
    expect(exists).to.equal(false);
  });
});
