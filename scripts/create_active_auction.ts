import { deployments, ethers } from 'hardhat';

async function main() {
    const [signer] = await ethers.getSigners();
    console.log('Creating auction that starts NOW...');

    const managerDeployment = await deployments.get('AuctionManager');
    const manager = await ethers.getContractAt('AuctionManager', managerDeployment.address);

    const nftContract = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const tokenId = 1;
    const startTime = Math.floor(Date.now() / 1000) - 60; // Started 1 minute ago
    const endTime = startTime + 7200; // Ends in 2 hours
    const maxBidders = 4;
    const reservePriceWei = ethers.parseEther('0.001');

    console.log('Start time:', new Date(startTime * 1000).toISOString());
    console.log('End time:', new Date(endTime * 1000).toISOString());

    const tx = await manager.createAuction(
        nftContract,
        tokenId,
        startTime,
        endTime,
        maxBidders,
        reservePriceWei
    );
    const receipt = await tx.wait();
    console.log('✅ Auction created in block:', receipt?.blockNumber);

    // Get auction ID from event
    const event = receipt?.logs
        .map((log: any) => {
            try {
                return manager.interface.parseLog(log);
            } catch {
                return null;
            }
        })
        .find((parsedLog: any) => parsedLog?.name === 'AuctionCreated');

    const auctionId = event?.args?.auctionId?.toString();
    console.log('Auction ID:', auctionId);
    console.log('\n🎯 Now you can submit bids to auction #' + auctionId);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
