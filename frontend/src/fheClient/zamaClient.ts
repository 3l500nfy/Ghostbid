import { ethers } from 'ethers';

export interface EncryptedBidPayload {
  ciphertext: `0x${string}`;
  proof: `0x${string}`;
  account: string;
}

let instancePromise: Promise<any> | null = null;

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
  if (!instancePromise) {
    instancePromise = (async () => {
      try {
        console.log('🔧 Initializing Zama SDK with SepoliaConfig (from working samples)...');

        // Use /bundle import like working sample projects
        const { initSDK, createInstance, SepoliaConfig } = await import('@zama-fhe/relayer-sdk/bundle');

        console.log('✅ SDK bundle imported');
        await initSDK();
        console.log('✅ WASM loaded');

        // Use SepoliaConfig which contains the public key internally!
        const config = {
          ...SepoliaConfig,
          network: (window as any).ethereum
        };

        const instance = await createInstance(config);

        console.log('✅ Zama FHE instance created with SepoliaConfig!');
        return instance;
      } catch (error) {
        console.error('❌ Failed to initialize:', error);
        throw error;
      }
    })();
  }
  return instancePromise;
};

export const encryptBid = async (amountEth: string, contractAddress: string): Promise<EncryptedBidPayload> => {
  const instance = await initZamaClient();
  const account = await requestAccount();

  console.log('🔐 Encrypting bid with real FHE...');
  const input = instance.createEncryptedInput(contractAddress, account);
  input.add64(ethers.parseUnits(amountEth, 18));
  const encrypted = await input.encrypt();

  const ciphertext = ethers.hexlify(encrypted.handles[0]) as `0x${string}`;
  const proof = ethers.hexlify(encrypted.inputProof) as `0x${string}`;

  console.log('✅ Real FHE encryption successful!');

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
