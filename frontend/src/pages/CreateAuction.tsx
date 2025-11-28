import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuctionContract } from '../hooks/useAuctionContract';
import { encodeAuctionParams } from '../utils/encoding';

const initialForm = {
  nftContract: '',
  tokenId: '',
  reservePrice: '',
  startTime: '',
  endTime: '',
  maxBidders: ''
};

const CreateAuction = () => {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const { createAuction } = useAuctionContract();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      // Validate times
      const startDate = new Date(form.startTime);
      const endDate = new Date(form.endTime);

      if (startDate >= endDate) {
        setStatus('Error: End time must be after start time');
        return;
      }

      setStatus('Submitting transaction...');
      setAuctionId(null);
      const params = encodeAuctionParams(form);
      const id = await createAuction(params);
      setAuctionId(id);
      setStatus('Auction deployed successfully.');
      setForm(initialForm);
    } catch (error: any) {
      console.error('Auction creation failed:', error);
      const errorMessage = error?.reason || error?.message || JSON.stringify(error);
      setStatus(`Failed to deploy auction: ${errorMessage}`);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-16">
      <header>
        <Link to="/" className="mb-4 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
          &larr; Back to Home
        </Link>
        <h1 className="text-3xl font-semibold text-white">Create Encrypted Auction</h1>
        <p className="text-slate-400">
          Define NFT, timings, and bidder caps. All bids submitted later will be encrypted.
        </p>
      </header>

      <form className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold uppercase text-slate-300">
          NFT Contract
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="nftContract"
            value={form.nftContract}
            onChange={(event) => setForm({ ...form, nftContract: event.target.value })}
            placeholder="0x..."
            required
          />
        </label>
        <label className="block text-sm font-semibold uppercase text-slate-300">
          Token ID
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="tokenId"
            value={form.tokenId}
            onChange={(event) => setForm({ ...form, tokenId: event.target.value })}
            placeholder="1"
            required
          />
        </label>
        <label className="block text-sm font-semibold uppercase text-slate-300">
          Reserve Price (ETH)
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="reservePrice"
            value={form.reservePrice}
            onChange={(event) => setForm({ ...form, reservePrice: event.target.value })}
            placeholder="0.1"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold uppercase text-slate-300">
            Start Time (UTC)
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              name="startTime"
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              required
            />
          </label>
          <label className="block text-sm font-semibold uppercase text-slate-300">
            End Time (UTC)
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
              name="endTime"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              required
            />
          </label>
        </div>
        <label className="block text-sm font-semibold uppercase text-slate-300">
          Max Bidders
          <input
            type="number"
            min={2}
            max={16}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white"
            name="maxBidders"
            value={form.maxBidders}
            onChange={(event) => setForm({ ...form, maxBidders: event.target.value })}
            placeholder="4"
            required
          />
        </label>
        <button
          className="w-full rounded-2xl bg-emerald-500 py-3 text-center text-sm font-semibold uppercase tracking-wide text-slate-950 hover:bg-emerald-400"
          type="submit"
        >
          Deploy Auction
        </button>
        {status && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-300">{status}</p>
            {status.includes('successfully') && auctionId && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-emerald-400">Auction ID: #{auctionId}</p>
                <div className="flex justify-center gap-2">
                  <Link
                    to={`/auction/${auctionId}`}
                    className="inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    View Auction
                  </Link>
                  <Link
                    to="/"
                    className="inline-block rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </main>
  );
};

export default CreateAuction;

