// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentityRegistry {
    enum IdentityStatus { NONE, PENDING, VERIFIED, ACTIVE, SUSPENDED, REVOKED }

    function registerIdentity(string calldata did, bytes32 dataHash) external;
    function verifyIdentity(address user) external;
    function bindWallet(address newWallet) external;
    function rebindWallet(address newWallet) external;
    function revokeIdentity(address user) external;

    function isRegistered(address user) external view returns (bool);
    function isIdentityActive(address user) external view returns (bool);
    function getIdentityStatus(address user) external view returns (IdentityStatus);
    function getIdentity(address user) external view returns (string memory did, IdentityStatus status, uint256 registeredAt, uint256 revokedAt);
}
