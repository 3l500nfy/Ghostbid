import { config } from 'dotenv';
import { ethers } from 'ethers';

config();

const RPC_URL = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const AUCTION_CONTRACT = process.env.AUCTION_CONTRACT as string;

const main = async () => {
  if (!RPC_URL || !PRIVATE_KEY || !AUCTION_CONTRACT) {
    throw new Error('Missing env vars for finalize script');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(
    AUCTION_CONTRACT,
    [
      'function finalizeAuctionWithAdapter(uint256)',
      'function getWinnerCiphertext(uint256) view returns (bytes)'
    ],
    signer
  );

  const auctionId = Number(process.env.AUCTION_ID ?? '1');
  console.log(`Finalizing auction ${auctionId}...`);
  const tx = await auction.finalizeAuctionWithAdapter(auctionId);
  await tx.wait();

  const ciphertext = await auction.getWinnerCiphertext(auctionId);
  console.log('Winner ciphertext:', ciphertext);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

