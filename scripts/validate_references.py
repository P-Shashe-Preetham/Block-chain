from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
URLS = [
    "https://github.com/spruceid/ssi",
    "https://github.com/identity-com/sol-did",
    "https://github.com/OpenZeppelin/openzeppelin-contracts",
    "https://github.com/tomhirst/nft-minting-dapp-starter",
    "https://github.com/Markkop/nft-marketplace",
    "https://github.com/obinnafranklinduru/NFT-MarketPlace",
    "https://github.com/furkanenesdagli/NFT_auction",
    "https://github.com/FIWARE/decentralized-iam",
    "https://github.com/Saurav-Navdhare/NFT-CredentialManagementSystem",
    "https://github.com/akash70629/FileChain",
    "https://github.com/El-hacen21/encryptoNFT",
    "https://github.com/fileverse/self-hosted-public-drive",
    "https://github.com/hkhuang07/asset-management-sawtooth",
    "https://github.com/hiero-ledger/heka-identity-platform",
    "https://github.com/WeBankBlockchain/WeIdentity",
]

failures = []
catalog = (ROOT / "docs/REFERENCED-REPOSITORIES.md").read_text(encoding="utf-8")
notices = (ROOT / "THIRD-PARTY-NOTICES.md").read_text(encoding="utf-8")
integration = (ROOT / "docs/REFERENCE-INTEGRATION.md").read_text(encoding="utf-8")
for url in URLS:
    if catalog.count(url) < 2:
        failures.append(f"catalog must contain the canonical URL in its entry and References section: {url}")
    if notices.count(url) != 1:
        failures.append(f"notices must contain exactly one canonical URL: {url}")

ledger = (ROOT / "docs/reference-ledger.md").read_text(encoding="utf-8")
ledger_rows = re.findall(r"^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\((https?://[^)]+)\)\s*\|", ledger, flags=re.MULTILINE)
if len(ledger_rows) != 96:
    failures.append(f"reference ledger must contain exactly 96 source records, found {len(ledger_rows)}")
ledger_urls = [url for _, _, url in ledger_rows]
if len(set(ledger_urls)) != len(ledger_urls):
    failures.append("reference ledger contains duplicate source URLs")
for url in URLS:
    if url not in ledger_urls:
        failures.append(f"original curated URL is missing from complete reference ledger: {url}")
if "## Adoption rules" not in ledger or "Pending owner-led review" not in ledger:
    failures.append("reference ledger is missing its adoption-boundary or non-fabrication language")

for rel in ["docs/REFERENCED-REPOSITORIES.md", "docs/REFERENCE-INTEGRATION.md", "THIRD-PARTY-NOTICES.md"]:
    text = (ROOT / rel).read_text(encoding="utf-8")
    if "## References" not in text:
        failures.append(f"missing References section: {rel}")

if (ROOT / ".gitmodules").exists():
    failures.append(".gitmodules is not allowed for curated reference integration")

package = (ROOT / "package.json").read_text(encoding="utf-8")
for forbidden in ["spruceid/ssi", "identity-com/sol-did", "tomhirst/nft-minting-dapp-starter", "Markkop/nft-marketplace", "FIWARE/decentralized-iam", "fileverse/self-hosted-public-drive", "WeBankBlockchain/WeIdentity"]:
    if forbidden in package:
        failures.append(f"reference-only repository appears in package.json: {forbidden}")

if "OpenZeppelin/openzeppelin-contracts" not in catalog or "@openzeppelin/contracts" not in package:
    failures.append("OpenZeppelin adoption is not traceable in both catalog and package.json")

if not re.search(r"reviewed on \*\*2026-08-21\*\*", catalog):
    failures.append("catalog is missing its review date")

if failures:
    print("FAIL")
    print("\n".join(f"- {failure}" for failure in failures))
    sys.exit(1)

print(f"PASS: preserved and traced {len(URLS)} original references plus {len(ledger_rows)} total ledger records with no submodules or unapproved package integrations")
