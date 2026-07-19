const hre = require("hardhat");

// USDC on Arc — update this to the correct Arc testnet USDC address before deploying.
const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
const LAUNCH_FEE = process.env.LAUNCH_FEE || "1000000"; // 1 USDC (6 decimals) default
const FEE_RECIPIENT = process.env.FEE_RECIPIENT; // defaults to deployer if unset

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const feeRecipient = FEE_RECIPIENT || deployer.address;

  const MemeFactory = await hre.ethers.getContractFactory("MemeFactory");
  const factory = await MemeFactory.deploy(USDC_ADDRESS, LAUNCH_FEE, feeRecipient);
  await factory.waitForDeployment();

  console.log("MemeFactory deployed to:", await factory.getAddress());
  console.log("USDC:", USDC_ADDRESS);
  console.log("Launch fee:", LAUNCH_FEE);
  console.log("Fee recipient:", feeRecipient);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
