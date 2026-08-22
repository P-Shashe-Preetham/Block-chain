// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SecureAssetPlatform
 * @notice MVP contract baseline for identity references, RBAC, access decisions, and unique asset ownership.
 * @dev Stores fixed-size hashes/references on-chain. It is a prototype and is not production-audited.
 */
contract SecureAssetPlatform is ERC721, AccessControl, Pausable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    struct IdentityProfile {
        bytes32 didHash;
        bool isActive;
        uint64 registeredAt;
    }

    enum AssetStatus {
        ACTIVE,
        SUSPENDED,
        REVOKED,
        RETIRED
    }

    uint256 private _nextTokenId;
    mapping(address => IdentityProfile) public identityRegistry;
    mapping(bytes32 => address) public identityByDidHash;
    mapping(bytes32 => bool) public assetIdExists;
    mapping(uint256 => bytes32) public assetIdByToken;
    mapping(uint256 => bytes32) public assetMetadataHash;
    mapping(uint256 => AssetStatus) public assetStatus;

    event IdentityRegistered(address indexed subject, bytes32 indexed didHash);
    event IdentityStatusChanged(address indexed subject, bool isActive);
    event IdentityKeyReplaced(address indexed oldSubject, address indexed newSubject, bytes32 indexed newDidHash);
    event IdentityOffboarded(address indexed subject, bytes32 indexed reason);
    event AssetMintedAndAllocated(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 indexed assetId,
        bytes32 metadataHash
    );
    event AccessDecision(address indexed requester, uint256 indexed tokenId, bytes32 indexed action, bool granted);
    event AssetStatusChanged(uint256 indexed tokenId, AssetStatus status, address indexed actor);
    event EmergencyStateChanged(bool paused);

    error InvalidAddress();
    error IdentityAlreadyRegistered();
    error IdentityDidAlreadyRegistered();
    error IdentityNotFound();
    error IdentityInactive();
    error IdentityDidMissing();
    error AssetIdMissing();
    error AssetAlreadyRegistered();
    error AssetMetadataMissing();
    error AccessActionMissing();
    error AssetNotFound();
    error AssetNotTransferable();
    error InvalidAssetStatusTransition();
    error AdminMustRemainActive();
    error DefaultAdminImmutable();
    error UnauthorizedTransfer();
    error ApprovalDisabled();

    constructor(address rootAdmin) ERC721("BEL Digital Asset Ledger", "BEL-DAM") {
        if (rootAdmin == address(0)) revert InvalidAddress();

        _setRoleAdmin(MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(USER_ROLE, DEFAULT_ADMIN_ROLE);
        _grantRole(DEFAULT_ADMIN_ROLE, rootAdmin);

        identityRegistry[rootAdmin] = IdentityProfile({
            didHash: bytes32(0),
            isActive: true,
            registeredAt: uint64(block.timestamp)
        });
        emit IdentityRegistered(rootAdmin, bytes32(0));
    }

    modifier onlyActiveIdentity(address subject) {
        if (!identityRegistry[subject].isActive) revert IdentityInactive();
        _;
    }

    function registerIdentity(address subject, bytes32 didHash)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
    {
        if (subject == address(0)) revert InvalidAddress();
        if (didHash == bytes32(0)) revert IdentityDidMissing();
        if (identityRegistry[subject].registeredAt != 0) revert IdentityAlreadyRegistered();
        if (identityByDidHash[didHash] != address(0)) revert IdentityDidAlreadyRegistered();

        identityRegistry[subject] = IdentityProfile({
            didHash: didHash,
            isActive: true,
            registeredAt: uint64(block.timestamp)
        });
        identityByDidHash[didHash] = subject;
        _grantRole(USER_ROLE, subject);
        emit IdentityRegistered(subject, didHash);
    }

    function setIdentityStatus(address subject, bool active)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
    {
        if (identityRegistry[subject].registeredAt == 0) revert IdentityNotFound();
        if (hasRole(DEFAULT_ADMIN_ROLE, subject) && !active) revert AdminMustRemainActive();

        identityRegistry[subject].isActive = active;
        if (!active) {
            _revokeRole(MANAGER_ROLE, subject);
            _revokeRole(AUDITOR_ROLE, subject);
            _revokeRole(USER_ROLE, subject);
        } else {
            _grantRole(USER_ROLE, subject);
        }
        emit IdentityStatusChanged(subject, active);
    }

    /**
     * @notice Replaces a non-admin identity key after an approved recovery process.
     * @dev Asset ownership migration remains an explicit manager-controlled review step.
     */
    function replaceIdentityKey(address oldSubject, address newSubject, bytes32 newDidHash)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
    {
        if (oldSubject == address(0) || newSubject == address(0)) revert InvalidAddress();
        if (identityRegistry[oldSubject].registeredAt == 0) revert IdentityNotFound();
        if (identityRegistry[newSubject].registeredAt != 0) revert IdentityAlreadyRegistered();
        if (newDidHash == bytes32(0)) revert IdentityDidMissing();
        if (identityByDidHash[newDidHash] != address(0)) revert IdentityDidAlreadyRegistered();
        if (hasRole(DEFAULT_ADMIN_ROLE, oldSubject)) revert AdminMustRemainActive();

        bool wasManager = hasRole(MANAGER_ROLE, oldSubject);
        bool wasAuditor = hasRole(AUDITOR_ROLE, oldSubject);

        identityRegistry[oldSubject].isActive = false;
        _revokeRole(MANAGER_ROLE, oldSubject);
        _revokeRole(AUDITOR_ROLE, oldSubject);
        _revokeRole(USER_ROLE, oldSubject);

        identityRegistry[newSubject] = IdentityProfile({
            didHash: newDidHash,
            isActive: true,
            registeredAt: uint64(block.timestamp)
        });
        identityByDidHash[newDidHash] = newSubject;
        _grantRole(USER_ROLE, newSubject);
        if (wasManager) _grantRole(MANAGER_ROLE, newSubject);
        if (wasAuditor) _grantRole(AUDITOR_ROLE, newSubject);

        emit IdentityStatusChanged(oldSubject, false);
        emit IdentityRegistered(newSubject, newDidHash);
        emit IdentityKeyReplaced(oldSubject, newSubject, newDidHash);
    }

    function offboardIdentity(address subject, bytes32 reason)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
    {
        if (identityRegistry[subject].registeredAt == 0) revert IdentityNotFound();
        if (hasRole(DEFAULT_ADMIN_ROLE, subject)) revert AdminMustRemainActive();

        identityRegistry[subject].isActive = false;
        _revokeRole(MANAGER_ROLE, subject);
        _revokeRole(AUDITOR_ROLE, subject);
        _revokeRole(USER_ROLE, subject);
        emit IdentityStatusChanged(subject, false);
        emit IdentityOffboarded(subject, reason);
    }

    function renounceRole(bytes32 role, address callerConfirmation)
        public
        override(AccessControl)
        whenNotPaused
    {
        if (role == DEFAULT_ADMIN_ROLE) revert DefaultAdminImmutable();
        super.renounceRole(role, callerConfirmation);
    }

    function grantRole(bytes32 role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
        whenNotPaused
    {
        if (role == DEFAULT_ADMIN_ROLE) revert DefaultAdminImmutable();
        if (identityRegistry[account].registeredAt == 0) revert IdentityNotFound();
        if (!identityRegistry[account].isActive) revert IdentityInactive();
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
        whenNotPaused
    {
        if (role == DEFAULT_ADMIN_ROLE) revert DefaultAdminImmutable();
        _revokeRole(role, account);
    }

    function mintAndAllocateAsset(address recipient, bytes32 assetId, bytes32 metadataHash)
        external
        onlyRole(MANAGER_ROLE)
        onlyActiveIdentity(msg.sender)
        whenNotPaused
        returns (uint256 tokenId)
    {
        if (!identityRegistry[recipient].isActive) revert IdentityInactive();
        if (assetId == bytes32(0)) revert AssetIdMissing();
        if (assetIdExists[assetId]) revert AssetAlreadyRegistered();
        if (metadataHash == bytes32(0)) revert AssetMetadataMissing();

        assetIdExists[assetId] = true;
        tokenId = _nextTokenId++;
        assetIdByToken[tokenId] = assetId;
        assetMetadataHash[tokenId] = metadataHash;
        _safeMint(recipient, tokenId);
        emit AssetMintedAndAllocated(tokenId, recipient, assetId, metadataHash);
    }

    /**
     * @notice Changes the operational status of an existing asset.
     * @dev Suspended, revoked, and retired assets remain auditable but cannot be accessed or transferred.
     */
    function setAssetStatus(uint256 tokenId, AssetStatus status)
        external
        onlyRole(MANAGER_ROLE)
        onlyActiveIdentity(msg.sender)
        whenNotPaused
    {
        if (_ownerOf(tokenId) == address(0)) revert AssetNotFound();
        AssetStatus currentStatus = assetStatus[tokenId];
        if (!_isValidAssetStatusTransition(currentStatus, status)) revert InvalidAssetStatusTransition();
        assetStatus[tokenId] = status;
        emit AssetStatusChanged(tokenId, status, msg.sender);
    }

    function _isValidAssetStatusTransition(AssetStatus currentStatus, AssetStatus nextStatus)
        internal
        pure
        returns (bool)
    {
        if (currentStatus == AssetStatus.ACTIVE) {
            return nextStatus == AssetStatus.SUSPENDED
                || nextStatus == AssetStatus.REVOKED
                || nextStatus == AssetStatus.RETIRED;
        }
        if (currentStatus == AssetStatus.SUSPENDED) {
            return nextStatus == AssetStatus.ACTIVE
                || nextStatus == AssetStatus.REVOKED
                || nextStatus == AssetStatus.RETIRED;
        }
        return currentStatus == AssetStatus.REVOKED && nextStatus == AssetStatus.RETIRED;
    }

    /**
     * @notice Records an explicit access decision without reverting on denial.
     * @dev Ownership and access are separate: owners, managers, and auditors may read by policy;
     *      transfer authority is manager-only.
     */
    function requestAccess(uint256 tokenId, bytes32 action)
        external
        onlyActiveIdentity(msg.sender)
        whenNotPaused
        returns (bool granted)
    {
        if (action == bytes32(0)) revert AccessActionMissing();
        address owner = _ownerOf(tokenId);
        granted = owner != address(0)
            && assetStatus[tokenId] == AssetStatus.ACTIVE
            && (owner == msg.sender || hasRole(MANAGER_ROLE, msg.sender) || hasRole(AUDITOR_ROLE, msg.sender));
        emit AccessDecision(msg.sender, tokenId, action, granted);
    }

    /**
     * @notice Transfers an asset only through the controlled manager workflow.
     *      Owners can request access but cannot automatically transfer enterprise assets.
     */
    function transferAsset(address from, address to, uint256 tokenId)
        external
        onlyRole(MANAGER_ROLE)
        onlyActiveIdentity(msg.sender)
        whenNotPaused
    {
        if (!identityRegistry[to].isActive) revert IdentityInactive();
        if (_ownerOf(tokenId) == address(0)) revert AssetNotFound();
        if (assetStatus[tokenId] != AssetStatus.ACTIVE) revert AssetNotTransferable();
        _transfer(from, to, tokenId);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) onlyActiveIdentity(msg.sender) {
        _pause();
        emit EmergencyStateChanged(true);
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) onlyActiveIdentity(msg.sender) {
        _unpause();
        emit EmergencyStateChanged(false);
    }

    /** @dev Standard ERC-721 approval paths are disabled for controlled enterprise transfers. */
    function approve(address, uint256) public pure override(ERC721) {
        revert ApprovalDisabled();
    }

    function setApprovalForAll(address, bool) public pure override(ERC721) {
        revert ApprovalDisabled();
    }

    function transferFrom(address from, address to, uint256 tokenId)
        public
        override(ERC721)
        onlyRole(MANAGER_ROLE)
        onlyActiveIdentity(msg.sender)
        whenNotPaused
    {
        if (_ownerOf(tokenId) == address(0)) revert AssetNotFound();
        if (assetStatus[tokenId] != AssetStatus.ACTIVE) revert AssetNotTransferable();
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override(ERC721)
        onlyRole(MANAGER_ROLE)
        onlyActiveIdentity(msg.sender)
        whenNotPaused
    {
        if (_ownerOf(tokenId) == address(0)) revert AssetNotFound();
        if (assetStatus[tokenId] != AssetStatus.ACTIVE) revert AssetNotTransferable();
        _safeTransfer(from, to, tokenId, data);
    }

    /**
     * @dev Enforces active identity policy across every ownership-change path.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        whenNotPaused
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && !identityRegistry[from].isActive) revert IdentityInactive();
        if (from != address(0) && assetStatus[tokenId] != AssetStatus.ACTIVE) revert AssetNotTransferable();
        if (to != address(0) && !identityRegistry[to].isActive) revert IdentityInactive();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
