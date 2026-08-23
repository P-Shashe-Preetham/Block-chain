import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Interface } from "ethers";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = path.join(root, "artifacts/contracts/SecureAssetPlatform.sol/SecureAssetPlatform.json");
const decoderPath = path.join(root, "services/indexer/abi.py");
if (!fs.existsSync(artifactPath)) {
  throw new Error(`canonical ABI artifact is missing: ${artifactPath}; run hardhat build first`);
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const iface = new Interface(artifact.abi);
const canonical = new Map(
  iface.fragments
    .filter((fragment) => fragment.type === "event")
    .map((fragment) => [fragment.name, iface.getEvent(fragment.name).topicHash]),
);
const decoder = fs.readFileSync(decoderPath, "utf8");
const observed = new Map();
for (const match of decoder.matchAll(/_EventSpec\("([A-Za-z0-9_]+)",\s*"(0x[0-9a-fA-F]{64})"/g)) {
  observed.set(match[1], match[2].toLowerCase());
}
if (observed.size !== canonical.size) {
  throw new Error(`ABI event count mismatch: decoder=${observed.size}, artifact=${canonical.size}`);
}
for (const [name, topic] of canonical) {
  if (observed.get(name) !== topic.toLowerCase()) {
    throw new Error(`ABI topic mismatch for ${name}: decoder=${observed.get(name)}, artifact=${topic}`);
  }
}
console.log(`Indexer ABI validation passed for ${canonical.size} compiled event fragments`);
