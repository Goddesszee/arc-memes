const hre = require("hardhat");

// Usage: FACTORY_ADDRESS=0x... NEW_FEE=2000000 npx hardhat run scripts/set-launch-fee.js --network arcTestnet
// NEW_FEE is in USDC base units (6 decimals) — 2000000 = 2 USDC.
// Must be run with the deployer's PRIVATE_KEY in .env, since setLaunchFee is owner-only.

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const NEW_FEE = process.env.NEW_FEE || "2000000"; // defaults to 2 USDC

async function main() {
  if (!FACTORY_ADDRESS) {
    throw new Error("Set FACTORY_ADDRESS env var to your deployed MemeFactory address");
  }

  const [signer] = await hre.ethers.getSigners();
  console.log("Calling with:", signer.address);

  const factory = await hre.ethers.getContractAt("MemeFactory", FACTORY_ADDRESS, signer);

  const currentFee = await factory.launchFee();
  console.log("Current launch fee:", currentFee.toString());

  const tx = await factory.setLaunchFee(NEW_FEE);
  await tx.wait();

  const updatedFee = await factory.launchFee();
  console.log("New launch fee:", updatedFee.toString(), `(${Number(updatedFee) / 1_000_000} USDC)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
