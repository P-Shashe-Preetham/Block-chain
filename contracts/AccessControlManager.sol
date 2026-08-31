// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IdentityRegistry} from "./IdentityRegistry.sol";
import {OrganizationRegistry} from "./OrganizationRegistry.sol";
import {ConsentManager} from "./ConsentManager.sol";

interface IAuditRegistry {
    function logAccessAttempt(
        address user,
        address bank,
        address tsp,
        string calldata dataType,
        bool granted,
        string calldata reason
    ) external returns (uint256 recordId);
}

/**
 * @title AccessControlManager
 * @notice Central authorization engine verifying user identity, organization approvals, and consent status.
 */
contract AccessControlManager {
    IdentityRegistry public immutable identityRegistry;
    OrganizationRegistry public immutable organizationRegistry;
    ConsentManager public immutable consentManager;
    address public auditRegistry;
    address public immutable owner;

    error InvalidAddress();
    error UserNotVerified();
    error BankNotApproved();
    error TSPNotApproved();
    error ConsentNotValid();
    error Unauthorized();

    event AuthorizationEvaluated(
        address indexed user,
        address indexed bank,
        address indexed tsp,
        string dataType,
        bool allowed,
        string reason
    );

    event AuditRegistryUpdated(address indexed newAuditRegistry);

    constructor(
        address _identityRegistry,
        address _organizationRegistry,
        address _consentManager
    ) {
        if (_identityRegistry == address(0) || _organizationRegistry == address(0) || _consentManager == address(0)) {
            revert InvalidAddress();
        }
        identityRegistry = IdentityRegistry(_identityRegistry);
        organizationRegistry = OrganizationRegistry(_organizationRegistry);
        consentManager = ConsentManager(_consentManager);
        owner = msg.sender;
    }

    /**
     * @notice Link the AuditRegistry to forward on-chain audit event logs automatically.
     */
    function setAuditRegistry(address _auditRegistry) external {
        if (msg.sender != owner) revert Unauthorized();
        auditRegistry = _auditRegistry;
        emit AuditRegistryUpdated(_auditRegistry);
    }

    function _recordDecision(
        address user,
        address bank,
        address tsp,
        string calldata dataType,
        bool allowed,
        string memory reason
    ) internal {
        emit AuthorizationEvaluated(user, bank, tsp, dataType, allowed, reason);
        if (auditRegistry != address(0)) {
            try IAuditRegistry(auditRegistry).logAccessAttempt(user, bank, tsp, dataType, allowed, reason) {} catch {}
        }
    }

    /**
     * @notice Evaluates whether a TSP can access a user's data from a Bank.
     * @return true only if all 4 security checks pass.
     */
    function isAccessAllowed(
        address user,
        address bank,
        address tsp,
        string calldata dataType
    ) external returns (bool) {
        // Check 1: User Identity Active
        if (!identityRegistry.isIdentityActive(user)) {
            _recordDecision(user, bank, tsp, dataType, false, "User identity inactive or pending");
            return false;
        }

        // Check 2: Bank Organization Approved
        if (!organizationRegistry.isOrganizationApproved(bank)) {
            _recordDecision(user, bank, tsp, dataType, false, "Bank organization not approved");
            return false;
        }

        // Check 3: TSP Organization Approved
        if (!organizationRegistry.isOrganizationApproved(tsp)) {
            _recordDecision(user, bank, tsp, dataType, false, "TSP organization not approved");
            return false;
        }

        // Check 4: Consent Active and Unexpired
        if (!consentManager.checkConsent(user, bank, tsp, dataType)) {
            _recordDecision(user, bank, tsp, dataType, false, "No valid or active consent found");
            return false;
        }

        _recordDecision(user, bank, tsp, dataType, true, "Authorization granted");
        return true;
    }

    /**
     * @notice Pure view evaluation of access permissions without emitting events.
     */
    function checkAccessAllowedView(
        address user,
        address bank,
        address tsp,
        string calldata dataType
    ) external view returns (bool allowed, string memory reason) {
        if (!identityRegistry.isIdentityActive(user)) {
            return (false, "User identity inactive or pending");
        }
        if (!organizationRegistry.isOrganizationApproved(bank)) {
            return (false, "Bank organization not approved");
        }
        if (!organizationRegistry.isOrganizationApproved(tsp)) {
            return (false, "TSP organization not approved");
        }
        if (!consentManager.checkConsent(user, bank, tsp, dataType)) {
            return (false, "No valid or active consent found");
        }
        return (true, "Authorization granted");
    }
}