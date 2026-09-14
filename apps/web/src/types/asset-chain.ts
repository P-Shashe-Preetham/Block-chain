// ---------------------------------------------------------------------------
// Asset Ownership Blockchain – Type Definitions
// ---------------------------------------------------------------------------

/** The kind of mutation a block records. */
export type TransactionType = "CREATE" | "TRANSFER" | "SHARE";

/** Validation lifecycle of a block. */
export type ValidationStatus = "PENDING" | "VERIFIED" | "REJECTED";

/** Broad asset classification. */
export type AssetType =
  | "Hardware"
  | "Software"
  | "Document"
  | "Certificate"
  | "License";

// ---- Core payload stored inside a block -----------------------------------

export interface AssetData {
  assetId: string;
  assetName: string;
  assetType: AssetType;
  description: string;
}

// ---- The immutable block ---------------------------------------------------

export interface AssetBlock {
  /** Zero-based sequential index in the chain. */
  index: number;
  /** Unique block identifier (UUID v4). */
  id: string;
  /** Asset payload – identical for every block referencing the same asset. */
  assetData: AssetData;
  /** Current owner as of this block. */
  owner: string;
  /** The user/admin who authored this block. */
  createdBy: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** SHA-256 hash of the preceding block (hex). "0" for genesis. */
  previousHash: string;
  /** SHA-256 hash of this block's contents (hex). */
  currentHash: string;
  /** What this block records. */
  transactionType: TransactionType;
  /** Validation status. */
  validationStatus: ValidationStatus;
  /** Previous owner – only meaningful for TRANSFER blocks. */
  previousOwner?: string;
  /** Recipient user – only meaningful for SHARE blocks. */
  sharedWith?: string;
}

// ---- Derived view models ---------------------------------------------------

export interface TransferRecord {
  fromOwner: string;
  toOwner: string;
  blockIndex: number;
  timestamp: string;
}

export interface ShareRecord {
  sharedWith: string;
  sharedBy: string;
  blockIndex: number;
  timestamp: string;
}

export interface AssetSummary {
  assetData: AssetData;
  currentOwner: string;
  blockCount: number;
  transfers: TransferRecord[];
  shares: ShareRecord[];
  createdAt: string;
}

// ---- P2P / Peer sync -------------------------------------------------------

export interface PeerNode {
  peerId: string;
  displayName: string;
  lastSeen: string;
  blockCount: number;
}

export type PeerMessageType =
  | "BLOCK_ADDED"
  | "CHAIN_SYNC_REQUEST"
  | "CHAIN_SYNC_RESPONSE"
  | "PEER_ANNOUNCE"
  | "PEER_GOODBYE";

export interface PeerMessage {
  type: PeerMessageType;
  senderId: string;
  senderName: string;
  timestamp: string;
  payload: unknown;
}

// ---- Context value shapes --------------------------------------------------

export interface AssetChainContextValue {
  chain: AssetBlock[];
  /** Create a new asset (admin). Returns the created block. */
  createAsset: (
    data: AssetData,
    initialOwner: string,
    createdBy: string,
  ) => AssetBlock;
  /** Transfer ownership (admin). Returns the new block. */
  transferAsset: (
    assetId: string,
    newOwner: string,
    transferredBy: string,
  ) => AssetBlock;
  /** Share an asset with another user (admin). Returns the new block. */
  shareAsset: (
    assetId: string,
    recipientUser: string,
    sharedBy: string,
  ) => AssetBlock;
  /** Full history of blocks for a given asset. */
  getAssetHistory: (assetId: string) => AssetBlock[];
  /** Resolve the latest owner of an asset. */
  getCurrentOwner: (assetId: string) => string | undefined;
  /** Summarise all unique assets. */
  listAssets: () => AssetSummary[];
  /** Alias for listAssets. */
  getAssets?: () => AssetSummary[];
  /** Import an externally-received block (from P2P). */
  importBlock: (block: AssetBlock) => boolean;
  /** Whether the genesis block exists. */
  isInitialized: boolean;
}

export interface PeerSyncContextValue {
  peerId: string;
  peerName: string;
  peers: PeerNode[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  /** Broadcast a newly-created block to peers. */
  broadcastBlock: (block: AssetBlock) => void;
  /** Request full chain from peers. */
  requestSync: () => void;
}
