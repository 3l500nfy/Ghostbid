import { deployments, ethers } from 'hardhat';

async function main() {
    const [signer] = await ethers.getSigners();
    console.log('Signer:', signer.address);

    const managerDeployment = await deployments.get('AuctionManager');
    const manager = await ethers.getContractAt('AuctionManager', managerDeployment.address);

    console.log('AuctionManager address:', await manager.getAddress());

    const nftContract = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Dummy address
    const tokenId = 1;
    const startTime = Math.floor(Date.now() / 1000) + 60; // Starts in 1 minute
    const endTime = startTime + 3600; // Ends in 1 hour
    const maxBidders = 4;
    const reservePriceWei = ethers.parseEther('0.001');

    console.log('Creating auction with params:', {
        nftContract,
        tokenId,
        startTime,
        endTime,
        maxBidders,
        reservePriceWei
    });

    try {
        const tx = await manager.createAuction(
            nftContract,
            tokenId,
            startTime,
            endTime,
            maxBidders,
            reservePriceWei
        );
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt?.blockNumber);
    } catch (error: any) {
        console.error('Transaction failed!');
        if (error.data) {
            console.error('Error data:', error.data);
            // Try to decode custom error if possible, or just print it
        }
        console.error(error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
