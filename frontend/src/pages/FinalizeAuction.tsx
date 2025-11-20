import { useParams } from 'react-router-dom';
import FinalizePanel from '../components/FinalizePanel';
import EncryptedBidViewer from '../components/EncryptedBidViewer';

const FinalizeAuction = () => {
  const { auctionId } = useParams();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-16">
      <header>
        <p className="text-xs uppercase tracking-[0.6em] text-emerald-400">Finalize</p>
        <h1 className="text-3xl font-semibold text-white">Finalize Auction #{auctionId}</h1>
        <p className="text-slate-400">
          Trigger fhEVM comparator to compute the encrypted winner ciphertext and store it on-chain.
        </p>
      </header>
      <FinalizePanel auctionId={auctionId} />
      <EncryptedBidViewer />
    </main>
  );
};

export default FinalizeAuction;

