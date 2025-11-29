import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import auctionAbi from '../utils/abis/EncryptedAuction.json';
import managerAbi from '../utils/abis/AuctionManager.json';
import { getAuctionAddress, getManagerAddress, contractConfig } from '../config/contracts';

interface AuctionData {
    seller: string;
    nftContract: string;
    tokenId: bigint;
    startTime: bigint;
    endTime: bigint;
    maxBidders: number;
    minDepositWei: bigint;
    finalized: boolean;
    winnerCiphertext: string;
}

interface Bid {
    bidder: string;
    ciphertext: string;
    commitment: string;
}

export const useAuctionData = (auctionId: string | undefined) => {
    const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!auctionId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const provider = new ethers.JsonRpcProvider(contractConfig.rpcUrl || 'http://localhost:8545');

                // Fetch auction metadata from AuctionManager
                const managerContract = new ethers.Contract(getManagerAddress(), managerAbi.abi, provider);
                const auctionMeta = await managerContract.getAuction(auctionId);

                // Fetch auction state from EncryptedAuction contract
                const auctionContract = new ethers.Contract(getAuctionAddress(), auctionAbi.abi, provider);

                // Check if auction is finalized by trying to get winner ciphertext
                let finalized = false;
                let winnerCiphertext = '';
                try {
                    winnerCiphertext = await auctionContract.getWinnerCiphertext(BigInt(auctionId));
                    finalized = winnerCiphertext !== ethers.ZeroHash && winnerCiphertext !== '0x';
                } catch (error) {
                    // Auction not finalized yet
                    finalized = false;
                }

                setAuctionData({
                    seller: auctionMeta.seller,
                    nftContract: auctionMeta.nftContract,
                    tokenId: auctionMeta.tokenId,
                    startTime: auctionMeta.startTime,
                    endTime: auctionMeta.endTime,
                    maxBidders: auctionMeta.maxBidders,
                    minDepositWei: auctionMeta.minDepositWei,
                    finalized: finalized,
                    winnerCiphertext: winnerCiphertext
                });

                // Fetch bids from EncryptedAuction contract events
                // Reuse auctionContract from above

                // Query BidSubmitted events for this auction
                const filter = auctionContract.filters.EncryptedBidSubmitted(BigInt(auctionId));

                // Get current block and query from a very small range
                // Alchemy free tier strictly limits to 10 blocks per request
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = Math.max(0, currentBlock - 10);
                const events = await auctionContract.queryFilter(filter, fromBlock, 'latest');

                const fetchedBids: Bid[] = await Promise.all(events.map(async (event: any) => {
                    const bidIndex = event.args.bidIndex;
                    const bidData = await auctionContract.auctionBids(auctionId, bidIndex);
                    return {
                        bidder: bidData.bidder,
                        ciphertext: bidData.ciphertext,
                        commitment: bidData.commitment
                    };
                }));

                setBids(fetchedBids);
                setError(null);
            } catch (err: any) {
                console.error('Error fetching auction data:', err);
                setError(err.message || 'Failed to fetch auction data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Set up event listener for new bids
        let cleanup: (() => void) | undefined;

        const setupListener = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(contractConfig.rpcUrl || 'http://localhost:8545');
                const auctionContract = new ethers.Contract(getAuctionAddress(), auctionAbi.abi, provider);

                const filter = auctionContract.filters.EncryptedBidSubmitted(BigInt(auctionId));

                const handleBidEvent = async (...args: any[]) => {
                    try {
                        const event = args[args.length - 1];
                        console.log('🔔 New bid event received:', event);

                        // EncryptedBidSubmitted(uint256 indexed auctionId, uint256 indexed bidIndex, address indexed bidder)
                        const bidIndex = event.args[1];

                        const bidData = await auctionContract.auctionBids(BigInt(auctionId), BigInt(bidIndex));
                        console.log('📦 Fetched bid data:', bidData);

                        // Use bidIndex to prevent duplicates
                        setBids((prevBids) => {
                            // Check if this bid index already exists
                            const bidKey = `${auctionId}-${bidIndex}`;
                            const exists = prevBids.some(
                                (bid) => bid.commitment === bidData.commitment
                            );

                            if (exists) {
                                console.log('⚠️ Bid already exists, skipping duplicate');
                                return prevBids;
                            }

                            return [
                                ...prevBids,
                                {
                                    bidder: bidData.bidder,
                                    ciphertext: bidData.ciphertext,
                                    commitment: bidData.commitment
                                }
                            ];
                        });
                    } catch (error) {
                        console.error('Error fetching new bid details:', error);
                    }
                };

                auctionContract.on(filter, handleBidEvent);

                cleanup = () => {
                    console.log('🧹 Cleaning up event listener');
                    auctionContract.off(filter, handleBidEvent);
                };
            } catch (err) {
                console.error('Error setting up bid listener:', err);
            }
        };

        setupListener();

        // Cleanup function
        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [auctionId]);

    return { auctionData, bids, loading, error };
};
