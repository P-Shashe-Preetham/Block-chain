from locust import HttpUser, task, between
import uuid
import time
import random

class SIHPlatformUser(HttpUser):
    # Wait between 0.1 and 0.5 seconds between tasks
    wait_time = between(0.1, 0.5)

    @task(3)
    def test_get_nonce(self):
        """Test the high-throughput, low-compute nonce generation endpoint."""
        # Generate a random valid ethereum address format
        dummy_address = f"0x{random.randbytes(20).hex()}"
        with self.client.get(f"/api/auth/nonce?public_address={dummy_address}", name="/api/auth/nonce", catch_response=True) as response:
            if response.status_code in [200, 422]: # 422 is possible if address validation is strict
                response.success()

    @task(2)
    def test_hash_metadata(self):
        """Test the compute-heavy cryptographic hashing endpoint."""
        payload = {
            "fileContent": f"CONFIDENTIAL_ASSET_DATA_{uuid.uuid4()}",
            "serialUUID": str(uuid.uuid4()),
            "timestamp": str(int(time.time()))
        }
        with self.client.post("/api/auth/hash-metadata", json=payload, name="/api/auth/hash-metadata", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed with status: {response.status_code}")

    @task(1)
    def test_unauthorized_access(self):
        """Test the RBAC rejection efficiency (without a token)."""
        with self.client.get("/api/auth/me", name="/api/auth/me (Unauthorized)", catch_response=True) as response:
            if response.status_code in [401, 403]: # Expecting authorization failure
                response.success()
            else:
                response.failure(f"Expected 401/403, got {response.status_code}")
        
    @task(1)
    def test_audit_logs_unauthorized(self):
        """Test incident log fetch rejection."""
        with self.client.get("/api/audit/incidents", name="/api/audit/incidents (Unauthorized)", catch_response=True) as response:
             if response.status_code in [401, 403]:
                response.success()
             else:
                response.failure(f"Expected 401/403, got {response.status_code}")
