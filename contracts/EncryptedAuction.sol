// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IFHE} from "./interfaces/IFHE.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedAuction
/// @notice Stores encrypted bid data for GhostBid sealed NFT auctions.
contract EncryptedAuction is ZamaEthereumConfig {
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 endTime;
        uint8 maxBidders;
        uint256 minDepositWei;
        bool finalized;
        bytes winnerCiphertext;
        address winner;
        IFHE fheAdapter;
    }

    struct Bid {
        euint64 ciphertext;
        address bidder;
        bytes32 commitment;
        uint256 deposit;
    }

    address public manager;
    uint256 public nextAuctionId = 1;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;

    event AuctionConfigured(uint256 indexed auctionId, address indexed seller);
    event EncryptedBidSubmitted(uint256 indexed auctionId, uint256 indexed bidIndex, address indexed bidder);
    event AuctionFinalized(uint256 indexed auctionId, bytes winnerCiphertext);
    event WinnerRevealed(uint256 indexed auctionId, address winner, uint256 amountWei);
    event ManagerUpdated(address indexed newManager);

    error AuctionNotFound();
    error InvalidWindow();
    error NotSeller();
    error NotManager();
    error AuctionActive();
    error AuctionClosed();
    error AlreadyFinalized();
    error BidLimitReached();
    error DepositTooLow();
    error AdapterNotSet();
    error InvalidCiphertext();
    error BidNotFound();

    constructor(address managerAddress) {
        manager = managerAddress == address(0) ? msg.sender : managerAddress;
    }

    function setManager(address newManager) external {
        if (msg.sender != manager) revert NotManager();
        manager = newManager;
        emit ManagerUpdated(newManager);
    }

    function createAuction(
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime,
        uint8 maxBidders,
        uint256 minDepositWei
    ) external returns (uint256) {
        if (msg.sender != manager) revert NotManager();
        if (startTime >= endTime) revert InvalidWindow();
        uint256 auctionId = nextAuctionId++;

        auctions[auctionId] = Auction({
            seller: seller,
            nftContract: nftContract,
            tokenId: tokenId,
            startTime: startTime,
            endTime: endTime,
            maxBidders: maxBidders,
            minDepositWei: minDepositWei,
            finalized: false,
            winnerCiphertext: "",
            winner: address(0),
            fheAdapter: IFHE(address(0))
        });

        emit AuctionConfigured(auctionId, msg.sender);
        return auctionId;
    }

    function submitEncryptedBid(
        uint256 auctionId,
        bytes32 ciphertextHandle,
        bytes calldata inputProof,
        bytes32 commitment
    ) external payable {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        if (block.timestamp < auction.startTime) revert AuctionActive();
        if (block.timestamp > auction.endTime) revert AuctionClosed();
        if (auctionBids[auctionId].length >= auction.maxBidders) revert BidLimitReached();
        if (msg.value < auction.minDepositWei) revert DepositTooLow();

        externalEuint64 externalCipher = externalEuint64.wrap(ciphertextHandle);
        euint64 encryptedBid = FHE.fromExternal(externalCipher, inputProof);
        FHE.allow(encryptedBid, address(this));

        auctionBids[auctionId].push(
            Bid({
                ciphertext: encryptedBid,
                bidder: msg.sender,
                commitment: commitment,
                deposit: msg.value
            })
        );

        emit EncryptedBidSubmitted(auctionId, auctionBids[auctionId].length - 1, msg.sender);
    }

    function finalizeAuctionWithAdapter(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        if (block.timestamp <= auction.endTime) revert AuctionActive();
        if (auction.finalized) revert AlreadyFinalized();
        if (address(auction.fheAdapter) == address(0)) revert AdapterNotSet();

        bytes32[] memory payload = new bytes32[](auctionBids[auctionId].length);
        for (uint256 i = 0; i < auctionBids[auctionId].length; i++) {
            euint64 ct = auctionBids[auctionId][i].ciphertext;
            FHE.allow(ct, address(auction.fheAdapter));
            payload[i] = euint64.unwrap(ct);
        }

        bytes32 winnerCipher = auction.fheAdapter.fhe_max(payload);
        auction.winnerCiphertext = abi.encodePacked(winnerCipher);
        auction.finalized = true;

        emit AuctionFinalized(auctionId, auction.winnerCiphertext);
    }

    function submitFinalizedWinner(uint256 auctionId, bytes calldata winnerCiphertext) external {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        if (block.timestamp <= auction.endTime) revert AuctionActive();
        if (auction.finalized) revert AlreadyFinalized();
        if (winnerCiphertext.length != 32) revert InvalidCiphertext();

        auction.winnerCiphertext = winnerCiphertext;
        auction.finalized = true;

        emit AuctionFinalized(auctionId, winnerCiphertext);
    }

    function setFHEAdapter(uint256 auctionId, address adapter) external {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        if (msg.sender != auction.seller) revert NotSeller();
        auction.fheAdapter = IFHE(adapter);
        Bid[] storage bids = auctionBids[auctionId];
        for (uint256 i = 0; i < bids.length; i++) {
            FHE.allow(bids[i].ciphertext, adapter);
        }
    }

    function revealWinner(uint256 auctionId, address winner, uint256 amountWei) external {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        if (!auction.finalized) revert AuctionActive();
        // Placeholder for signature / zero-knowledge proof verification.
        auction.winner = winner;
        emit WinnerRevealed(auctionId, winner, amountWei);
    }

    function getWinnerCiphertext(uint256 auctionId) external view returns (bytes memory) {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        return auction.winnerCiphertext;
    }

    function getBidCount(uint256 auctionId) external view returns (uint256) {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        return auctionBids[auctionId].length;
    }

    function getBidCiphertext(uint256 auctionId, uint256 index) external view returns (bytes32) {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert AuctionNotFound();
        if (index >= auctionBids[auctionId].length) revert BidNotFound();
        return euint64.unwrap(auctionBids[auctionId][index].ciphertext);
    }
}

