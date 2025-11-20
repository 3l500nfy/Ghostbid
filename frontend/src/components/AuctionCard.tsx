import { ethers } from 'ethers';
import { useAuctionData } from '../hooks/useAuctionData';

interface AuctionCardProps {
  auctionId?: string;
}

const AuctionCard = ({ auctionId }: AuctionCardProps) => {
  const { auctionData, loading } = useAuctionData(auctionId);

  if (loading) {
    return (
      <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900 to-black p-6 text-white shadow-2xl shadow-emerald-500/10 backdrop-blur">
        <p className="text-sm text-slate-400">Loading auction data...</p>
      </article>
    );
  }

  if (!auctionData) {
    return (
      <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900 to-black p-6 text-white shadow-2xl shadow-emerald-500/10 backdrop-blur">
        <p className="text-sm text-slate-400">Auction not found</p>
      </article>
    );
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-slate-900 to-black p-6 text-white shadow-2xl shadow-emerald-500/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">GhostBid NFT</p>
          <h2 className="text-2xl font-semibold">Token #{auctionData.tokenId.toString()}</h2>
        </div>
        <span className="rounded-full border border-emerald-400/60 px-4 py-1 text-xs text-emerald-300">Encrypted</span>
      </div>
      <dl className="mt-6 space-y-4 text-sm text-slate-300">
        <div className="flex justify-between">
          <dt>NFT Contract</dt>
          <dd className="font-mono text-xs">{auctionData.nftContract.slice(0, 6)}...{auctionData.nftContract.slice(-4)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Reserve price</dt>
          <dd>{ethers.formatEther(auctionData.minDepositWei)} ETH</dd>
        </div>
        <div className="flex justify-between">
          <dt>Min deposit</dt>
          <dd>{ethers.formatEther(auctionData.minDepositWei)} ETH</dd>
        </div>
        <div className="flex justify-between">
          <dt>Max bidders</dt>
          <dd>{auctionData.maxBidders}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Seller</dt>
          <dd className="font-mono text-xs">{auctionData.seller.slice(0, 6)}...{auctionData.seller.slice(-4)}</dd>
        </div>
      </dl>
    </article>
  );
};

export default AuctionCard;

