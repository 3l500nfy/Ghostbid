import { ethers } from 'hardhat';

async function main() {
    const [bidder1, bidder2] = await ethers.getSigners();

    const auctionAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const auction = await ethers.getContractAt('EncryptedAuction', auctionAddress);

    const auctionId = 2; // Using newly created auction

    // Mock ciphertext (32 bytes)
    const ciphertext = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    // Mock proof (256 bytes)
    let proof = '0x';
    for (let i = 0; i < 8; i++) {
        proof += '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    }

    // Create commitment
    const salt = 'test-salt-123';
    const commitment = ethers.keccak256(
        ethers.concat([ethers.getBytes(ciphertext), ethers.toUtf8Bytes(salt)])
    );

    console.log('Submitting test bid...');
    console.log('Auction ID:', auctionId);
    console.log('Bidder:', bidder2.address);
    console.log('Ciphertext:', ciphertext);
    console.log('Commitment:', commitment);

    const tx = await auction.connect(bidder2).submitEncryptedBid(
        auctionId,
        ciphertext,
        proof,
        commitment,
        { value: ethers.parseEther('0.02') }
    );

    const receipt = await tx.wait();
    console.log('✅ Bid submitted successfully!');
    console.log('Transaction hash:', receipt?.hash);
    console.log('Block:', receipt?.blockNumber);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
