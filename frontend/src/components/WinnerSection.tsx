import { useState } from 'react';
import { useAuctionContract } from '../hooks/useAuctionContract';

interface WinnerSectionProps {
  auctionId?: string;
  auctionData?: {
    endTime: bigint;
    finalized: boolean;
  };
  winnerCiphertext?: string;
}

const WinnerSection = ({ auctionId, auctionData, winnerCiphertext }: WinnerSectionProps) => {
  const { finalizeAuction } = useAuctionContract();
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuctionEnded = auctionData ? Date.now() / 1000 > Number(auctionData.endTime) : false;
  const canFinalize = isAuctionEnded && !auctionData?.finalized && auctionId;

  const handleFinalize = async () => {
    if (!auctionId) return;

    try {
      setFinalizing(true);
      setError(null);
      await finalizeAuction(BigInt(auctionId));
      // The UI will update automatically via the event listener
    } catch (err: any) {
      console.error('Finalization failed:', err);
      setError(err?.reason || err?.message || 'Failed to finalize auction');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-white backdrop-blur-xl">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Encrypted winner</p>
          <h2 className="text-xl font-semibold text-white">
            {auctionData?.finalized ? 'Winner Determined (Encrypted)' : 'Waiting for finalization'}
          </h2>
        </div>
        <span className="rounded-full border border-emerald-400/60 px-3 py-1 text-xs text-emerald-200">FHE locked</span>
      </header>

      {winnerCiphertext && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-black/40 px-4 py-3">
          <p className="text-xs text-emerald-300 mb-2">Winner Ciphertext:</p>
          <p className="font-mono text-xs text-emerald-200 break-all">{winnerCiphertext}</p>
        </div>
      )}

      {!auctionData?.finalized && (
        <p className="mt-4 text-sm text-emerald-100">
          {canFinalize
            ? 'Auction has ended. Initiate FHE encryption then Click below to compute the encrypted winner using FHE.  Once finalized, the winner ciphertext will be pinned here. Only the winner can optionally reveal their amount using a signed proof.'
            : isAuctionEnded
              ? 'Auction has ended. Waiting for finalization...'
              : 'Once the auction ends and is finalized, the winner ciphertext will be pinned here. Only the winner can optionally reveal their amount using a signed proof.'}
        </p>
      )}

      {canFinalize && (
        <div className="space-y-3">
          <button
            onClick={handleFinalize}
            disabled={finalizing}
            className="mt-4 w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-semibold uppercase tracking-wide text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {finalizing ? 'Computing Winner...' : 'Finalize Auction'}
          </button>

          {/* Temporary button to fix AdapterNotSet error */}
          <button
            onClick={async () => {
              try {
                setFinalizing(true);
                const { ethers } = await import('ethers');
                const { getAuctionAddress } = await import('../config/contracts');
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(
                  getAuctionAddress(),
                  ['function setFHEAdapter(uint256 auctionId, address adapter) external'],
                  signer
                );
                // TODO: Replace this hardcoded adapter address with an environment variable
                const tx = await contract.setFHEAdapter(BigInt(auctionId!), '0x28eF8163933E97316f6232e8D0401570de99713e');
                await tx.wait();
                alert('Adapter set successfully! Now try finalizing.');
              } catch (err: any) {
                console.error(err);
                alert('Failed to set adapter: ' + (err.reason || err.message));
              } finally {
                setFinalizing(false);
              }
            }}
            className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            🛠️ Initiate FHE Encryption Adapter
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </section>
  );
};

export default WinnerSection;
