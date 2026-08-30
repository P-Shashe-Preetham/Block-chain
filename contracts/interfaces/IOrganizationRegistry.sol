// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOrganizationRegistry {
    enum OrgStatus { NONE, PENDING, APPROVED, SUSPENDED, REVOKED }

    function registerOrganization(string calldata name, bytes32 role) external;
    function approveOrganization(address org) external;
    function suspendOrganization(address org) external;
    function revokeOrganization(address org) external;
    function isOrganizationActive(address org) external view returns (bool);
}
