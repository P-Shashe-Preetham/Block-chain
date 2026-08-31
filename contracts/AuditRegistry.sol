// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AuditRegistry
 * @notice Immutable on-chain log of all access evaluation attempts and authorization outcomes.
 * @dev Optimized to use indexed EVM events (AccessAttemptLogged) instead of unbounded SSTORE array pushes.
 */
contract AuditRegistry is AccessControl {
    bytes32 public constant LOG_LOGGER_ROLE = keccak256("LOG_LOGGER_ROLE");

    uint256 private _auditLogsCount;

    event AccessAttemptLogged(
        uint256 indexed id,
        address indexed user,
        address indexed bank,
        address tsp,
        string dataType,
        bool granted,
        string reason,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(LOG_LOGGER_ROLE, msg.sender);
    }

    /**
     * @notice Logs an access request attempt and result using low-gas indexed EVM event logs.
     */
    function logAccessAttempt(
        address user,
        address bank,
        address tsp,
        string calldata dataType,
        bool granted,
        string calldata reason
    ) external onlyRole(LOG_LOGGER_ROLE) returns (uint256 recordId) {
        recordId = _auditLogsCount;
        unchecked {
            _auditLogsCount++;
        }
        uint256 timestamp = block.timestamp;

        emit AccessAttemptLogged(recordId, user, bank, tsp, dataType, granted, reason, timestamp);
    }

    /**
     * @notice Get total audit log record count.
     */
    function getAuditLogsCount() external view returns (uint256) {
        return _auditLogsCount;
    }
}