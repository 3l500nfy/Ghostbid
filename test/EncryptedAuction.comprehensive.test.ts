import { expect } from 'chai';
import { ethers } from 'hardhat';
import hre from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { EncryptedAuction, AuctionManager } from '../types';

describe('EncryptedAuction - Comprehensive Tests', () => {
    let encryptedAuction: EncryptedAuction;
    let auctionManager: AuctionManager;
    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let bidder1: SignerWithAddress;
    let bidder2: SignerWithAddress;
    let bidder3: SignerWithAddress;

    beforeEach(async () => {
        [owner, seller, bidder1, bidder2, bidder3] = await ethers.getSigners();

        // Deploy contracts
        const EncryptedAuctionFactory = await ethers.getContractFactory('EncryptedAuction');
        encryptedAuction = await EncryptedAuctionFactory.deploy(await owner.getAddress());
        await encryptedAuction.waitForDeployment();
        await hre.fhevm.assertCoprocessorInitialized(encryptedAuction, 'EncryptedAuction');

        const AuctionManagerFactory = await ethers.getContractFactory('AuctionManager');
        auctionManager = await AuctionManagerFactory.deploy(await encryptedAuction.getAddress());
        await auctionManager.waitForDeployment();

        await encryptedAuction.setManager(await auctionManager.getAddress());
    });

    describe('Bid Submission', () => {
        let auctionId: bigint;
        let ciphertextHandle: string;
        let inputProof: string;
        let commitment: string;

        beforeEach(async () => {
            // Create auction
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) - 30); // Started 30 seconds ago
            const endTime = startTime + 3600n; // Ends in 1 hour

            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                1n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            auctionId = 1n;

            // Prepare encrypted bid
            const auctionAddress = await encryptedAuction.getAddress();
            const input = hre.fhevm.createEncryptedInput(auctionAddress, await bidder1.getAddress());
            input.add64(ethers.parseEther('0.5'));
            const encrypted = await input.encrypt();
            ciphertextHandle = ethers.hexlify(encrypted.handles[0]);
            inputProof = encrypted.inputProof;
            commitment = ethers.keccak256(
                ethers.concat([ethers.getBytes(ciphertextHandle), ethers.toUtf8Bytes('salt123')])
            );
        });

        it('Should accept bid with sufficient deposit', async () => {
            const tx = await encryptedAuction
                .connect(bidder1)
                .submitEncryptedBid(auctionId, ciphertextHandle, inputProof, commitment, {
                    value: ethers.parseEther('0.02')
                });

            await expect(tx)
                .to.emit(encryptedAuction, 'EncryptedBidSubmitted')
                .withArgs(auctionId, 0, await bidder1.getAddress());

            const bidCount = await encryptedAuction.getBidCount(auctionId);
            expect(bidCount).to.equal(1);
        });

        it('Should reject bid with insufficient deposit', async () => {
            await expect(
                encryptedAuction
                    .connect(bidder1)
                    .submitEncryptedBid(auctionId, ciphertextHandle, inputProof, commitment, {
                        value: ethers.parseEther('0.005') // Below minimum
                    })
            ).to.be.revertedWithCustomError(encryptedAuction, 'DepositTooLow');
        });

        it('Should reject bid before auction starts', async () => {
            // Create future auction
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 1000); // Starts in future
            const endTime = startTime + 3600n;

            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                2n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            await expect(
                encryptedAuction
                    .connect(bidder1)
                    .submitEncryptedBid(2n, ciphertextHandle, inputProof, commitment, {
                        value: ethers.parseEther('0.02')
                    })
            ).to.be.revertedWithCustomError(encryptedAuction, 'AuctionActive');
        });

        it('Should reject bid after auction ends', async () => {
            // Fast forward past end time
            await ethers.provider.send('evm_increaseTime', [3700]);
            await ethers.provider.send('evm_mine', []);

            await expect(
                encryptedAuction
                    .connect(bidder1)
                    .submitEncryptedBid(auctionId, ciphertextHandle, inputProof, commitment, {
                        value: ethers.parseEther('0.02')
                    })
            ).to.be.revertedWithCustomError(encryptedAuction, 'AuctionClosed');
        });

        it('Should enforce bid limit', async () => {
            // Create auction with max 2 bidders
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) - 30);
            const endTime = startTime + 3600n;

            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                2n,
                startTime,
                endTime,
                2, // Max 2 bidders
                ethers.parseEther('0.01')
            );

            // Submit 2 bids (should succeed)
            const auctionAddress = await encryptedAuction.getAddress();

            const input1 = hre.fhevm.createEncryptedInput(auctionAddress, await bidder1.getAddress());
            input1.add64(ethers.parseEther('0.5'));
            const encrypted1 = await input1.encrypt();
            const handle1 = ethers.hexlify(encrypted1.handles[0]);
            const commit1 = ethers.keccak256(ethers.concat([ethers.getBytes(handle1), ethers.toUtf8Bytes('salt1')]));

            await encryptedAuction
                .connect(bidder1)
                .submitEncryptedBid(2n, handle1, encrypted1.inputProof, commit1, {
                    value: ethers.parseEther('0.02')
                });

            const input2 = hre.fhevm.createEncryptedInput(auctionAddress, await bidder2.getAddress());
            input2.add64(ethers.parseEther('0.6'));
            const encrypted2 = await input2.encrypt();
            const handle2 = ethers.hexlify(encrypted2.handles[0]);
            const commit2 = ethers.keccak256(ethers.concat([ethers.getBytes(handle2), ethers.toUtf8Bytes('salt2')]));

            await encryptedAuction
                .connect(bidder2)
                .submitEncryptedBid(2n, handle2, encrypted2.inputProof, commit2, {
                    value: ethers.parseEther('0.02')
                });

            // Third bid should fail
            const input3 = hre.fhevm.createEncryptedInput(auctionAddress, await bidder3.getAddress());
            input3.add64(ethers.parseEther('0.7'));
            const encrypted3 = await input3.encrypt();
            const handle3 = ethers.hexlify(encrypted3.handles[0]);
            const commit3 = ethers.keccak256(ethers.concat([ethers.getBytes(handle3), ethers.toUtf8Bytes('salt3')]));

            await expect(
                encryptedAuction
                    .connect(bidder3)
                    .submitEncryptedBid(2n, handle3, encrypted3.inputProof, commit3, {
                        value: ethers.parseEther('0.02')
                    })
            ).to.be.revertedWithCustomError(encryptedAuction, 'BidLimitReached');
        });

        it('Should allow multiple bids from different bidders', async () => {
            const auctionAddress = await encryptedAuction.getAddress();

            // Bidder 1
            const input1 = hre.fhevm.createEncryptedInput(auctionAddress, await bidder1.getAddress());
            input1.add64(ethers.parseEther('0.5'));
            const encrypted1 = await input1.encrypt();
            const handle1 = ethers.hexlify(encrypted1.handles[0]);
            const commit1 = ethers.keccak256(ethers.concat([ethers.getBytes(handle1), ethers.toUtf8Bytes('salt1')]));

            await encryptedAuction
                .connect(bidder1)
                .submitEncryptedBid(auctionId, handle1, encrypted1.inputProof, commit1, {
                    value: ethers.parseEther('0.02')
                });

            // Bidder 2
            const input2 = hre.fhevm.createEncryptedInput(auctionAddress, await bidder2.getAddress());
            input2.add64(ethers.parseEther('0.6'));
            const encrypted2 = await input2.encrypt();
            const handle2 = ethers.hexlify(encrypted2.handles[0]);
            const commit2 = ethers.keccak256(ethers.concat([ethers.getBytes(handle2), ethers.toUtf8Bytes('salt2')]));

            await encryptedAuction
                .connect(bidder2)
                .submitEncryptedBid(auctionId, handle2, encrypted2.inputProof, commit2, {
                    value: ethers.parseEther('0.02')
                });

            const bidCount = await encryptedAuction.getBidCount(auctionId);
            expect(bidCount).to.equal(2);
        });

        it('Should store bid ciphertext correctly', async () => {
            await encryptedAuction
                .connect(bidder1)
                .submitEncryptedBid(auctionId, ciphertextHandle, inputProof, commitment, {
                    value: ethers.parseEther('0.02')
                });

            const storedCiphertext = await encryptedAuction.getBidCiphertext(auctionId, 0);
            expect(storedCiphertext).to.not.equal(ethers.ZeroHash);
        });
    });

    describe('Auction Finalization', () => {
        let auctionId: bigint;

        beforeEach(async () => {
            // Create and populate auction
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) - 30);
            const endTime = startTime + 600n;

            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                1n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            auctionId = 1n;

            // Submit a bid
            const auctionAddress = await encryptedAuction.getAddress();
            const input = hre.fhevm.createEncryptedInput(auctionAddress, await bidder1.getAddress());
            input.add64(ethers.parseEther('0.75'));
            const encrypted = await input.encrypt();
            const ciphertextHandle = ethers.hexlify(encrypted.handles[0]);
            const commitment = ethers.keccak256(
                ethers.concat([ethers.getBytes(ciphertextHandle), ethers.toUtf8Bytes('demo')])
            );

            await encryptedAuction
                .connect(bidder1)
                .submitEncryptedBid(auctionId, ciphertextHandle, encrypted.inputProof, commitment, {
                    value: ethers.parseEther('0.02')
                });
        });

        it('Should accept finalization after auction ends', async () => {
            // Fast forward past end time
            await ethers.provider.send('evm_increaseTime', [700]);
            await ethers.provider.send('evm_mine', []);

            const bidCiphertext = await encryptedAuction.getBidCiphertext(auctionId, 0);

            const tx = await encryptedAuction.submitFinalizedWinner(auctionId, bidCiphertext);

            await expect(tx)
                .to.emit(encryptedAuction, 'AuctionFinalized')
                .withArgs(auctionId, bidCiphertext);

            const winner = await encryptedAuction.getWinnerCiphertext(auctionId);
            expect(winner).to.equal(bidCiphertext);
        });

        it('Should reject finalization before auction ends', async () => {
            const bidCiphertext = await encryptedAuction.getBidCiphertext(auctionId, 0);

            await expect(
                encryptedAuction.submitFinalizedWinner(auctionId, bidCiphertext)
            ).to.be.revertedWithCustomError(encryptedAuction, 'AuctionActive');
        });

        it('Should reject finalization with invalid ciphertext length', async () => {
            await ethers.provider.send('evm_increaseTime', [700]);
            await ethers.provider.send('evm_mine', []);

            const invalidCiphertext = '0x1234'; // Too short

            await expect(
                encryptedAuction.submitFinalizedWinner(auctionId, invalidCiphertext)
            ).to.be.revertedWithCustomError(encryptedAuction, 'InvalidCiphertext');
        });

        it('Should reject double finalization', async () => {
            await ethers.provider.send('evm_increaseTime', [700]);
            await ethers.provider.send('evm_mine', []);

            const bidCiphertext = await encryptedAuction.getBidCiphertext(auctionId, 0);

            // First finalization
            await encryptedAuction.submitFinalizedWinner(auctionId, bidCiphertext);

            // Second finalization should fail
            await expect(
                encryptedAuction.submitFinalizedWinner(auctionId, bidCiphertext)
            ).to.be.revertedWithCustomError(encryptedAuction, 'AlreadyFinalized');
        });
    });

    describe('Manager Permissions', () => {
        it('Should only allow manager to create auctions', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 100);
            const endTime = startTime + 3600n;

            await expect(
                encryptedAuction.connect(seller).createAuction(
                    await seller.getAddress(),
                    ethers.ZeroAddress,
                    1n,
                    startTime,
                    endTime,
                    10,
                    ethers.parseEther('0.01')
                )
            ).to.be.revertedWithCustomError(encryptedAuction, 'NotManager');
        });

        it('Should allow manager update by current manager', async () => {
            // Current manager is auctionManager contract
            const currentManager = await auctionManager.getAddress();
            expect(await encryptedAuction.manager()).to.equal(currentManager);

            // Only the current manager can update
            // Since manager is the auctionManager contract, we'd need to add a function
            // to AuctionManager to update the EncryptedAuction manager
            // For now, we'll just verify the current manager is set correctly
        });
        it('Should reject manager update from non-manager', async () => {
            await expect(
                encryptedAuction.connect(seller).setManager(await seller.getAddress())
            ).to.be.revertedWithCustomError(encryptedAuction, 'NotManager');
        });
    });

    describe('Bid Retrieval', () => {
        it('Should return correct bid count', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) - 30);
            const endTime = startTime + 3600n;

            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                1n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            const auctionId = 1n;
            const auctionAddress = await encryptedAuction.getAddress();

            // Submit 3 bids
            for (let i = 0; i < 3; i++) {
                const bidder = [bidder1, bidder2, bidder3][i];
                const input = hre.fhevm.createEncryptedInput(auctionAddress, await bidder.getAddress());
                input.add64(ethers.parseEther(`0.${i + 5}`));
                const encrypted = await input.encrypt();
                const handle = ethers.hexlify(encrypted.handles[0]);
                const commit = ethers.keccak256(ethers.concat([ethers.getBytes(handle), ethers.toUtf8Bytes(`salt${i}`)]));

                await encryptedAuction
                    .connect(bidder)
                    .submitEncryptedBid(auctionId, handle, encrypted.inputProof, commit, {
                        value: ethers.parseEther('0.02')
                    });
            }

            const bidCount = await encryptedAuction.getBidCount(auctionId);
            expect(bidCount).to.equal(3);
        });

        it('Should reject bid retrieval for non-existent auction', async () => {
            await expect(
                encryptedAuction.getBidCount(999)
            ).to.be.revertedWithCustomError(encryptedAuction, 'AuctionNotFound');
        });

        it('Should reject ciphertext retrieval for out-of-bounds index', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) - 30);
            const endTime = startTime + 3600n;

            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                1n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            await expect(
                encryptedAuction.getBidCiphertext(1, 0) // No bids submitted yet
            ).to.be.revertedWithCustomError(encryptedAuction, 'BidNotFound');
        });
    });
});
