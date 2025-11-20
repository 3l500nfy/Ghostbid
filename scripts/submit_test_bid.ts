import { ethers } from 'hardhat';

async function main() {
    const [seller, bidder] = await ethers.getSigners();

    console.log('🎯 Submitting test bid to auction #8');
    console.log('Seller:', seller.address);
    console.log('Bidder:', bidder.address);

    const auctionAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const auction = await ethers.getContractAt('EncryptedAuction', auctionAddress);

    const auctionId = 8; // Using active auction
    const bidAmount = '0.002'; // ETH

    // Generate mock ciphertext (simulating what the frontend does)
    const amountWei = ethers.parseUnits(bidAmount, 18);
    const seed = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'address'],
        [amountWei, bidder.address, auctionAddress]
    );
    const ciphertext = seed;

    // Generate mock proof
    const proofSeed = ethers.solidityPackedKeccak256(['bytes32', 'string'], [seed, 'proof']);
    let proof = '0x';
    for (let i = 0; i < 8; i++) {
        const chunk = ethers.solidityPackedKeccak256(['bytes32', 'uint256'], [proofSeed, i]);
        proof += chunk.slice(2);
    }

    // Create commitment
    const salt = 'my-test-bid-123';
    const commitment = ethers.keccak256(
        ethers.concat([ethers.getBytes(ciphertext), ethers.toUtf8Bytes(salt)])
    );

    console.log('\n📝 Bid Details:');
    console.log('Amount:', bidAmount, 'ETH');
    console.log('Ciphertext:', ciphertext);
    console.log('Commitment:', commitment);
    console.log('Deposit: 0.02 ETH');

    console.log('\n🔄 Submitting transaction...');
    const tx = await auction.connect(bidder).submitEncryptedBid(
        auctionId,
        ciphertext,
        proof,
        commitment,
        { value: ethers.parseEther('0.02') }
    );

    console.log('Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('\n✅ Bid submitted successfully!');
    console.log('Block:', receipt?.blockNumber);
    console.log('\n🎉 Check the Audit panel at http://localhost:5173/auction/2');
    console.log('You should see the encrypted bid appear!');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
