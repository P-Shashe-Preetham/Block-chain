"""Read-only reconciliation between canonical contract reads and projections.

The contract remains authoritative. This module reports drift and never mutates
the projection or invents a repair decision; production repair requires an
approved operator workflow and durable audit record.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal


DriftKind = Literal["missing_projection", "unexpected_projection", "value_mismatch"]


@dataclass(frozen=True)
class Drift:
    key: str
    kind: DriftKind
    canonical_value: str | None
    projected_value: str | None


def find_drift(
    canonical: Mapping[str, str],
    projected: Mapping[str, str],
) -> tuple[Drift, ...]:
    """Return deterministic drift records without modifying either input mapping."""
    if any(not isinstance(key, str) or not key for key in canonical) or any(not isinstance(key, str) or not key for key in projected):
        raise ValueError("reconciliation keys must be non-empty strings")
    if any(not isinstance(value, str) for value in canonical.values()) or any(not isinstance(value, str) for value in projected.values()):
        raise ValueError("reconciliation values must be strings")

    drifts: list[Drift] = []
    for key in sorted(set(canonical) | set(projected)):
        if key not in projected:
            drifts.append(Drift(key, "missing_projection", canonical[key], None))
        elif key not in canonical:
            drifts.append(Drift(key, "unexpected_projection", None, projected[key]))
        elif canonical[key] != projected[key]:
            drifts.append(Drift(key, "value_mismatch", canonical[key], projected[key]))
    return tuple(drifts)
