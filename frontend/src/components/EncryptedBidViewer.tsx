import { useAuctionData } from '../hooks/useAuctionData';

interface EncryptedBidViewerProps {
  auctionId?: string;
}

const EncryptedBidViewer = ({ auctionId }: EncryptedBidViewerProps) => {
  const { bids, loading } = useAuctionData(auctionId);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-inner shadow-black/40">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">Audit panel</p>
          <h2 className="text-xl font-semibold text-white">On-chain ciphertexts</h2>
        </div>
        <span className="text-xs text-slate-400">Never decrypted</span>
      </header>
      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Loading bids...</p>
      ) : bids.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No bids submitted yet</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm text-emerald-200">
          {bids.map((bid, index) => (
            <li key={bid.commitment} className="rounded-2xl border border-white/5 bg-black/40 px-4 py-3 font-mono text-xs text-emerald-300">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400">#{index + 1}</span>
                <span className="text-xs text-slate-500">from {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}</span>
              </div>
              <div className="break-all">{bid.ciphertext}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default EncryptedBidViewer;

