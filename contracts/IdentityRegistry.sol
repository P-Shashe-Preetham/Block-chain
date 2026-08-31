// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityRegistry
 * @notice Manages decentralized identity lifecycle for Open Banking users.
 */
contract IdentityRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum IdentityStatus { PENDING, VERIFIED, ACTIVE, SUSPENDED, REVOKED }

    struct Identity {
        string did;
        bytes32 piiHash;
        IdentityStatus status;
        uint256 registeredAt;
        uint256 verifiedAt;
        uint256 revokedAt;
    }

    mapping(address => Identity) private identities;
    mapping(bytes32 => address) private didOwners;

    error IdentityAlreadyRegistered();
    error IdentityNotRegistered();
    error EmptyDID();
    error DIDAlreadyExists();
    error IdentityAlreadyRevoked();
    error InvalidAddress();
    error InvalidIdentityStatus();

    event IdentityRegistered(address indexed user, bytes32 indexed didHash, string did, uint256 registeredAt);
    event IdentityVerified(address indexed user, uint256 verifiedAt);
    event IdentityStatusUpdated(address indexed user, IdentityStatus status, uint256 updatedAt);
    event WalletBound(address indexed wallet, string did);
    event WalletRebound(address indexed oldWallet, address indexed newWallet, string did);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Registers a user wallet with a DID and off-chain PII hash. Initial state is PENDING.
     */
    function registerIdentity(string calldata did, bytes32 piiHash) external {
        if (bytes(did).length == 0) revert EmptyDID();
        if (isRegistered(msg.sender)) revert IdentityAlreadyRegistered();

        bytes32 didHash = keccak256(bytes(did));
        if (didOwners[didHash] != address(0)) revert DIDAlreadyExists();

        uint256 registeredAt = block.timestamp;
        identities[msg.sender] = Identity({
            did: did,
            piiHash: piiHash,
            status: IdentityStatus.PENDING,
            registeredAt: registeredAt,
            verifiedAt: 0,
            revokedAt: 0
        });
        didOwners[didHash] = msg.sender;

        emit IdentityRegistered(msg.sender, didHash, did, registeredAt);
        emit WalletBound(msg.sender, did);
    }

    /**
     * @notice Verifies a user identity (by Bank/Verifier/Admin). Transitions from PENDING to VERIFIED, then ACTIVE.
     */
    function verifyIdentity(address user) external onlyRole(VERIFIER_ROLE) {
        if (user == address(0)) revert InvalidAddress();
        if (!isRegistered(user)) revert IdentityNotRegistered();

        Identity storage identity = identities[user];
        if (identity.status == IdentityStatus.REVOKED) revert IdentityAlreadyRevoked();

        identity.status = IdentityStatus.ACTIVE;
        identity.verifiedAt = block.timestamp;

        emit IdentityVerified(user, identity.verifiedAt);
        emit IdentityStatusUpdated(user, IdentityStatus.ACTIVE, block.timestamp);
    }

    /**
     * @notice Revokes an identity.
     */
    function revokeIdentity(address user) external onlyRole(ADMIN_ROLE) {
        if (user == address(0)) revert InvalidAddress();
        if (!isRegistered(user)) revert IdentityNotRegistered();

        Identity storage identity = identities[user];
        if (identity.status == IdentityStatus.REVOKED) revert IdentityAlreadyRevoked();

        identity.status = IdentityStatus.REVOKED;
        identity.revokedAt = block.timestamp;

        emit IdentityStatusUpdated(user, IdentityStatus.REVOKED, identity.revokedAt);
    }

    /**
     * @notice Rebinds a DID from an old wallet to a new wallet address.
     */
    function rebindWallet(address oldWallet, address newWallet) external onlyRole(ADMIN_ROLE) {
        if (oldWallet == address(0) || newWallet == address(0)) revert InvalidAddress();
        if (!isRegistered(oldWallet)) revert IdentityNotRegistered();
        if (isRegistered(newWallet)) revert IdentityAlreadyRegistered();

        Identity storage identity = identities[oldWallet];
        bytes32 didHash = keccak256(bytes(identity.did));

        identities[newWallet] = identity;
        delete identities[oldWallet];
        didOwners[didHash] = newWallet;

        emit WalletRebound(oldWallet, newWallet, identity.did);
    }

    /**
     * @notice Check if a user is registered.
     */
    function isRegistered(address user) public view returns (bool) {
        return identities[user].registeredAt != 0;
    }

    /**
     * @notice Check if a user identity is currently ACTIVE.
     */
    function isIdentityActive(address user) external view returns (bool) {
        return isRegistered(user) && (identities[user].status == IdentityStatus.ACTIVE);
    }

    /**
     * @notice Get identity status enum.
     */
    function getIdentityStatus(address user) external view returns (IdentityStatus) {
        if (!isRegistered(user)) revert IdentityNotRegistered();
        return identities[user].status;
    }

    /**
     * @notice Get full identity details.
     */
    function getIdentity(address user)
        external
        view
        returns (
            string memory did,
            bytes32 piiHash,
            IdentityStatus status,
            uint256 registeredAt,
            uint256 verifiedAt,
            uint256 revokedAt
        )
    {
        if (!isRegistered(user)) revert IdentityNotRegistered();
        Identity storage id = identities[user];
        return (id.did, id.piiHash, id.status, id.registeredAt, id.verifiedAt, id.revokedAt);
    }

    /**
     * @notice Resolve DID to address.
     */
    function getAddressByDID(string calldata did) external view returns (address) {
        return didOwners[keccak256(bytes(did))];
    }
}
