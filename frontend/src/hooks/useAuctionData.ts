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

                setAuctionData({
                    seller: auctionMeta.seller,
                    nftContract: auctionMeta.nftContract,
                    tokenId: auctionMeta.tokenId,
                    startTime: auctionMeta.startTime,
                    endTime: auctionMeta.endTime,
                    maxBidders: auctionMeta.maxBidders,
                    minDepositWei: auctionMeta.minDepositWei
                });

                // Fetch bids from EncryptedAuction contract events
                const auctionContract = new ethers.Contract(getAuctionAddress(), auctionAbi.abi, provider);

                // Query BidSubmitted events for this auction
                const filter = auctionContract.filters.EncryptedBidSubmitted(BigInt(auctionId));
                const events = await auctionContract.queryFilter(filter);

                const fetchedBids: Bid[] = events.map((event: any) => ({
                    bidder: event.args.bidder,
                    ciphertext: event.args.encryptedBid, // Note: ABI uses 'encryptedBid' but struct uses 'ciphertext', check mapping
                    commitment: event.args.commitment
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
        const setupListener = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(contractConfig.rpcUrl || 'http://localhost:8545');
                const auctionContract = new ethers.Contract(getAuctionAddress(), auctionAbi.abi, provider);

                const filter = auctionContract.filters.EncryptedBidSubmitted(BigInt(auctionId));

                auctionContract.on(filter, (auctionIdEvent, bidIndex, bidder, encryptedBid, commitment) => {
                    setBids((prevBids) => [
                        ...prevBids,
                        {
                            bidder,
                            ciphertext: encryptedBid,
                            commitment
                        }
                    ]);
                });

                return () => {
                    auctionContract.removeAllListeners(filter);
                };
            } catch (err) {
                console.error('Error setting up bid listener:', err);
            }
        };

        setupListener();
    }, [auctionId]);

    return { auctionData, bids, loading, error };
};
