import { config } from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_PATH = path.join(__dirname, '..', 'hh-artifacts', 'contracts');

const loadArtifact = (name: string) => {
  const artifactPath = path.join(ARTIFACTS_PATH, `${name}.sol`, `${name}.json`);
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
};

const getSigner = () => {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  if (!rpcUrl || !privateKey) {
    throw new Error('RPC_URL and PRIVATE_KEY env vars are required');
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
};

const main = async () => {
  const signer = getSigner();
  const encryptedAuctionArtifact = loadArtifact('EncryptedAuction');
  const auctionManagerArtifact = loadArtifact('AuctionManager');

  const EncryptedAuctionFactory = new ethers.ContractFactory(
    encryptedAuctionArtifact.abi,
    encryptedAuctionArtifact.bytecode,
    signer
  );

  console.log('Deploying EncryptedAuction...');
  const encryptedAuction = await EncryptedAuctionFactory.deploy();
  await encryptedAuction.waitForDeployment();
  const encryptedAuctionAddress = await encryptedAuction.getAddress();
  console.log('EncryptedAuction deployed at', encryptedAuctionAddress);

  const AuctionManagerFactory = new ethers.ContractFactory(
    auctionManagerArtifact.abi,
    auctionManagerArtifact.bytecode,
    signer
  );
  console.log('Deploying AuctionManager...');
  const auctionManager = await AuctionManagerFactory.deploy(encryptedAuctionAddress);
  await auctionManager.waitForDeployment();

  const auctionManagerAddress = await auctionManager.getAddress();
  console.log('AuctionManager deployed at', auctionManagerAddress);

  console.log('Setting EncryptedAuction manager to AuctionManager...');
  const ownershipTx = await encryptedAuction.setManager(auctionManagerAddress);
  await ownershipTx.wait();
  console.log('Manager set.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

