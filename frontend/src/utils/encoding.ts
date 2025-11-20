import { parseEther } from 'ethers';

interface AuctionForm {
  nftContract: string;
  tokenId: string;
  reservePrice: string;
  startTime: string;
  endTime: string;
  maxBidders: number | string;
}

export const encodeAuctionParams = (form: AuctionForm) => {
  return {
    nftContract: form.nftContract,
    tokenId: BigInt(form.tokenId),
    reservePriceWei: parseEther(form.reservePrice || '0'),
    startTime: BigInt(Math.floor(new Date(form.startTime).getTime() / 1000)),
    endTime: BigInt(Math.floor(new Date(form.endTime).getTime() / 1000)),
    maxBidders: Number(form.maxBidders)
  };
};

