import { expect } from 'chai';
import { ethers } from 'hardhat';
import hre from 'hardhat';

describe('EncryptedAuction fallback finalization', () => {
  it('accepts encrypted winner provided by an off-chain relayer', async () => {
    const [seller, bidder] = await ethers.getSigners();

    const EncryptedAuction = await ethers.getContractFactory('EncryptedAuction');
    const encryptedAuction = await EncryptedAuction.deploy(await seller.getAddress());
    await encryptedAuction.waitForDeployment();
    await hre.fhevm.assertCoprocessorInitialized(encryptedAuction, 'EncryptedAuction');

    const AuctionManager = await ethers.getContractFactory('AuctionManager');
    const manager = await AuctionManager.deploy(await encryptedAuction.getAddress());
    await manager.waitForDeployment();

    await encryptedAuction.setManager(await manager.getAddress());

    const block = await ethers.provider.getBlock('latest');
    const startTime = BigInt((block?.timestamp ?? 0) - 30);
    const endTime = startTime + 600n;
    await manager.connect(seller).createAuction(
      ethers.ZeroAddress,
      0n,
      startTime,
      endTime,
      4,
      ethers.parseEther('0.01')
    );

    const auctionAddress = await encryptedAuction.getAddress();
    const input = hre.fhevm.createEncryptedInput(auctionAddress, await bidder.getAddress());
    input.add64(ethers.parseEther('0.75'));
    const encrypted = await input.encrypt();
    const ciphertextHandle = ethers.hexlify(encrypted.handles[0]);
    const commitment = ethers.keccak256(ethers.concat([ethers.getBytes(ciphertextHandle), ethers.toUtf8Bytes('demo')]));

    await encryptedAuction
      .connect(bidder)
      .submitEncryptedBid(1n, ciphertextHandle, encrypted.inputProof, commitment, {
        value: ethers.parseEther('0.02')
      });

    await ethers.provider.send('evm_increaseTime', [700]);
    await ethers.provider.send('evm_mine', []);

    // Relayer posts the cipher it considers the winner.
    await encryptedAuction.submitFinalizedWinner(1n, ciphertextHandle);
    const winner = await encryptedAuction.getWinnerCiphertext(1n);
    expect(winner).to.equal(ciphertextHandle);
  });
});

