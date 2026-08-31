from __future__ import annotations

import unittest

from services.api.authorization import AssetStatus, AuthorizationContext, Operation, authorize


class AuthorizationTests(unittest.TestCase):
    def test_unknown_operation_and_inactive_identity_fail_closed(self) -> None:
        context = AuthorizationContext(True, frozenset())
        self.assertFalse(authorize("not-a-route", context).allowed)
        self.assertEqual(authorize("not-a-route", context).reason, "unknown_operation")
        inactive = AuthorizationContext(False, frozenset({"MANAGER_ROLE"}))
        self.assertEqual(authorize(Operation.REQUEST_ACCESS, inactive).reason, "identity_inactive")

    def test_read_and_request_access_policy(self) -> None:
        self.assertTrue(authorize(Operation.READ_ASSET, AuthorizationContext(True, frozenset(), owns_asset=True)).allowed)
        self.assertTrue(authorize(Operation.READ_ASSET, AuthorizationContext(True, frozenset({"AUDITOR_ROLE"}))).allowed)
        self.assertFalse(authorize(Operation.READ_ASSET, AuthorizationContext(True, frozenset())).allowed)
        self.assertTrue(authorize(Operation.REQUEST_ACCESS, AuthorizationContext(True, frozenset())).allowed)

    def test_transfer_and_lifecycle_require_manager_and_active_asset(self) -> None:
        manager = AuthorizationContext(True, frozenset({"MANAGER_ROLE"}))
        self.assertTrue(authorize(Operation.TRANSFER_ASSET, manager).allowed)
        self.assertFalse(authorize(Operation.TRANSFER_ASSET, AuthorizationContext(True, frozenset({"MANAGER_ROLE"}), asset_status=AssetStatus.SUSPENDED)).allowed)
        self.assertFalse(authorize(Operation.TRANSFER_ASSET, AuthorizationContext(True, frozenset({"MANAGER_ROLE"}), destination_identity_active=False)).allowed)
        self.assertTrue(authorize(Operation.SET_ASSET_STATUS, manager).allowed)
        self.assertFalse(authorize(Operation.SET_ASSET_STATUS, AuthorizationContext(True, frozenset({"MANAGER_ROLE"}), asset_status=AssetStatus.RETIRED)).allowed)

    def test_administration_requires_default_admin(self) -> None:
        self.assertTrue(authorize(Operation.ADMINISTER, AuthorizationContext(True, frozenset({"DEFAULT_ADMIN_ROLE"}))).allowed)
        self.assertFalse(authorize(Operation.ADMINISTER, AuthorizationContext(True, frozenset({"MANAGER_ROLE"}))).allowed)


if __name__ == "__main__":
    unittest.main()
