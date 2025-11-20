import { ethers } from 'ethers';

export interface EncryptedBidPayload {
    ciphertext: `0x${string}`;
    proof: `0x${string}`;
    account: string;
}

/**
 * Mock FHE encryption for local testing
 * Generates realistic-looking ciphertexts without requiring Zama's FHE gateway
 * 
 * NOTE: This is for LOCAL TESTING ONLY. For production, use real Zama FHE SDK.
 */
export const mockEncryptBid = async (amountEth: string, contractAddress: string): Promise<EncryptedBidPayload> => {
    // Request account from wallet
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('A browser wallet is required to encrypt bids.');
    }
    const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
        throw new Error('Wallet authorization rejected.');
    }
    const account = accounts[0] as string;

    // Convert amount to wei
    const amountWei = ethers.parseUnits(amountEth, 18);

    // Generate a deterministic but unique ciphertext based on:
    // - amount (so same amount = same ciphertext for testing)
    // - account (so different users get different ciphertexts)
    // - contract address (for additional uniqueness)
    const seed = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'address'],
        [amountWei, account, contractAddress]
    );

    // Create a 32-byte ciphertext handle (realistic format)
    const ciphertext = seed as `0x${string}`;

    // Generate a mock proof (256 bytes like real FHE proofs)
    const proofSeed = ethers.solidityPackedKeccak256(
        ['bytes32', 'string'],
        [seed, 'proof']
    );

    // Expand to 256 bytes by repeating the hash
    let proof = '0x';
    for (let i = 0; i < 8; i++) {
        const chunk = ethers.solidityPackedKeccak256(['bytes32', 'uint256'], [proofSeed, i]);
        proof += chunk.slice(2); // Remove '0x' prefix
    }

    console.log('🔒 Mock FHE Encryption (Local Testing Only)');
    console.log('   Amount:', amountEth, 'ETH');
    console.log('   Ciphertext:', ciphertext);
    console.log('   Account:', account);

    return {
        ciphertext,
        proof: proof as `0x${string}`,
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
