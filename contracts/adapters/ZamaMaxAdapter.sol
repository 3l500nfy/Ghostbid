// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IFHE} from "../interfaces/IFHE.sol";
import {FHE, ebool, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ZamaMaxAdapter
/// @notice Minimal fhEVM adapter that computes the encrypted maximum across bid handles.
contract ZamaMaxAdapter is IFHE, ZamaEthereumConfig {
    error NoCiphertextsProvided();
    error CiphertextLimitExceeded();

    /// @notice Optional upper bound for ciphertext batch size.
    uint256 public immutable maxCiphertexts;

    constructor(uint256 maxInputs) {
        maxCiphertexts = maxInputs;
    }

    function fhe_max(bytes32[] calldata ciphertextHandles) external override returns (bytes32 winnerHandle) {
        uint256 length = ciphertextHandles.length;
        if (length == 0) revert NoCiphertextsProvided();
        if (maxCiphertexts != 0 && length > maxCiphertexts) revert CiphertextLimitExceeded();

        euint64 currentMax = euint64.wrap(ciphertextHandles[0]);

        for (uint256 i = 1; i < length; i++) {
            euint64 candidate = euint64.wrap(ciphertextHandles[i]);
            ebool shouldReplace = FHE.gt(candidate, currentMax);
            currentMax = FHE.select(shouldReplace, candidate, currentMax);
        }

        FHE.allow(currentMax, msg.sender);
        return euint64.unwrap(currentMax);
    }
}

