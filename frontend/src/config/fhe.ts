const LOCAL_ACL = '0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D';
const LOCAL_INPUT_VERIFIER = '0x36772142b74871f255CbD7A3e89B401d3e45825f';
const LOCAL_KMS = '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A';
const LOCAL_RELAYER = 'http://127.0.0.1:8545';

export interface FheConfig {
  acl: string;
  inputVerifier: string;
  kms: string;
  decryption: string;
  relayerUrl: string;
  gatewayChainId: number;
  chainId: number;
  rpcUrl: string;
}

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getFheConfig = (): FheConfig => {
  return {
    acl: (import.meta.env.VITE_FHE_ACL as string | undefined) ?? LOCAL_ACL,
    inputVerifier: (import.meta.env.VITE_FHE_INPUT_VERIFIER as string | undefined) ?? LOCAL_INPUT_VERIFIER,
    kms: (import.meta.env.VITE_FHE_KMS as string | undefined) ?? LOCAL_KMS,
    decryption:
      (import.meta.env.VITE_FHE_DECRYPTION_VERIFIER as string | undefined) ??
      (import.meta.env.VITE_FHE_INPUT_VERIFIER as string | undefined) ??
      LOCAL_INPUT_VERIFIER,
    relayerUrl: (import.meta.env.VITE_FHE_RELAYER_URL as string | undefined) ?? LOCAL_RELAYER,
    gatewayChainId: parseNumber(import.meta.env.VITE_FHE_GATEWAY_CHAIN_ID as string | undefined, 31337),
    chainId: parseNumber(import.meta.env.VITE_FHE_CHAIN_ID as string | undefined, 31337),
    rpcUrl: (import.meta.env.VITE_RPC_URL as string | undefined) ?? 'http://localhost:8545'
  };
};

