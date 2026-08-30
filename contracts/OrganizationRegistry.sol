// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title OrganizationRegistry
 * @notice Manages registration, approval, suspension, and revocation of Bank and TSP organizations for Open Banking.
 */
contract OrganizationRegistry is AccessControl {
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    enum RoleType { USER, BANK, TSP, REGULATOR }
    enum OrgStatus { PENDING, APPROVED, SUSPENDED, REVOKED }

    struct Organization {
        string name;
        RoleType role;
        OrgStatus status;
        string licenseId;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    mapping(address => Organization) private organizations;
    mapping(address => RoleType) private userRoles;

    error OrganizationAlreadyRegistered();
    error OrganizationNotRegistered();
    error InvalidRole();
    error InvalidName();
    error UnauthorizedCaller();
    error OrganizationNotApproved();

    event OrganizationRegistered(address indexed orgAddress, string name, RoleType role, string licenseId);
    event OrganizationStatusChanged(address indexed orgAddress, OrgStatus status, uint256 updatedAt);
    event UserRoleAssigned(address indexed user, RoleType role);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    /**
     * @notice Register a new BANK or TSP organization. Default status is PENDING until approved by REGULATOR.
     */
    function registerOrganization(string calldata name, RoleType role, string calldata licenseId) external {
        if (bytes(name).length == 0) revert InvalidName();
        if (role != RoleType.BANK && role != RoleType.TSP) revert InvalidRole();
        if (organizations[msg.sender].registeredAt != 0) revert OrganizationAlreadyRegistered();

        organizations[msg.sender] = Organization({
            name: name,
            role: role,
            status: OrgStatus.PENDING,
            licenseId: licenseId,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp
        });

        userRoles[msg.sender] = role;

        emit OrganizationRegistered(msg.sender, name, role, licenseId);
        emit OrganizationStatusChanged(msg.sender, OrgStatus.PENDING, block.timestamp);
    }

    /**
     * @notice REGULATOR approves an organization.
     */
    function approveOrganization(address orgAddress) external onlyRole(REGULATOR_ROLE) {
        if (organizations[orgAddress].registeredAt == 0) revert OrganizationNotRegistered();
        organizations[orgAddress].status = OrgStatus.APPROVED;
        organizations[orgAddress].updatedAt = block.timestamp;

        emit OrganizationStatusChanged(orgAddress, OrgStatus.APPROVED, block.timestamp);
    }

    /**
     * @notice REGULATOR suspends an organization.
     */
    function suspendOrganization(address orgAddress) external onlyRole(REGULATOR_ROLE) {
        if (organizations[orgAddress].registeredAt == 0) revert OrganizationNotRegistered();
        organizations[orgAddress].status = OrgStatus.SUSPENDED;
        organizations[orgAddress].updatedAt = block.timestamp;

        emit OrganizationStatusChanged(orgAddress, OrgStatus.SUSPENDED, block.timestamp);
    }

    /**
     * @notice REGULATOR revokes an organization.
     */
    function revokeOrganization(address orgAddress) external onlyRole(REGULATOR_ROLE) {
        if (organizations[orgAddress].registeredAt == 0) revert OrganizationNotRegistered();
        organizations[orgAddress].status = OrgStatus.REVOKED;
        organizations[orgAddress].updatedAt = block.timestamp;

        emit OrganizationStatusChanged(orgAddress, OrgStatus.REVOKED, block.timestamp);
    }

    /**
     * @notice Check whether an organization is approved and active.
     */
    function isOrganizationApproved(address orgAddress) external view returns (bool) {
        return organizations[orgAddress].status == OrgStatus.APPROVED;
    }

    /**
     * @notice Get organization details.
     */
    function getOrganization(address orgAddress) external view returns (
        string memory name,
        RoleType role,
        OrgStatus status,
        string memory licenseId,
        uint256 registeredAt,
        uint256 updatedAt
    ) {
        if (organizations[orgAddress].registeredAt == 0) revert OrganizationNotRegistered();
        Organization storage org = organizations[orgAddress];
        return (org.name, org.role, org.status, org.licenseId, org.registeredAt, org.updatedAt);
    }

    /**
     * @notice Check role of an address.
     */
    function getRole(address user) external view returns (RoleType) {
        if (hasRole(REGULATOR_ROLE, user)) return RoleType.REGULATOR;
        if (hasRole(ADMIN_ROLE, user)) return RoleType.REGULATOR; // Default admin is regulator level
        return userRoles[user]; // Defaults to USER (0)
    }
}
