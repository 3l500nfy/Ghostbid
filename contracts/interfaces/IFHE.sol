// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFHE
/// @notice Minimal interface for interacting with a Zama fhEVM adapter that can compute
///         encrypted maxima on ciphertext handles already verified on-chain.
interface IFHE {
    /// @notice Computes the encrypted winning bid from an array of ciphertext handles.
    /// @dev Each handle must have granted access to the adapter via FHE.allow.
    /// @param ciphertextHandles Array of encrypted bid handles.
    /// @return winnerHandle Encrypted handle encoding the winning amount and bidder index.
    function fhe_max(bytes32[] calldata ciphertextHandles) external returns (bytes32 winnerHandle);
}

