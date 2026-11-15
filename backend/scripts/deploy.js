const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=========================================");
  console.log("   Deploying EVoting Smart Contract      ");
  console.log("=========================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer Account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Account Balance:  ${hre.ethers.formatEther(balance)} ETH`);

  const EVotingFactory = await hre.ethers.getContractFactory("EVoting");
  const evoting = await EVotingFactory.deploy();
  await evoting.waitForDeployment();

  const contractAddress = await evoting.getAddress();
  console.log(`\n>>> EVoting Contract deployed at: ${contractAddress}`);

  // Fetch Contract Artifact for ABI
  const artifact = await hre.artifacts.readArtifact("EVoting");

  const contractData = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    admin: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Ensure frontend contracts directory exists
  const frontendDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  // Export to frontend
  const frontendPath = path.join(frontendDir, "EVoting.json");
  fs.writeFileSync(frontendPath, JSON.stringify(contractData, null, 2));
  console.log(`>>> Exported contract ABI and address to: ${frontendPath}`);

  // Save copy in backend
  const backendPath = path.join(__dirname, "../deployed-address.json");
  fs.writeFileSync(backendPath, JSON.stringify(contractData, null, 2));
  console.log(`>>> Saved backend deployment record to: ${backendPath}`);

  console.log("=========================================");
  console.log("   Deployment Completed Successfully!    ");
  console.log("=========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
