import { useEffect, useState } from 'react';
import { encryptBid as encryptBidRaw, initZamaClient, validateCiphertext } from '../fheClient/zamaClient';

/**
 * Zama FHE Hook - Real FHE encryption for production (Vercel)
 * 
 * Vercel is configured with proper CORS headers to enable SharedArrayBuffer
 */
export const useZama = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔐 Initializing Zama FHE SDK...');
    initZamaClient()
      .then(() => {
        setReady(true);
        console.log('✅ Zama FHE SDK ready!');
      })
      .catch((err) => {
        console.error('❌ Failed to initialize Zama SDK:', err);
        setError('Failed to initialize Zama SDK');
      });
  }, []);

  const encryptBid = async (amountEth: string, contractAddress: string) => {
    if (!ready) {
      throw new Error('Zama client not ready');
    }
    const payload = await encryptBidRaw(amountEth, contractAddress);
    validateCiphertext(payload.ciphertext);
    return payload;
  };

  return { ready, error, encryptBid };
};

