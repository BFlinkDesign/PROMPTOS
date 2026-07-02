#!/usr/bin/env python3
"""Harvest PROMPTOS usage receipts from local repos into a scoreboard.

Stdlib-only. Sweeps the given roots for receipt lines (agent/RECEIPTS.log,
ERRORS.md, RECEIPTS.log), dedupes them into telemetry/usage.jsonl, and
regenerates telemetry/SCOREBOARD.md with a verdict per block:

  VERIFIED-BY-USE  >=3 receipts and wins > losses
  WATCH            losses >= wins (and at least one receipt)
  UNPROVEN         zero receipts anywhere
  DECAYING         unproven-or-quiet for > STALE_DAYS

Usage:
  python telemetry/harvest.py --roots C:/path/repo1 C:/path/repo2
  python telemetry/harvest.py --selftest        # synthetic fixture, no I/O outside temp

Run it on a schedule; commit the refreshed scoreboard via PR (human gate).
"""

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
STALE_DAYS = 45

RECEIPT = re.compile(
    r"PROMPTOS-RECEIPT:\s*"
    r"block=(?P<block>[a-z0-9-]+)\s+"
    r"v=(?P<v>[0-9.]+)\s+"
    r"outcome=(?P<outcome>win|loss|neutral)\s+"
    r'gate="(?P<gate>[^"]*)"\s*'
    r'(?:note="(?P<note>[^"]*)"\s*)?'
    r"(?:repo=(?P<repo>[^\s]+)\s*)?"
    r"(?:date=(?P<date>\d{4}-\d{2}-\d{2}))?"
)

LEDGER_NAMES = ("RECEIPTS.log", "ERRORS.md")


def known_blocks():
    """Block ids + versions from the prompts/ headers — the census."""
    head = re.compile(r"<!-- promptos-block: id=([a-z0-9-]+) v=([0-9.]+) -->")
    out = {}
    for p in sorted((REPO / "prompts").glob("*.md")):
        m = head.search(p.read_text(encoding="utf-8", errors="replace")[:200])
        if m:
            out[m.group(1)] = m.group(2)
    return out


def sweep(roots):
    receipts = []
    for root in roots:
        root = Path(root)
        if not root.exists():
            print(f"WARN root missing: {root}", file=sys.stderr)
            continue
        for name in LEDGER_NAMES:
            for f in root.rglob(name):
                if ".git" in f.parts:
                    continue
                try:
                    text = f.read_text(encoding="utf-8", errors="replace")
                except OSError as e:
                    print(f"WARN unreadable {f}: {e}", file=sys.stderr)
                    continue
                for line in text.splitlines():
                    m = RECEIPT.search(line)
                    if m:
                        d = m.groupdict()
                        d["source"] = str(f)
                        d["hash"] = hashlib.sha256(line.strip().encode()).hexdigest()[
                            :16
                        ]
                        receipts.append(d)
    return receipts


def load_jsonl(path):
    if not path.exists():
        return []
    return [
        json.loads(x)
        for x in path.read_text(encoding="utf-8").splitlines()
        if x.strip()
    ]


def scoreboard(census, receipts, today):
    rows = []
    by_block = {}
    for r in receipts:
        by_block.setdefault(r["block"], []).append(r)
    for bid, ver in sorted(census.items()):
        rs = by_block.get(bid, [])
        wins = sum(1 for r in rs if r["outcome"] == "win")
        losses = sum(1 for r in rs if r["outcome"] == "loss")
        dates = sorted(r["date"] for r in rs if r.get("date"))
        last = dates[-1] if dates else None
        if not rs:
            verdict = "UNPROVEN"
        elif losses >= wins:
            verdict = "WATCH"
        elif len(rs) >= 3:
            verdict = "VERIFIED-BY-USE"
        else:
            verdict = "USED (thin)"
        if last:
            age = (today - dt.date.fromisoformat(last)).days
            if age > STALE_DAYS:
                verdict += " · DECAYING"
        elif not rs:
            verdict = "UNPROVEN · DECAYING-CANDIDATE"
        rows.append((bid, ver, len(rs), wins, losses, last or "—", verdict))
    unknown = sorted(set(by_block) - set(census))
    return rows, unknown


