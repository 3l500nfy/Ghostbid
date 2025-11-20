import { useParams, Link } from 'react-router-dom';
import AuctionCard from '../components/AuctionCard';
import BidModal from '../components/BidModal';
import EncryptedBidViewer from '../components/EncryptedBidViewer';
import WinnerSection from '../components/WinnerSection';
import { CountdownTimer } from '../components/CountdownTimer';
import { useAuctionData } from '../hooks/useAuctionData';

const ViewAuction = () => {
  const { auctionId } = useParams();
  const { auctionData } = useAuctionData(auctionId);

  // Convert endTime to milliseconds for CountdownTimer
  const endTimestamp = auctionData ? Number(auctionData.endTime) * 1000 : Date.now() + 1000 * 60 * 60;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2">
        <Link to="/" className="mb-2 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
          &larr; Back to Home
        </Link>
        <p className="text-xs uppercase tracking-[0.6em] text-emerald-400">Auction</p>
        <h1 className="text-3xl font-semibold text-white">Encrypted Auction #{auctionId}</h1>
        <p className="text-slate-400">All bids below are encrypted and cannot be deciphered without FHE keys.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <AuctionCard auctionId={auctionId} />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <CountdownTimer endTimestamp={endTimestamp} />
          <BidModal auctionId={auctionId} />
        </div>
      </section>

      <EncryptedBidViewer auctionId={auctionId} />
      <WinnerSection />
    </main>
  );
};

export default ViewAuction;

