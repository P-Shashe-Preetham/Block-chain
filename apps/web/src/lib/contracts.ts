import { Contract, type ContractRunner } from 'ethers';

// Contract addresses - loaded from env or hardcoded for local dev
const CONTRACTS = {
  SecureAssetPlatform: import.meta.env.VITE_SECURE_ASSET_PLATFORM_ADDRESS || '',
  AccessControlManager: import.meta.env.VITE_ACCESS_CONTROL_MANAGER_ADDRESS || '',
  IdentityRegistry: import.meta.env.VITE_IDENTITY_REGISTRY_ADDRESS || '',
};

// Minimal ABIs for the functions we call from the frontend
const SECURE_ASSET_PLATFORM_ABI = [
  'function mintAndAllocateAsset(address recipient, string assetId, bytes32 metadataHash) external',
  'function transferAsset(address from, address to, uint256 tokenId) external',
  'function requestAccess(uint256 tokenId, bytes32 action, bytes32 clientProvidedHash) external',
  'function setAccessRule(uint256 tokenId, address requester, bytes32 action, bool allowed, uint64 expiresAt) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function registerIdentity(bytes32 didHash, bytes32 piiHash) external',
  'function pause() external',
  'function unpause() external',
  'event AssetMinted(uint256 indexed tokenId, string assetId, address indexed recipient, bytes32 metadataHash)',
  'event AssetTransferred(uint256 indexed tokenId, address indexed from, address indexed to)',
  'event AccessDecision(address indexed requester, uint256 indexed tokenId, string action, bool granted)',
];

const ACCESS_CONTROL_MANAGER_ABI = [
  'function requestAccess(uint256 tokenId, string action) external',
  'function setAccessRule(uint256 tokenId, address requester, string action, bool allowed, uint256 expiresAt) external',
  'function checkAccess(uint256 tokenId, address requester, string action) external view returns (bool)',
  'function hasRole(bytes32 role, address account) external view returns (bool)'
];

const IDENTITY_REGISTRY_ABI = [
  'function registerIdentity(bytes32 didHash, bytes32 piiHash) external',
  'function getIdentity(address wallet) external view returns (bytes32 didHash, bytes32 piiHash, uint8 status, uint256 registeredAt, uint256 verifiedAt, uint256 revokedAt)',
  'function hasRole(bytes32 role, address account) external view returns (bool)'
];

export function getSecureAssetPlatform(runner: ContractRunner) {
  return new Contract(CONTRACTS.SecureAssetPlatform, SECURE_ASSET_PLATFORM_ABI, runner);
}

export function getAccessControlManager(runner: ContractRunner) {
  return new Contract(CONTRACTS.AccessControlManager, ACCESS_CONTROL_MANAGER_ABI, runner);
}

export function getIdentityRegistry(runner: ContractRunner) {
  return new Contract(CONTRACTS.IdentityRegistry, IDENTITY_REGISTRY_ABI, runner);
}
