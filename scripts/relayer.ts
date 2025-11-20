import { config } from 'dotenv';
import { ethers } from 'ethers';

config();

const { RPC_URL, PRIVATE_KEY, AUCTION_CONTRACT, AUCTION_ID } = process.env;

const main = async () => {
  if (!RPC_URL || !PRIVATE_KEY || !AUCTION_CONTRACT) {
    throw new Error('Missing RPC_URL, PRIVATE_KEY, or AUCTION_CONTRACT');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(
    AUCTION_CONTRACT,
    [
      'function finalizeAuctionWithAdapter(uint256)',
      'function getWinnerCiphertext(uint256) view returns (bytes)',
      'function getBidCount(uint256) view returns (uint256)'
    ],
    signer
  );

  const auctionId = BigInt(AUCTION_ID ?? '1');
  const bidCount = await auction.getBidCount(auctionId);
  if (bidCount === 0n) {
    throw new Error('No bids were found for this auction.');
  }

  console.log(`Finalizing auction ${auctionId} via on-chain adapter...`);
  const tx = await auction.finalizeAuctionWithAdapter(auctionId);
  await tx.wait();
  const winnerCiphertext = await auction.getWinnerCiphertext(auctionId);
  console.log('Winner ciphertext handle:', winnerCiphertext);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

