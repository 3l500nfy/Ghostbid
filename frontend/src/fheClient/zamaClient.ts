import { ethers } from 'ethers';
import { createInstance, initSDK, type FhevmInstance } from '@zama-fhe/relayer-sdk/web';
import { getFheConfig } from '../config/fhe';

export interface EncryptedBidPayload {
  ciphertext: `0x${string}`;
  proof: `0x${string}`;
  account: string;
}

let clientPromise: Promise<FhevmInstance> | null = null;

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
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        console.log('🔧 Initializing Zama SDK...');
        await initSDK();
        console.log('✅ Zama SDK initialized');

        const cfg = getFheConfig();
        console.log('📋 FHE Config:', {
          acl: cfg.acl,
          inputVerifier: cfg.inputVerifier,
          kms: cfg.kms,
          relayerUrl: cfg.relayerUrl,
          gatewayChainId: cfg.gatewayChainId,
          chainId: cfg.chainId
        });

        const instance = await createInstance({
          aclContractAddress: cfg.acl,
          inputVerifierContractAddress: cfg.inputVerifier,
          verifyingContractAddressInputVerification: cfg.inputVerifier,
          kmsContractAddress: cfg.kms,
          verifyingContractAddressDecryption: cfg.decryption,
          gatewayChainId: cfg.gatewayChainId,
          chainId: cfg.chainId,
          network: (window as any).ethereum
        });

        console.log('✅ Zama FHE instance created successfully!');
        return instance;
      } catch (error) {
        console.error('❌ Failed to initialize Zama client:', error);
        throw error;
      }
    })();
  }
  return clientPromise;
};

export const encryptBid = async (amountEth: string, contractAddress: string): Promise<EncryptedBidPayload> => {
  const instance = await initZamaClient();
  const account = await requestAccount();
  const input = instance.createEncryptedInput(contractAddress, account);
  input.add64(ethers.parseUnits(amountEth, 18));
  const encrypted = await input.encrypt();
  const ciphertext = ethers.hexlify(encrypted.handles[0]) as `0x${string}`;
  return {
    ciphertext,
    proof: ethers.hexlify(encrypted.inputProof) as `0x${string}`,
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

