import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { getManagerAddress } from '../config/contracts';
import managerAbi from '../../../deployments/sepolia/AuctionManager.json';

interface AuctionInfo {
    id: number;
    seller: string;
    nftContract: string;
    tokenId: bigint;
    startTime: bigint;
    endTime: bigint;
    maxBidders: number;
    minDepositWei: bigint;
}

const Auctions = () => {
    const [auctions, setAuctions] = useState<AuctionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL || 'http://localhost:8545');
                const managerContract = new ethers.Contract(getManagerAddress(), managerAbi.abi, provider);

                // Instead of fetching events (which requires large block ranges),
                // we'll try sequential auction IDs starting from 1
                // This reads directly from contract storage, no event logs needed!

                const fetchedAuctions: AuctionInfo[] = [];
                const maxAuctionsToCheck = 50; // Check up to 50 auction IDs

                for (let id = 1; id <= maxAuctionsToCheck; id++) {
                    try {
                        const auctionData = await managerContract.getAuction(id);

                        // If seller is zero address, auction doesn't exist
                        if (auctionData.seller === ethers.ZeroAddress) {
                            // No more auctions after this ID
                            break;
                        }

                        fetchedAuctions.push({
                            id: id,
                            seller: auctionData.seller,
                            nftContract: auctionData.nftContract,
                            tokenId: auctionData.tokenId,
                            startTime: auctionData.startTime,
                            endTime: auctionData.endTime,
                            maxBidders: auctionData.maxBidders,
                            minDepositWei: auctionData.minDepositWei
                        });
                    } catch (err) {
                        // Auction doesn't exist or error reading it, skip
                        console.log(`Auction ${id} not found or error:`, err);
                        break;
                    }
                }

                // Filter to only show ongoing auctions (not ended yet)
                const now = Math.floor(Date.now() / 1000);
                const ongoingAuctions = fetchedAuctions.filter(
                    auction => Number(auction.endTime) > now
                );

                setAuctions(ongoingAuctions.reverse()); // Show newest first
            } catch (err: any) {
                console.error('Error fetching auctions:', err);
                setError(err.message || 'Failed to load auctions');
            } finally {
                setLoading(false);
            }
        };

        fetchAuctions();
    }, []);

    const formatTime = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString();
    };

    const getTimeRemaining = (endTime: bigint) => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = Number(endTime) - now;

        if (remaining <= 0) return 'Ended';

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m`;
    };

    return (
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-16">
            <header className="flex flex-col gap-2">
                <Link to="/" className="mb-2 inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                    ← Back to Home
                </Link>
                <p className="text-xs uppercase tracking-[0.6em] text-emerald-400">Browse</p>
                <h1 className="text-3xl font-semibold text-white">Ongoing Auctions</h1>
                <p className="text-slate-400">Explore active sealed-bid auctions with encrypted bids</p>
            </header>

            {loading ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                    <p className="text-slate-400">Loading auctions...</p>
                </div>
            ) : error ? (
                <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-12 text-center backdrop-blur-xl">
                    <p className="text-red-400">Error: {error}</p>
                </div>
            ) : auctions.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                    <p className="text-lg text-slate-400 mb-4">No ongoing auctions found</p>
                    <Link
                        to="/create"
                        className="inline-block rounded-full bg-emerald-500/90 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
                    >
                        Create First Auction
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {auctions.map((auction) => (
                        <Link
                            key={auction.id}
                            to={`/auction/${auction.id}`}
                            className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-emerald-500/30 hover:bg-emerald-500/5"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">Auction #{auction.id}</p>
                                    <h3 className="text-xl font-semibold text-white mt-1">
                                        {auction.nftContract === ethers.ZeroAddress
                                            ? 'Demo Auction'
                                            : `NFT #${auction.tokenId.toString()}`}
                                    </h3>
                                </div>
                                <span className="rounded-full border border-emerald-400/60 px-3 py-1 text-xs text-emerald-200">
                                    {getTimeRemaining(auction.endTime)}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-300">
                                    <span>Seller:</span>
                                    <span className="font-mono text-xs">{auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Max Bidders:</span>
                                    <span>{auction.maxBidders}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Min Deposit:</span>
                                    <span>{ethers.formatEther(auction.minDepositWei)} ETH</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Ends:</span>
                                    <span className="text-xs">{formatTime(auction.endTime)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/10">
                                <span className="text-sm text-emerald-400 group-hover:text-emerald-300 transition">
                                    View Auction →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
};

export default Auctions;
