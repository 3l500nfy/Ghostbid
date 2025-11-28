// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
    uint256 public currentTokenId;

    constructor() ERC721("GhostBid Mock NFT", "GBMOCK") {}

    function mint(address to) external returns (uint256) {
        currentTokenId++;
        _mint(to, currentTokenId);
        return currentTokenId;
    }
}
