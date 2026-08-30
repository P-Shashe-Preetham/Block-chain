// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IOrganizationRegistry} from "./interfaces/IOrganizationRegistry.sol";

contract OrganizationRegistry is AccessControl, IOrganizationRegistry {
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");
    bytes32 public constant TSP_ROLE = keccak256("TSP_ROLE");

    struct Organization {
        string name;
        bytes32 role;
        OrgStatus status;
    }

    mapping(address => Organization) public organizations;

    event OrganizationRegistered(address indexed org, string name, bytes32 role);
    event OrganizationApproved(address indexed org);
    event OrganizationSuspended(address indexed org);
    event OrganizationRevoked(address indexed org);

    error InvalidRole();
    error AlreadyRegistered();
    error OrganizationNotFound();
    error InvalidStatusTransition();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGULATOR_ROLE, msg.sender);
    }

    function registerOrganization(string calldata name, bytes32 role) external override {
        if (role != BANK_ROLE && role != TSP_ROLE) revert InvalidRole();
        if (organizations[msg.sender].status != OrgStatus.NONE) revert AlreadyRegistered();

        organizations[msg.sender] = Organization({
            name: name,
            role: role,
            status: OrgStatus.PENDING
        });

        emit OrganizationRegistered(msg.sender, name, role);
    }

    function approveOrganization(address org) external override onlyRole(REGULATOR_ROLE) {
        if (organizations[org].status == OrgStatus.NONE) revert OrganizationNotFound();
        if (organizations[org].status != OrgStatus.PENDING && organizations[org].status != OrgStatus.SUSPENDED) revert InvalidStatusTransition();

        organizations[org].status = OrgStatus.APPROVED;
        _grantRole(organizations[org].role, org);

        emit OrganizationApproved(org);
    }

    function suspendOrganization(address org) external override onlyRole(REGULATOR_ROLE) {
        if (organizations[org].status != OrgStatus.APPROVED) revert InvalidStatusTransition();

        organizations[org].status = OrgStatus.SUSPENDED;
        _revokeRole(organizations[org].role, org);

        emit OrganizationSuspended(org);
    }

    function revokeOrganization(address org) external override onlyRole(REGULATOR_ROLE) {
        if (organizations[org].status == OrgStatus.NONE) revert OrganizationNotFound();
        if (organizations[org].status == OrgStatus.REVOKED) revert InvalidStatusTransition();

        _revokeRole(organizations[org].role, org);
        organizations[org].status = OrgStatus.REVOKED;

        emit OrganizationRevoked(org);
    }

    function isOrganizationActive(address org) external view override returns (bool) {
        return organizations[org].status == OrgStatus.APPROVED;
    }
}
