import { useCallback } from 'react';
import { ethers } from 'ethers';
import auctionAbi from '../utils/abis/EncryptedAuction.json';
import managerAbi from '../utils/abis/AuctionManager.json';
import { contractConfig, getAuctionAddress, getManagerAddress } from '../config/contracts';

interface AuctionParams {
  nftContract: string;
  tokenId: bigint;
  reservePriceWei: bigint;
  startTime: bigint;
  endTime: bigint;
  maxBidders: number;
}

interface EncryptedBidInput {
  ciphertext: string;
  proof: string;
  salt: string;
  depositWei: string;
  auctionId: bigint;
}

export const useAuctionContract = () => {
  const getReadProvider = () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    if (contractConfig.rpcUrl) {
      return new ethers.JsonRpcProvider(contractConfig.rpcUrl);
    }
    throw new Error('No RPC provider configured. Set VITE_RPC_URL or connect a wallet.');
  };

  const getSigner = async () => {
    if (typeof window === 'undefined' || (window as any).ethereum == null) {
      throw new Error('A browser wallet (MetaMask, WalletConnect, etc.) is required for write operations.');
    }
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    return provider.getSigner();
  };

  const createAuction = useCallback(async (params: AuctionParams): Promise<string> => {
    const signer = await getSigner();
    const managerAddress = getManagerAddress();
    const contract = new ethers.Contract(managerAddress, managerAbi.abi, signer);
    const tx = await contract.createAuction(
      params.nftContract,
      params.tokenId,
      params.startTime,
      params.endTime,
      params.maxBidders,
      params.reservePriceWei
    );
    const receipt = await tx.wait();

    // Extract auction ID from AuctionCreated event
    const event = receipt?.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsedLog: any) => parsedLog?.name === 'AuctionCreated');

    const auctionId = event?.args?.auctionId?.toString() || '1';
    return auctionId;
  }, []);

  const submitEncryptedBid = useCallback(
    async ({ ciphertext, proof, salt, depositWei, auctionId }: EncryptedBidInput) => {
      const signer = await getSigner();
      const auctionAddress = getAuctionAddress();
      const contract = new ethers.Contract(auctionAddress, auctionAbi.abi, signer);
      const commitment = ethers.keccak256(ethers.concat([ethers.getBytes(ciphertext), ethers.toUtf8Bytes(salt)]));
      const tx = await contract.submitEncryptedBid(auctionId, ciphertext, proof, commitment, {
        value: depositWei
      });
      await tx.wait();
    },
    []
  );

  const finalizeAuction = useCallback(async (auctionId: bigint) => {
    const signer = await getSigner();
    const auctionAddress = getAuctionAddress();
    const contract = new ethers.Contract(auctionAddress, auctionAbi.abi, signer);
    const tx = await contract.finalizeAuctionWithAdapter(auctionId);
    await tx.wait();
  }, []);

  const getAuctionReader = async () => {
    const provider = await getReadProvider();
    const auctionAddress = getAuctionAddress();
    return new ethers.Contract(auctionAddress, auctionAbi.abi, provider);
  };

  return { createAuction, submitEncryptedBid, finalizeAuction, getAuctionReader };
};

