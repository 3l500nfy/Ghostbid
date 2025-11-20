import { useState } from 'react';
import { useAuctionContract } from '../hooks/useAuctionContract';

interface FinalizePanelProps {
  auctionId?: string;
}

const FinalizePanel = ({ auctionId }: FinalizePanelProps) => {
  const [status, setStatus] = useState<string | null>(null);
  const { finalizeAuction } = useAuctionContract();

  const handleFinalize = async () => {
    try {
      if (!auctionId) {
        throw new Error('Auction ID is missing');
      }
      setStatus('Calling fhEVM comparator...');
      await finalizeAuction(BigInt(auctionId));
      setStatus('Auction finalized. Winner ciphertext stored on-chain.');
    } catch (error) {
      console.error(error);
      setStatus('Failed to finalize auction.');
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="text-xl font-semibold text-white">Finalize homomorphic computation</h2>
      <p className="mt-2 text-sm text-slate-300">
        This triggers the IFHE adapter to compute the encrypted highest bid directly inside the fhEVM runtime. No plaintext is ever emitted.
      </p>
      <button
        className="mt-6 w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold uppercase text-slate-950"
        onClick={handleFinalize}
      >
        Finalize Auction
      </button>
      {status && <p className="mt-3 text-xs text-slate-400">{status}</p>}
    </section>
  );
};

export default FinalizePanel;

