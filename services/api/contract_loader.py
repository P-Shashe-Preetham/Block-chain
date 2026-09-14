import json
import os
from pathlib import Path

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

def load_deployment_addresses() -> dict:
    """Load deployed contract addresses from deployments/local.json."""
    deploy_file = os.environ.get(
        "CONTRACT_ADDRESSES_FILE",
        str(BASE_DIR / "deployments" / "local.json")
    )
    try:
        with open(deploy_file, "r") as f:
            data = json.load(f)
            return data.get("contracts", {})
    except FileNotFoundError:
        print(f"Warning: Deployment file not found at {deploy_file}. Using empty addresses.")
        return {}

def load_contract_abi(contract_name: str) -> list:
    """Load contract ABI from Hardhat artifacts."""
    # Try standard Hardhat artifact path
    artifact_path = BASE_DIR / "artifacts" / "contracts" / f"{contract_name}.sol" / f"{contract_name}.json"
    if artifact_path.exists():
        with open(artifact_path, "r") as f:
            data = json.load(f)
            return data.get("abi", [])
    
    # Fallback: look in typechain-types
    typechain_path = BASE_DIR / "typechain-types" / "factories" / f"{contract_name}__factory.ts"
    if typechain_path.exists():
        print(f"Warning: Found TypeChain factory but not JSON ABI for {contract_name}")
    
    print(f"Warning: Could not find ABI for {contract_name}")
    return []
