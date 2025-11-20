/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Mock helper utilities to emulate Zama fhEVM comparator flows locally.
 * These functions do NOT perform true homomorphic encryption. They act as deterministic
 * stand-ins for unit tests and demo scripts.
 */

const crypto = require('crypto');

const encodeBid = (amountWei) => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(amountWei));
  return buffer.toString('hex');
};

const encryptBid = (amountWei) => {
  const payload = `${amountWei}:${crypto.randomBytes(16).toString('hex')}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

const fheCompare = (ciphertexts, plaintextBids) => {
  if (ciphertexts.length !== plaintextBids.length) {
    throw new Error('ciphertexts/plaintexts mismatch');
  }
  let maxIndex = 0;
  for (let i = 1; i < plaintextBids.length; i += 1) {
    if (BigInt(plaintextBids[i]) > BigInt(plaintextBids[maxIndex])) {
      maxIndex = i;
    }
  }
  return {
    index: maxIndex,
    winningCiphertext: ciphertexts[maxIndex]
  };
};

module.exports = {
  encodeBid,
  encryptBid,
  fheCompare
};

