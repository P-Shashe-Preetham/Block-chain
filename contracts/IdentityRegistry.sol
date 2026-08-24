// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IIdentityRegistry} from "./interfaces/IIdentityRegistry.sol";

/**
 * @title IdentityRegistry
 * @notice Stores a minimal, non-sensitive on-chain identity lifecycle for wallet addresses.
 * @dev This contract intentionally does not manage roles, assets, permissions, or access decisions.
 */
contract IdentityRegistry is AccessControl, IIdentityRegistry {
    /// @notice Role permitted to revoke active identities.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Minimal identity state associated with a wallet address.
    struct Identity {
        string did;
        bool active;
        uint256 registeredAt;
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

    /** @notice Emitted after a wallet registers its identity. */
    event IdentityRegistered(address indexed user, bytes32 indexed didHash, string did, uint256 registeredAt);

    /** @notice Emitted after an administrator revokes an active identity. */
    event IdentityRevoked(address indexed user, uint256 revokedAt);

    /**
     * @notice Assigns the deployer the initial default-administrator and identity-administrator roles.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Registers the caller's wallet with a unique decentralized identifier.
     * @param did The caller-supplied DID. It is stored exactly as supplied and uniqueness is enforced by its hash.
     * @dev DIDs cannot be reassigned after revocation in Version 1, preserving an immutable historical record.
     */
    function registerIdentity(string calldata did) external {
        if (bytes(did).length == 0) revert EmptyDID();
        if (isRegistered(msg.sender)) revert IdentityAlreadyRegistered();

        bytes32 didHash = keccak256(bytes(did));
        if (didOwners[didHash] != address(0)) revert DIDAlreadyExists();

        uint256 registeredAt = block.timestamp;
        identities[msg.sender] = Identity({did: did, active: true, registeredAt: registeredAt, revokedAt: 0});
        didOwners[didHash] = msg.sender;

        emit IdentityRegistered(msg.sender, didHash, did, registeredAt);
    }

    /**
     * @notice Revokes an active identity while preserving its historical registration record.
     * @param user The wallet whose identity should be revoked.
     */
    function revokeIdentity(address user) external onlyRole(ADMIN_ROLE) {
        if (user == address(0)) revert InvalidAddress();
        if (!isRegistered(user)) revert IdentityNotRegistered();

        Identity storage identity = identities[user];
        if (!identity.active) revert IdentityAlreadyRevoked();

        identity.active = false;
        identity.revokedAt = block.timestamp;

        emit IdentityRevoked(user, identity.revokedAt);
    }

    /**
     * @inheritdoc IIdentityRegistry
     * @dev A revoked identity returns true because it remains registered historically.
     */
    function isRegistered(address user) public view override returns (bool) {
        return identities[user].registeredAt != 0;
    }

    /**
     * @notice Returns true only when a wallet has registered an identity that remains active.
     * @param user The wallet address to inspect.
     */
    function isIdentityActive(address user) external view override returns (bool) {
        return isRegistered(user) && identities[user].active;
    }

    /**
     * @notice Returns the lifecycle state associated with a registered wallet identity.
     * @param user The wallet address to inspect.
     * @return did The stored decentralized identifier.
     * @return active Whether the identity remains active.
     * @return registeredAt The registration timestamp.
     * @return revokedAt The revocation timestamp, or zero when the identity has not been revoked.
     */
    function getIdentity(address user)
        external
        view
        override
        returns (string memory did, bool active, uint256 registeredAt, uint256 revokedAt)
    {
        if (!isRegistered(user)) revert IdentityNotRegistered();

        Identity storage identity = identities[user];
        return (identity.did, identity.active, identity.registeredAt, identity.revokedAt);
    }

    /**
     * @notice Resolves a DID to its registered wallet address.
     * @param did The DID to resolve.
     * @return The associated wallet address, or address(0) when the DID has never been registered.
     */
    function getAddressByDID(string calldata did) external view returns (address) {
        return didOwners[keccak256(bytes(did))];
    }
}
