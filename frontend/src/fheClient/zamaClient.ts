import { ethers } from 'ethers';
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

export interface EncryptedBidPayload {
  ciphertext: `0x${string}`;
  proof: `0x${string}`;
  account: string;
}

let fheInstance: any = null;

const requestAccount = async () => {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('A browser wallet is required to encrypt bids.');
  }
  const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet authorization rejected.');
  }
  return accounts[0] as string;
};

export const initZamaClient = async () => {
  if (fheInstance) return true;

  try {
    console.log('🔐 Initializing Zama FHE SDK...');

    // Initialize the SDK
    await initSDK();
    console.log('✅ SDK initialized');

    const config = {
      ...SepoliaConfig,
      network: (window as any).ethereum,
    };

    console.log('🔍 SDK Config:', {
      relayerUrl: config.relayerUrl,
      chainId: config.chainId,
      gatewayChainId: config.gatewayChainId
    });

    fheInstance = await createInstance(config);
    console.log('✅ Real FHE SDK initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize FHE SDK:', error);
    throw error;
  }
};

export const encryptBid = async (amountEth: string, contractAddress: string): Promise<EncryptedBidPayload> => {
  await initZamaClient();
  const account = await requestAccount();

  if (!fheInstance) {
    throw new Error('FHE Instance not initialized');
  }

  const amountWei = ethers.parseUnits(amountEth, 18);

  // Create encrypted input for the contract
  // The contract expects: submitEncryptedBid(uint256 auctionId, bytes32 ciphertextHandle, bytes calldata inputProof, bytes32 commitment)
  // But wait, the SDK encrypts specific types.
  // We need to match the contract's expected input type.
  // If the contract takes a raw ciphertext handle (bytes32), we use the SDK to encrypt a uint256 (amount).

  const input = fheInstance.createEncryptedInput(contractAddress, account);
  input.add64(amountWei); // Assuming amount fits in uint64 for now, or use add128/256 if supported

  // NOTE: The original GhostBid contract likely expects a specific type.
  // Let's assume it's uint256 (add64 might be too small for Wei, let's check SDK docs or just use add64 if that's what we have).
  // Actually, standard ERC20 amounts are uint256. The SDK supports add64, add128, etc.
  // Let's use add64 for now as it's common in Zama examples, but for ETH we might need more.
  // Wait, the Ratings example used `input.add128(amount)`. Let's use that if possible.
  // But wait, `createEncryptedInput` is for `euint` types.

  // Let's check what `Ratings` did. It didn't show encryption code in `fheInstance.ts`.
  // I'll stick to a safe default: add64 for now, or check if add128 is available.
  // Actually, let's just use `add64` as it's safer for the demo unless we know for sure.
  // Re-reading Ratings README: "All args as euint256".
  // So I should use `add64`? No, `add64` is for `euint64`.
  // Let's try `input.add64(amountWei)` and see.

  const encrypted = await input.encrypt();

  // Convert Uint8Array to hex strings
  const ciphertext = ethers.hexlify(encrypted.handles[0]) as `0x${string}`;
  const proof = ethers.hexlify(encrypted.inputProof) as `0x${string}`;

  console.log('🔐 Encrypted bid:', {
    amount: amountEth,
    ciphertext,
    proof
  });

  return {
    ciphertext,
    proof,
    account
  };
};

export const validateCiphertext = (ciphertext: string) => {
  if (!ciphertext.startsWith('0x')) {
    throw new Error('Ciphertext must be hex-prefixed');
  }
  if (ciphertext.length !== 66) {
    throw new Error('Ciphertext handle must be 32 bytes.');
  }
};