def render(rows, unknown, today):
    out = [
        "# Block scoreboard (generated — do not hand-edit)",
        "",
        f"Generated {today} by `telemetry/harvest.py`. Verdicts: receipts decide,",
        "not opinion. Amendment PRs cite receipt lines from `usage.jsonl`.",
        "",
        "| Block | v | Uses | Win | Loss | Last used | Verdict |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for bid, ver, uses, w, l, last, verdict in rows:
        out.append(f"| {bid} | {ver} | {uses} | {w} | {l} | {last} | {verdict} |")
    if unknown:
        out += [
            "",
            "**Receipts for unknown block ids (typo or retired block):** "
            + ", ".join(unknown),
        ]
    out += [
        "",
        "Loop: WATCH/DECAYING blocks are amendment candidates —",
        "see [RECEIPTS.md](RECEIPTS.md) for the evidence-gated evolution policy.",
        "",
    ]
    return "\n".join(out)


def selftest():
    """RED then GREEN: malformed lines rejected, well-formed parsed, verdicts correct."""
    with tempfile.TemporaryDirectory() as td:
        repo = Path(td) / "proj" / "agent"
        repo.mkdir(parents=True)
        (repo / "RECEIPTS.log").write_text(
            "\n".join(
                [
                    'PROMPTOS-RECEIPT: block=model-router v=1.1 outcome=win gate="ROUTE lines audited 7/7" note="" repo=proj date=2026-07-01',
                    'PROMPTOS-RECEIPT: block=model-router v=1.1 outcome=win gate="frontier spend 12% of tokens" repo=proj date=2026-07-02',
                    'PROMPTOS-RECEIPT: block=model-router v=1.1 outcome=win gate="two-failure escalation fired correctly" repo=proj date=2026-07-02',
                    'PROMPTOS-RECEIPT: block=safe-cutover v=1.0 outcome=loss gate="rollback rehearsal failed: flag not reversible" repo=proj date=2026-06-30',
                    "PROMPTOS-RECEIPT: block=BAD OUTCOME missing everything",  # must NOT parse
                    'PROMPTOS-RECEIPT: block=ghost-block v=9.9 outcome=win gate="x" repo=proj date=2026-07-01',
                ]
            ),
            encoding="utf-8",
        )
        rs = sweep([td])
        assert len(rs) == 5, f"expected 5 parsed receipts, got {len(rs)}"
        assert not any(r["block"] == "BAD" for r in rs), "malformed line must not parse"
        census = {
            "model-router": "1.1",
            "safe-cutover": "1.0",
            "grounded-answer": "1.0",
        }
        rows, unknown = scoreboard(census, rs, dt.date(2026, 7, 2))
        table = {r[0]: r for r in rows}
        assert table["model-router"][6].startswith("VERIFIED-BY-USE"), table[
            "model-router"
        ]
        assert table["safe-cutover"][6].startswith("WATCH"), table["safe-cutover"]
        assert table["grounded-answer"][6].startswith("UNPROVEN"), table[
            "grounded-answer"
        ]
        assert unknown == ["ghost-block"], unknown
    print(
        "SELFTEST PASS: 5/5 parsed, malformed rejected, verdicts VERIFIED/WATCH/UNPROVEN correct, unknown-id flagged"
    )
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--roots", nargs="*", default=[])
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    if not args.roots:
        ap.error("--roots required (or --selftest)")
    today = dt.date.today()
    census = known_blocks()
    found = sweep(args.roots)
    usage = HERE / "usage.jsonl"
    seen = {r["hash"] for r in load_jsonl(usage)}
    fresh = [r for r in found if r["hash"] not in seen]
    with usage.open("a", encoding="utf-8") as fh:
        for r in fresh:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    allr = load_jsonl(usage)
    rows, unknown = scoreboard(census, allr, today)
    (HERE / "SCOREBOARD.md").write_text(render(rows, unknown, today), encoding="utf-8")
    print(
        f"harvested {len(fresh)} new / {len(allr)} total receipts across {len(census)} blocks -> SCOREBOARD.md"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
