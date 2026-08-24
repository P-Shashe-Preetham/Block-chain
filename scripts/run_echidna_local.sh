#!/usr/bin/env bash
# Canonical contract assurance: a pinned Echidna image runs the same property limits as the protected fuzz workflow.
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Echidna local campaign requires Docker; use the protected fuzz workflow when Docker is unavailable." >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
image="trailofbits/echidna@sha256:80f90c3a727986fc31380a509a87fe0a14cdbda13f4ead102b2d7ffaff285261"
network_args=()
if [[ -n "${ECHIDNA_DOCKER_NETWORK:-}" ]]; then
  network_args=(--network "${ECHIDNA_DOCKER_NETWORK}")
fi

docker run --rm "${network_args[@]}" -v "${repo_root}:/src" -w /src "${image}" sh -lc '
  solc-select install 0.8.24
  solc-select use 0.8.24
  echidna-test contracts/test/SecureAssetPlatformEchidna.sol \
    --contract SecureAssetPlatformEchidna \
    --test-mode property \
    --test-limit 1000 \
    --seq-len 20 \
    --crytic-args "--compile-force-framework solc" \
    --solc-args "--base-path . --include-path node_modules"
'
