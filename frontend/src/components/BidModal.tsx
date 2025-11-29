import { useState } from 'react';
import { ethers } from 'ethers';
import { useZama } from '../hooks/useZama';
import { useAuctionContract } from '../hooks/useAuctionContract';
import { getAuctionAddress } from '../config/contracts';

interface BidModalProps {
  auctionId?: string;
}

const BidModal = ({ auctionId }: BidModalProps) => {
  const [amount, setAmount] = useState('');
  const [salt, setSalt] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const { encryptBid } = useZama();
  const { submitEncryptedBid } = useAuctionContract();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!auctionId) {
        throw new Error('Auction ID is missing');
      }
      setStatus('Encrypting bid on FHE...');
      const ciphertext = await encryptBid(amount, getAuctionAddress());
      setStatus('Sending encrypted bid to contract...');
      await submitEncryptedBid({
        ciphertext: ciphertext.ciphertext,
        proof: ciphertext.proof,
        salt,
        depositWei: ethers.parseEther('0.02').toString(),
        auctionId: BigInt(auctionId)
      });
      setStatus('Encrypted bid submitted. wait for Finalization...');
      setAmount('');
      setSalt('');
    } catch (error: any) {
      console.error('Bid submission error:', error);

      // Check for specific error codes
      const errorData = error?.data || '';

      // AuctionClosed error code: 0x36b6b46d
      if (errorData === '0x36b6b46d' || error?.message?.includes('0x36b6b46d')) {
        setStatus('❌ Auction is closed - Time is up!');
        return;
      }

      // BidLimitReached error code: 0x208f4eee
      if (errorData === '0x208f4eee' || error?.message?.includes('0x208f4eee')) {
        setStatus('❌ Bid limit reached - Auction is full!');
        return;
      }

      // DepositTooLow error code: 0x2f4ca851
      if (errorData === '0x2f4ca851' || error?.message?.includes('0x2f4ca851')) {
        setStatus('❌ Deposit too low - Please increase your deposit!');
        return;
      }

      // Generic error
      const errorMessage = error?.reason || error?.message || error?.toString() || 'Unknown error';
      setStatus(`Failed to submit encrypted bid: ${errorMessage}`);
    }
  };

  return (
    <form className="mt-6 space-y-4 text-white" onSubmit={handleSubmit}>
      <label className="block text-xs font-semibold uppercase text-slate-300">
        Bid amount (ETH)
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.5"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
          required
        />
      </label>
      <label className="block text-xs font-semibold uppercase text-slate-300">
        Salt / secret phrase
        <input
          value={salt}
          onChange={(event) => setSalt(event.target.value)}
          placeholder="unique secret"
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white"
          required
        />
      </label>
      <button type="submit" className="w-full rounded-2xl bg-emerald-500 py-3 text-sm font-semibold uppercase text-slate-950">
        Submit Encrypted Bid
      </button>
      {status && <p className="text-xs text-slate-400">{status}</p>}
    </form>
  );
};

export default BidModal;

