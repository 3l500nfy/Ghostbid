import { ethers } from "hardhat";

async function main() {
    console.log("Deploying MockERC721...");

    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const mockNFT = await MockERC721.deploy();

    await mockNFT.waitForDeployment();

    const address = await mockNFT.getAddress();
    console.log(`✅ MockERC721 deployed to: ${address}`);

    // Mint one to the deployer
    const [deployer] = await ethers.getSigners();
    console.log(`Minting NFT to ${deployer.address}...`);

    const tx = await mockNFT.mint(deployer.address);
    await tx.wait();

    console.log(`✅ Minted Token ID 1 to ${deployer.address}`);
    console.log("\nUse these details for creating an auction:");
    console.log(`NFT Contract: ${address}`);
    console.log("Token ID: 1");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
