import { expect } from 'chai';
import { ethers } from 'hardhat';
import hre from 'hardhat';

describe('EncryptedAuction (fhEVM adapter)', function () {
  it('finalizes auction with Zama adapter and verified ciphertexts', async function () {
    const [seller, bidderA, bidderB] = await ethers.getSigners();
    const AuctionManager = await ethers.getContractFactory('AuctionManager');
    const EncryptedAuction = await ethers.getContractFactory('EncryptedAuction');
    const ZamaAdapter = await ethers.getContractFactory('ZamaMaxAdapter');

    const auctionCore = await EncryptedAuction.deploy(await seller.getAddress());
    await auctionCore.waitForDeployment();
    await hre.fhevm.assertCoprocessorInitialized(auctionCore, 'EncryptedAuction');
    const manager = await AuctionManager.deploy(await auctionCore.getAddress());
    await manager.waitForDeployment();
    await auctionCore.setManager(await manager.getAddress());

    const adapter = await ZamaAdapter.deploy(8);
    await adapter.waitForDeployment();

    const block = await ethers.provider.getBlock('latest');
    const startTime = BigInt((block?.timestamp ?? 0) - 30);
    const endTime = startTime + 600n;
    const tx = await manager
      .connect(seller)
      .createAuction(
        ethers.ZeroAddress,
        0n,
        startTime,
        endTime,
        8,
        ethers.parseEther('0.01')
      );
    const receipt = await tx.wait();
    const auctionId = receipt?.logs?.[0]?.args?.auctionId ?? 1n;

    await auctionCore.setFHEAdapter(auctionId, await adapter.getAddress());

    const auctionAddress = await auctionCore.getAddress();
    const encryptBid = async (bidder: string, amount: string) => {
      const input = hre.fhevm.createEncryptedInput(auctionAddress, bidder);
      input.add64(ethers.parseEther(amount));
      const encrypted = await input.encrypt();
      const ciphertextHandle = ethers.hexlify(encrypted.handles[0]);
      const commitment = ethers.keccak256(ethers.concat([ethers.getBytes(ciphertextHandle), ethers.toUtf8Bytes('salt')]));
      return { ciphertextHandle, proof: encrypted.inputProof, commitment };
    };

    const encBidA = await encryptBid(await bidderA.getAddress(), '0.50');
    await auctionCore
      .connect(bidderA)
      .submitEncryptedBid(auctionId, encBidA.ciphertextHandle, encBidA.proof, encBidA.commitment, {
        value: ethers.parseEther('0.02')
      });

    const encBidB = await encryptBid(await bidderB.getAddress(), '1.25');
    await auctionCore
      .connect(bidderB)
      .submitEncryptedBid(auctionId, encBidB.ciphertextHandle, encBidB.proof, encBidB.commitment, {
        value: ethers.parseEther('0.02')
      });

    await ethers.provider.send('evm_increaseTime', [700]);
    await ethers.provider.send('evm_mine', []);

    await auctionCore.finalizeAuctionWithAdapter(auctionId);
    const storedWinner = await auctionCore.getWinnerCiphertext(auctionId);
    expect(storedWinner).to.not.equal('0x');
  });
});

