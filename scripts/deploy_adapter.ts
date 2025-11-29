import { ethers } from "hardhat";

async function main() {
    console.log("Deploying ZamaMaxAdapter...");

    const ZamaMaxAdapter = await ethers.getContractFactory("ZamaMaxAdapter");
    const adapter = await ZamaMaxAdapter.deploy(100);
    await adapter.waitForDeployment();

    const address = await adapter.getAddress();
    console.log("ZamaMaxAdapter deployed to:", address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
