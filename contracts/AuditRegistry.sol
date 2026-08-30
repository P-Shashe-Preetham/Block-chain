// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AuditRegistry
 * @notice Immutable on-chain log of all access evaluation attempts and authorization outcomes.
 */
contract AuditRegistry is AccessControl {
    bytes32 public constant LOG_LOGGER_ROLE = keccak256("LOG_LOGGER_ROLE");

    struct AuditRecord {
        uint256 id;
        address user;
        address bank;
        address tsp;
        string dataType;
        bool granted;
        string reason;
        uint256 timestamp;
    }

    AuditRecord[] private auditLogs;

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
     * @notice Logs an access request attempt and result.
     */
    function logAccessAttempt(
        address user,
        address bank,
        address tsp,
        string calldata dataType,
        bool granted,
        string calldata reason
    ) external onlyRole(LOG_LOGGER_ROLE) returns (uint256 recordId) {
        recordId = auditLogs.length;
        uint256 timestamp = block.timestamp;

        auditLogs.push(
            AuditRecord({
                id: recordId,
                user: user,
                bank: bank,
                tsp: tsp,
                dataType: dataType,
                granted: granted,
                reason: reason,
                timestamp: timestamp
            })
        );

        emit AccessAttemptLogged(recordId, user, bank, tsp, dataType, granted, reason, timestamp);
    }

    /**
     * @notice Get total audit log record count.
     */
    function getAuditLogsCount() external view returns (uint256) {
        return auditLogs.length;
    }

    /**
     * @notice Get specific audit log record by ID.
     */
    function getAuditLog(uint256 id) external view returns (
        address user,
        address bank,
        address tsp,
        string memory dataType,
        bool granted,
        string memory reason,
        uint256 timestamp
    ) {
        require(id < auditLogs.length, "Invalid log ID");
        AuditRecord storage log = auditLogs[id];
        return (log.user, log.bank, log.tsp, log.dataType, log.granted, log.reason, log.timestamp);
    }
}
