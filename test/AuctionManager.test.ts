import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { EncryptedAuction, AuctionManager } from '../types';

describe('AuctionManager', () => {
    let encryptedAuction: EncryptedAuction;
    let auctionManager: AuctionManager;
    let owner: SignerWithAddress;
    let seller: SignerWithAddress;
    let bidder1: SignerWithAddress;

    beforeEach(async () => {
        [owner, seller, bidder1] = await ethers.getSigners();

        // Deploy EncryptedAuction
        const EncryptedAuctionFactory = await ethers.getContractFactory('EncryptedAuction');
        encryptedAuction = await EncryptedAuctionFactory.deploy(await owner.getAddress());
        await encryptedAuction.waitForDeployment();

        // Deploy AuctionManager
        const AuctionManagerFactory = await ethers.getContractFactory('AuctionManager');
        auctionManager = await AuctionManagerFactory.deploy(await encryptedAuction.getAddress());
        await auctionManager.waitForDeployment();

        // Set manager in EncryptedAuction
        await encryptedAuction.setManager(await auctionManager.getAddress());
    });

    describe('Deployment', () => {
        it('Should set the correct auction contract address', async () => {
            expect(await auctionManager.encryptedAuction()).to.equal(await encryptedAuction.getAddress());
        });

        it('Should initialize with nextAuctionId = 1', async () => {
            const auction = await auctionManager.getAuction(1);
            expect(auction.seller).to.equal(ethers.ZeroAddress); // No auction created yet
        });
    });

    describe('Auction Creation', () => {
        it('Should create auction with valid parameters', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 100);
            const endTime = startTime + 3600n;
            const nftContract = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
            const tokenId = 1n;
            const maxBidders = 10;
            const minDeposit = ethers.parseEther('0.01');

            const tx = await auctionManager.connect(seller).createAuction(
                nftContract,
                tokenId,
                startTime,
                endTime,
                maxBidders,
                minDeposit
            );

            await expect(tx)
                .to.emit(auctionManager, 'AuctionCreated')
                .withArgs(1, await seller.getAddress());

            const auction = await auctionManager.getAuction(1);
            expect(auction.seller).to.equal(await seller.getAddress());
            expect(auction.nftContract).to.equal(nftContract);
            expect(auction.tokenId).to.equal(tokenId);
            expect(auction.startTime).to.equal(startTime);
            expect(auction.endTime).to.equal(endTime);
            expect(auction.maxBidders).to.equal(maxBidders);
            expect(auction.minDepositWei).to.equal(minDeposit);
        });

        it('Should increment auction ID for each new auction', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 100);
            const endTime = startTime + 3600n;

            // Create first auction
            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                1n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            // Create second auction
            const tx = await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                2n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            await expect(tx)
                .to.emit(auctionManager, 'AuctionCreated')
                .withArgs(2, await seller.getAddress());
        });

        it('Should reject auction with invalid time window (start >= end)', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 100);
            const endTime = startTime - 100n; // End before start

            await expect(
                auctionManager.connect(seller).createAuction(
                    ethers.ZeroAddress,
                    1n,
                    startTime,
                    endTime,
                    10,
                    ethers.parseEther('0.01')
                )
            ).to.be.revertedWithCustomError(encryptedAuction, 'InvalidWindow');
        });

        it('Should allow different sellers to create auctions', async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 100);
            const endTime = startTime + 3600n;

            // Seller creates auction
            await auctionManager.connect(seller).createAuction(
                ethers.ZeroAddress,
                1n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            // Bidder1 creates auction
            await auctionManager.connect(bidder1).createAuction(
                ethers.ZeroAddress,
                2n,
                startTime,
                endTime,
                10,
                ethers.parseEther('0.01')
            );

            const auction1 = await auctionManager.getAuction(1);
            const auction2 = await auctionManager.getAuction(2);

            expect(auction1.seller).to.equal(await seller.getAddress());
            expect(auction2.seller).to.equal(await bidder1.getAddress());
        });
    });

    describe('Auction Retrieval', () => {
        beforeEach(async () => {
            const block = await ethers.provider.getBlock('latest');
            const startTime = BigInt((block?.timestamp ?? 0) + 100);
            const endTime = startTime + 3600n;

            await auctionManager.connect(seller).createAuction(
                '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                42n,
                startTime,
                endTime,
                5,
                ethers.parseEther('0.05')
            );
        });

        it('Should return correct auction details', async () => {
            const auction = await auctionManager.getAuction(1);

            expect(auction.seller).to.equal(await seller.getAddress());
            expect(auction.nftContract).to.equal('0x5FbDB2315678afecb367f032d93F642f64180aa3');
            expect(auction.tokenId).to.equal(42n);
            expect(auction.maxBidders).to.equal(5);
            expect(auction.minDepositWei).to.equal(ethers.parseEther('0.05'));
        });

        it('Should return zero address for non-existent auction', async () => {
            const auction = await auctionManager.getAuction(999);
            expect(auction.seller).to.equal(ethers.ZeroAddress);
        });
    });
});
