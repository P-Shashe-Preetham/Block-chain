// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IdentityRegistry} from "./IdentityRegistry.sol";
import {OrganizationRegistry} from "./OrganizationRegistry.sol";
import {ConsentManager} from "./ConsentManager.sol";

/**
 * @title AccessControlManager
 * @notice Central authorization engine verifying user identity, organization approvals, and consent status.
 */
contract AccessControlManager {
    IdentityRegistry public immutable identityRegistry;
    OrganizationRegistry public immutable organizationRegistry;
    ConsentManager public immutable consentManager;

    error InvalidAddress();
    error UserNotVerified();
    error BankNotApproved();
    error TSPNotApproved();
    error ConsentNotValid();

    event AuthorizationEvaluated(
        address indexed user,
        address indexed bank,
        address indexed tsp,
        string dataType,
        bool allowed,
        string reason
    );

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
            emit AuthorizationEvaluated(user, bank, tsp, dataType, false, "User identity inactive or pending");
            return false;
        }

        // Check 2: Bank Organization Approved
        if (!organizationRegistry.isOrganizationApproved(bank)) {
            emit AuthorizationEvaluated(user, bank, tsp, dataType, false, "Bank organization not approved");
            return false;
        }

        // Check 3: TSP Organization Approved
        if (!organizationRegistry.isOrganizationApproved(tsp)) {
            emit AuthorizationEvaluated(user, bank, tsp, dataType, false, "TSP organization not approved");
            return false;
        }

        // Check 4: Consent Active and Unexpired
        if (!consentManager.checkConsent(user, bank, tsp, dataType)) {
            emit AuthorizationEvaluated(user, bank, tsp, dataType, false, "No valid or active consent found");
            return false;
        }

        emit AuthorizationEvaluated(user, bank, tsp, dataType, true, "Authorization granted");
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
