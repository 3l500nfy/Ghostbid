import { config } from 'dotenv';
import { ethers } from 'ethers';

config();

const {
  AUCTION_CONTRACT,
  RPC_URL,
  PRIVATE_KEY,
  FHE_ACL_ADDRESS,
  FHE_INPUT_VERIFIER,
  FHE_KMS_ADDRESS,
  FHE_DECRYPTION_VERIFIER,
  FHE_GATEWAY_CHAIN_ID,
  FHE_CHAIN_ID,
  ZAMA_RELAYER_ENDPOINT
} = process.env;

const bidderSeeds = ['0.4', '0.73', '1.05'];

const loadFheInstance = async () => {
  if (
    !FHE_ACL_ADDRESS ||
    !FHE_INPUT_VERIFIER ||
    !FHE_KMS_ADDRESS ||
    !FHE_DECRYPTION_VERIFIER ||
    !ZAMA_RELAYER_ENDPOINT
  ) {
    throw new Error('Missing FHE_* relayer configuration in env file.');
  }
  const { createInstance, initSDK } = await import('@zama-fhe/relayer-sdk/node');
  await initSDK();
  return createInstance({
    aclContractAddress: FHE_ACL_ADDRESS,
    inputVerifierContractAddress: FHE_INPUT_VERIFIER,
    verifyingContractAddressInputVerification: FHE_INPUT_VERIFIER,
    kmsContractAddress: FHE_KMS_ADDRESS,
    verifyingContractAddressDecryption: FHE_DECRYPTION_VERIFIER,
    gatewayChainId: Number(FHE_GATEWAY_CHAIN_ID ?? '31337'),
    chainId: Number(FHE_CHAIN_ID ?? '31337'),
    relayerUrl: ZAMA_RELAYER_ENDPOINT
  });
};

const main = async () => {
  if (!AUCTION_CONTRACT || !RPC_URL || !PRIVATE_KEY) {
    throw new Error('Missing env vars AUCTION_CONTRACT, RPC_URL, or PRIVATE_KEY');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(
    AUCTION_CONTRACT,
    [
      'function submitEncryptedBid(uint256,bytes32,bytes,bytes32) payable',
      'function finalizeAuctionWithAdapter(uint256)'
    ],
    wallet
  );

  const fheInstance = await loadFheInstance();

  console.log('Submitting encrypted bids...');
  for (let i = 0; i < bidderSeeds.length; i += 1) {
    const input = fheInstance.createEncryptedInput(AUCTION_CONTRACT, wallet.address);
    input.add64(ethers.parseUnits(bidderSeeds[i], 18));
    const encrypted = await input.encrypt();
    const ciphertext = ethers.hexlify(encrypted.handles[0]);
    const commitment = ethers.keccak256(ethers.concat([ethers.getBytes(ciphertext), ethers.toUtf8Bytes('demo-salt')]));
    const tx = await auction.submitEncryptedBid(1, ciphertext, encrypted.inputProof, commitment, {
      value: ethers.parseEther('0.02')
    });
    await tx.wait();
    console.log(`Bidder ${i + 1} submitted encrypted bid`);
  }

  console.log('Finalizing auction...');
  const finalizeTx = await auction.finalizeAuctionWithAdapter(1);
  await finalizeTx.wait();
  console.log('Auction finalized.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

