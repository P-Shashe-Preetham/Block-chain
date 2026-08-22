#!/usr/bin/env python3
"""Validate Markdown pipe-table column continuity in repository documentation."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCUMENTS = [ROOT / "README.md", ROOT / "CONTRIBUTING.md", *sorted((ROOT / "docs").glob("*.md"))]


def cells(line: str) -> list[str]:
    content = line.strip()
    if not content.startswith("|"):
        return []
    values: list[str] = []
    current: list[str] = []
    inline_code = False
    for position, character in enumerate(content[1:], start=1):
        if character == "`":
            inline_code = not inline_code
        if character == "|" and not inline_code and position != len(content) - 1:
            values.append("".join(current).strip())
            current = []
        else:
            current.append(character)
    values.append("".join(current).strip())
    return values


def is_separator(line: str, expected_columns: int | None = None) -> bool:
    values = cells(line)
    if expected_columns is not None and len(values) != expected_columns:
        return False
    return bool(values) and all(value.replace(":", "").replace("-", "") == "" and value.count("-") >= 3 for value in values)


def validate(path: Path) -> list[str]:
    errors: list[str] = []
    lines = path.read_text(encoding="utf-8").splitlines()
    fenced = False
    index = 0
    while index < len(lines):
        stripped = lines[index].strip()
        if stripped.startswith("```"):
            fenced = not fenced
            index += 1
            continue
        if fenced or not stripped.startswith("|") or index + 1 >= len(lines):
            index += 1
            continue
        header_columns = len(cells(lines[index]))
        if header_columns < 1 or not is_separator(lines[index + 1], header_columns):
            index += 1
            continue
        row = index + 2
        while row < len(lines) and lines[row].strip().startswith("|"):
            if len(cells(lines[row])) != header_columns:
                errors.append(
                    f"{path.relative_to(ROOT)}:{row + 1}: expected {header_columns} columns, found {len(cells(lines[row]))}"
                )
            row += 1
        index = row
    return errors


def main() -> int:
    errors = [error for path in DOCUMENTS if path.exists() for error in validate(path)]
    if errors:
        print("Markdown table validation failed:")
        print("\n".join(errors))
        return 1
    print(f"Markdown table validation passed for {len([path for path in DOCUMENTS if path.exists()])} documents")
    return 0


if __name__ == "__main__":
    sys.exit(main())
