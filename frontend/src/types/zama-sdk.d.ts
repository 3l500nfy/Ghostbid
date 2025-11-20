declare module '@zama/relayer-sdk' {
  export interface ComparatorInput {
    ciphertexts: string[];
  }

  export interface ComparatorResult {
    winnerCiphertext: string;
  }

  export class RelayerClient {
    constructor(opts: { endpoint: string; apiKey: string });
    computeMax(payload: ComparatorInput): Promise<ComparatorResult>;
  }
}

