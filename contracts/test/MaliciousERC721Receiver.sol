// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITransferAsset {
    function transferAsset(address from, address to, uint256 tokenId) external;
}

/**
 * @dev Test-only receiver. It records a callback and attempts an unauthorized
 * manager transfer from inside that callback. The attempt is expected to fail.
 */
contract MaliciousERC721Receiver {
    ITransferAsset public platform;
    address public targetAddress;
    uint256 public tokenId;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    function configure(address platformAddress, address destinationAddress, uint256 configuredTokenId) external {
        platform = ITransferAsset(platformAddress);
        targetAddress = destinationAddress;
        tokenId = configuredTokenId;
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        reentryAttempted = true;
        try platform.transferAsset(address(this), targetAddress, tokenId) {
            reentrySucceeded = true;
        } catch {}
        return this.onERC721Received.selector;
    }
}
