// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SecureAssetPlatform} from "../SecureAssetPlatform.sol";

/// @notice Echidna-only invariant harness for the local MVP contract.
/// @dev This harness is not deployed as a production contract.
contract SecureAssetPlatformEchidna is SecureAssetPlatform {
    constructor() SecureAssetPlatform(address(this)) {}

    function echidna_default_admin_remains_self() external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, address(this));
    }

    function echidna_approval_surface_is_disabled() external returns (bool) {
        (bool succeeded,) = address(this).call(
            abi.encodeWithSignature("approve(address,uint256)", address(0), 0)
        );
        return !succeeded;
    }
}
