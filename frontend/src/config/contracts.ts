const normalizeAddress = (address: string | undefined, label: string) => {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Missing ${label} address. Set it via env variable.`);
  }
  return address as `0x${string}`;
};

export const contractConfig = {
  rpcUrl: import.meta.env.VITE_RPC_URL as string | undefined,
  auctionAddress: import.meta.env.VITE_ENCRYPTED_AUCTION as string | undefined,
  managerAddress: import.meta.env.VITE_AUCTION_MANAGER as string | undefined
};

export const getAuctionAddress = () => normalizeAddress(contractConfig.auctionAddress, 'VITE_ENCRYPTED_AUCTION');
export const getManagerAddress = () => normalizeAddress(contractConfig.managerAddress, 'VITE_AUCTION_MANAGER');

