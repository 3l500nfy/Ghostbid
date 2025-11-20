// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EncryptedAuction} from "./EncryptedAuction.sol";

/// @title AuctionManager
/// @notice Registry for GhostBid auctions that routes creation to the EncryptedAuction core contract.
contract AuctionManager {
    struct AuctionMeta {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        uint8 maxBidders;
        uint256 minDepositWei;
    }

    EncryptedAuction public immutable encryptedAuction;
    uint256 public auctionCount;
    mapping(uint256 => AuctionMeta) public auctions;

    event AuctionCreated(uint256 indexed auctionId, address indexed seller);

    constructor(address encryptedAuctionAddress) {
        encryptedAuction = EncryptedAuction(encryptedAuctionAddress);
    }

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime,
        uint8 maxBidders,
        uint256 minDepositWei
    ) external returns (uint256) {
        uint256 auctionId = encryptedAuction.createAuction(
            msg.sender,
            nftContract,
            tokenId,
            startTime,
            endTime,
            maxBidders,
            minDepositWei
        );

        auctions[auctionId] = AuctionMeta({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startTime: startTime,
            endTime: endTime,
            maxBidders: maxBidders,
            minDepositWei: minDepositWei
        });

        auctionCount = auctionId;
        emit AuctionCreated(auctionId, msg.sender);
        return auctionId;
    }

    function getAuction(uint256 auctionId) external view returns (AuctionMeta memory) {
        return auctions[auctionId];
    }
}

