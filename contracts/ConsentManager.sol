// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ConsentManager
 * @notice Manages explicit, user-controlled data access consents for Open Banking.
 */
contract ConsentManager is AccessControl {
    struct Consent {
        bytes32 consentId;
        address user;
        address bank;
        address tsp;
        string dataType; // e.g. "ACCOUNT_INFO", "TRANSACTIONS", "BALANCE"
        uint256 createdAt;
        uint256 expiresAt;
        bool active;
    }

    mapping(bytes32 => Consent) private consents;
    mapping(address => bytes32[]) private userConsentIds;
    mapping(bytes32 => bytes32) private activeTupleConsentId;

    error InvalidAddress();
    error InvalidDataType();
    error InvalidDuration();
    error ConsentNotFound();
    error ConsentNotActive();
    error UnauthorizedCaller();

    event ConsentGranted(
        bytes32 indexed consentId,
        address indexed user,
        address indexed bank,
        address tsp,
        string dataType,
        uint256 createdAt,
        uint256 expiresAt
    );

    event ConsentRevoked(bytes32 indexed consentId, address indexed user, uint256 revokedAt);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Grants permission to a TSP to access specific user data from a Bank for a designated duration.
     */
    function grantConsent(
        address bank,
        address tsp,
        string calldata dataType,
        uint256 durationInSeconds
    ) external returns (bytes32 consentId) {
        if (bank == address(0) || tsp == address(0)) revert InvalidAddress();
        if (bytes(dataType).length == 0) revert InvalidDataType();
        if (durationInSeconds == 0) revert InvalidDuration();

        uint256 createdAt = block.timestamp;
        uint256 expiresAt = createdAt + durationInSeconds;

        consentId = keccak256(
            abi.encodePacked(msg.sender, bank, tsp, dataType, createdAt, userConsentIds[msg.sender].length)
        );

        consents[consentId] = Consent({
            consentId: consentId,
            user: msg.sender,
            bank: bank,
            tsp: tsp,
            dataType: dataType,
            createdAt: createdAt,
            expiresAt: expiresAt,
            active: true
        });

        userConsentIds[msg.sender].push(consentId);

        bytes32 tupleKey = keccak256(abi.encodePacked(msg.sender, bank, tsp, keccak256(bytes(dataType))));
        activeTupleConsentId[tupleKey] = consentId;

        emit ConsentGranted(consentId, msg.sender, bank, tsp, dataType, createdAt, expiresAt);
    }

    /**
     * @notice User revokes an active consent.
     */
    function revokeConsent(bytes32 consentId) external {
        Consent storage consent = consents[consentId];
        if (consent.createdAt == 0) revert ConsentNotFound();
        if (consent.user != msg.sender) revert UnauthorizedCaller();
        if (!consent.active) revert ConsentNotActive();

        consent.active = false;

        bytes32 tupleKey = keccak256(abi.encodePacked(consent.user, consent.bank, consent.tsp, keccak256(bytes(consent.dataType))));
        if (activeTupleConsentId[tupleKey] == consentId) {
            delete activeTupleConsentId[tupleKey];
        }

        emit ConsentRevoked(consentId, msg.sender, block.timestamp);
    }

    /**
     * @notice Validates whether an active, non-expired consent exists for the specified tuple in O(1) time.
     */
    function checkConsent(
        address user,
        address bank,
        address tsp,
        string calldata dataType
    ) external view returns (bool) {
        bytes32 tupleKey = keccak256(abi.encodePacked(user, bank, tsp, keccak256(bytes(dataType))));
        bytes32 cid = activeTupleConsentId[tupleKey];
        if (cid == bytes32(0)) return false;

        Consent storage c = consents[cid];
        return c.active && block.timestamp <= c.expiresAt;
    }

    /**
     * @notice Get consent details by ID.
     */
    function getConsent(bytes32 consentId) external view returns (
        address user,
        address bank,
        address tsp,
        string memory dataType,
        uint256 createdAt,
        uint256 expiresAt,
        bool active
    ) {
        Consent storage c = consents[consentId];
        if (c.createdAt == 0) revert ConsentNotFound();
        return (c.user, c.bank, c.tsp, c.dataType, c.createdAt, c.expiresAt, c.active && block.timestamp <= c.expiresAt);
    }

    /**
     * @notice Get all consent IDs for a user.
     */
    function getUserConsents(address user) external view returns (bytes32[] memory) {
        return userConsentIds[user];
    }
}
