const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Arc Memes launchpad", function () {
  async function deployFixture() {
    const [deployer, creator, buyer, feeRecipient] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("TestUSDC");
    const usdc = await USDC.deploy();
    await usdc.waitForDeployment();

    const launchFee = ethers.parseUnits("1", 6); // 1 USDC
    const Factory = await ethers.getContractFactory("MemeFactory");
    const factory = await Factory.deploy(await usdc.getAddress(), launchFee, feeRecipient.address);
    await factory.waitForDeployment();

    // fund creator + buyer with test USDC
    await usdc.mint(creator.address, ethers.parseUnits("1000", 6));
    await usdc.mint(buyer.address, ethers.parseUnits("1000", 6));

    return { deployer, creator, buyer, feeRecipient, usdc, factory, launchFee };
  }

  it("launches a meme and deploys a token + curve pair", async function () {
    const { creator, usdc, factory, launchFee } = await deployFixture();

    await usdc.connect(creator).approve(await factory.getAddress(), launchFee);
    await expect(
      factory.connect(creator).launchMeme("Arc Frog", "ARCFROG", "ipfs://example")
    ).to.emit(factory, "MemeLaunched");

    expect(await factory.memeCount()).to.equal(1n);
    const memes = await factory.getMemes(0, 1);
    expect(memes[0].name).to.equal("Arc Frog");
    expect(memes[0].symbol).to.equal("ARCFROG");
    expect(memes[0].creator).to.equal(creator.address);
  });

  it("lets a buyer purchase tokens on the curve and price increases with buys", async function () {
    const { creator, buyer, usdc, factory, launchFee } = await deployFixture();

    await usdc.connect(creator).approve(await factory.getAddress(), launchFee);
    await factory.connect(creator).launchMeme("Arc Frog", "ARCFROG", "ipfs://example");
    const [meme] = await factory.getMemes(0, 1);

    const curve = await ethers.getContractAt("BondingCurve", meme.curve);
    const token = await ethers.getContractAt("MemeToken", meme.token);

    const priceBefore = await curve.spotPriceUsdcPerToken();

    const buyAmount = ethers.parseUnits("50", 6);
    await usdc.connect(buyer).approve(meme.curve, buyAmount);
    await curve.connect(buyer).buy(buyAmount, 0);

    const priceAfter = await curve.spotPriceUsdcPerToken();
    expect(priceAfter).to.be.gt(priceBefore);
    expect(await token.balanceOf(buyer.address)).to.be.gt(0n);
  });

  it("lets a holder sell tokens back for USDC", async function () {
    const { creator, buyer, usdc, factory, launchFee } = await deployFixture();

    await usdc.connect(creator).approve(await factory.getAddress(), launchFee);
    await factory.connect(creator).launchMeme("Arc Frog", "ARCFROG", "ipfs://example");
    const [meme] = await factory.getMemes(0, 1);

    const curve = await ethers.getContractAt("BondingCurve", meme.curve);
    const token = await ethers.getContractAt("MemeToken", meme.token);

    const buyAmount = ethers.parseUnits("50", 6);
    await usdc.connect(buyer).approve(meme.curve, buyAmount);
    await curve.connect(buyer).buy(buyAmount, 0);

    const tokenBalance = await token.balanceOf(buyer.address);
    const usdcBefore = await usdc.balanceOf(buyer.address);

    await token.connect(buyer).approve(meme.curve, tokenBalance);
    await curve.connect(buyer).sell(tokenBalance, 0);

    const usdcAfter = await usdc.balanceOf(buyer.address);
    expect(usdcAfter).to.be.gt(usdcBefore);
    expect(await token.balanceOf(buyer.address)).to.equal(0n);
  });
});
