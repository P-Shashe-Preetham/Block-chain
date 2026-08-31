// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SecureAssetPlatform} from "../SecureAssetPlatform.sol";

/// @notice Echidna-only stateful invariant harness for the local MVP contract.
/// @dev This harness is not deployed as a production contract. The wrappers
/// deliberately use self-calls so Echidna can explore valid and reverting
/// sequences without introducing privileged authority not present in the MVP.
contract SecureAssetPlatformEchidna is SecureAssetPlatform {
    uint256 private constant MAX_TRACKED_IDENTITIES = 8;
    uint256 private constant MAX_TRACKED_ASSETS = 8;

    address[] private _trackedSubjects;
    bytes32[] private _trackedDidHashes;
    uint256 private _trackedAssetCount;

    constructor() SecureAssetPlatform(address(this)) {}

    function registerTrackedIdentity(address subject, bytes32 didHash) external {
        (bool succeeded,) = address(this).call(
            abi.encodeWithSelector(this.registerIdentity.selector, subject, didHash)
        );
        if (succeeded && _trackedSubjects.length < MAX_TRACKED_IDENTITIES) {
            _trackedSubjects.push(subject);
            _trackedDidHashes.push(didHash);
        }
    }

    function replaceTrackedIdentityKey(address oldSubject, address newSubject, bytes32 newDidHash) external {
        (bool succeeded,) = address(this).call(
            abi.encodeWithSelector(this.replaceIdentityKey.selector, oldSubject, newSubject, newDidHash)
        );
        if (succeeded && _trackedSubjects.length < MAX_TRACKED_IDENTITIES) {
            _trackedSubjects.push(newSubject);
            _trackedDidHashes.push(newDidHash);
        }
    }

    function grantSelfManagerRole() external returns (bool succeeded) {
        (succeeded,) = address(this).call(
            abi.encodeWithSelector(this.grantRole.selector, MANAGER_ROLE, address(this))
        );
    }

    function revokeTrackedManagerRole(address subject) external returns (bool succeeded) {
        (succeeded,) = address(this).call(
            abi.encodeWithSelector(this.revokeRole.selector, MANAGER_ROLE, subject)
        );
    }

    function mintTrackedAsset(bytes32 assetId, bytes32 metadataHash) external {
        (bool succeeded,) = address(this).call(
            abi.encodeWithSelector(this.mintAndAllocateAsset.selector, address(this), assetId, metadataHash)
        );
        if (succeeded && _trackedAssetCount < MAX_TRACKED_ASSETS) {
            _trackedAssetCount += 1;
        }
    }

    function setTrackedAssetStatus(uint256 tokenId, AssetStatus status) external returns (bool succeeded) {
        (succeeded,) = address(this).call(abi.encodeWithSelector(this.setAssetStatus.selector, tokenId, status));
    }

    function setTrackedAccessRule(uint256 tokenId, bytes32 action, bool allowed, uint64 expiresAt)
        external
        returns (bool succeeded)
    {
        (succeeded,) = address(this).call(
            abi.encodeWithSelector(this.setAccessRule.selector, tokenId, address(this), action, allowed, expiresAt)
        );
    }

    function togglePause() external returns (bool succeeded) {
        if (paused()) {
            (succeeded,) = address(this).call(abi.encodeWithSelector(this.unpause.selector));
        } else {
            (succeeded,) = address(this).call(abi.encodeWithSelector(this.pause.selector));
        }
    }

    function echidna_default_admin_remains_self() external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, address(this));
    }

    function echidna_approval_surface_is_disabled() external returns (bool) {
        (bool succeeded,) = address(this).call(
            abi.encodeWithSignature("approve(address,uint256)", address(0), 0)
        );
        return !succeeded;
    }

    function echidna_did_reverse_mapping_is_consistent() external view returns (bool) {
        for (uint256 index = 0; index < _trackedDidHashes.length; index++) {
            if (identityByDidHash[_trackedDidHashes[index]] != _trackedSubjects[index]) return false;
        }
        return true;
    }

    function echidna_inactive_tracked_subjects_have_no_privileged_roles() external view returns (bool) {
        for (uint256 index = 0; index < _trackedSubjects.length; index++) {
            if (!identityRegistry[_trackedSubjects[index]].isActive) {
                if (hasRole(MANAGER_ROLE, _trackedSubjects[index])) return false;
                if (hasRole(AUDITOR_ROLE, _trackedSubjects[index])) return false;
                if (hasRole(USER_ROLE, _trackedSubjects[index])) return false;
            }
        }
        return true;
    }

    function echidna_tracked_asset_status_is_known() external view returns (bool) {
        for (uint256 tokenId = 0; tokenId < _trackedAssetCount; tokenId++) {
            if (uint8(assetStatus[tokenId]) > uint8(AssetStatus.RETIRED)) return false;
        }
        return true;
    }

    function echidna_terminal_tracked_asset_cannot_transfer() external returns (bool) {
        for (uint256 tokenId = 0; tokenId < _trackedAssetCount; tokenId++) {
            if (assetStatus[tokenId] == AssetStatus.ACTIVE) continue;
            address owner = _ownerOf(tokenId);
            if (owner == address(0)) continue;
            (bool succeeded,) = address(this).call(
                abi.encodeWithSelector(this.transferAsset.selector, owner, address(this), tokenId)
            );
            if (succeeded) return false;
        }
        return true;
    }

    function echidna_access_rules_are_for_known_actions() external view returns (bool) {
        for (uint256 tokenId = 0; tokenId < _trackedAssetCount; tokenId++) {
            AccessRule memory rule = accessRules[tokenId][bytes32(0)][address(this)];
            if (rule.exists) return false;
        }
        return true;
    }

    function echidna_pause_does_not_clear_default_admin() external view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, address(this));
    }
}
