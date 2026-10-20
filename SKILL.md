---
name: ship-to-broadcast
description: Turns the commits since the last release into a release packet (JSON manifest, grouped changelog section, announcement drafts) marked PENDING_HUMAN_APPROVAL. Never publishes. Use when preparing release notes or announcements from git history.
license: MIT
metadata:
  author: We Build for Good
  version: "2.0.0"
---

# Ship to Broadcast: Deterministic Release Packaging

Landing code on `main` is not the end of the software lifecycle. A release that sits quietly in git delivers zero commercial value; an announcement drafted by an AI hallucinating unbuilt features destroys customer trust.

The **Ship to Broadcast Engine** (`wb4g-broadcast`) bridges the gap between verified code execution and outward market communication. It deterministically compiles landed git commits into audit-grade release manifests, categorized changelogs, and multi-channel broadcast drafts with a strict, non-negotiable human approval boundary.

---

## The Prime Directive

**Never dispatch external broadcasts without deterministic commit provenance and explicit human sign-off.**

AI agents may assemble, format, and stage release materials from verified commits, but they must never publish outward communications to clients, users, or social channels autonomously.

---

## What it produces

Every run writes `release-packets/<version>/` in the repository:

1. **`RELEASE-MANIFEST.json`**: version, commit range and how it was chosen, head SHA, the commits, counts by type, diff stats, and check results only when a caller supplied them with `--gates` (otherwise `"NOT_RECORDED"`).
2. **`CHANGELOG.md`**: commits grouped by conventional-commit type, with GitHub commit links.
3. **`BROADCAST-PENDING.md`**: summary, customer notes, and social drafts, stamped `PENDING HUMAN APPROVAL`.

## Rules for the agent

* **Never send, post, or publish the drafts.** Hand `BROADCAST-PENDING.md` to a human.
* **Rewrite before review.** The drafts are commit messages, not customer copy. Remove anything internal, and never add a feature that is not in the commit list.
* **Never claim the release was verified** unless real check results were passed with `--gates` and all passed. The tool enforces this in its own drafts; keep it true in your rewrite.
* **Choose the range on purpose** with `--since <last-release-tag>`. If there are no tags, the tool uses at most the last 15 commits and says so in the manifest.

## CLI

```bash
node bin/ship-broadcast.mjs --dir path/to/repo --version v1.2.0 --since v1.1.0
node bin/ship-broadcast.mjs --dir path/to/repo --version v1.2.0 --update-changelog   # skipped if already there
node bin/ship-broadcast.mjs --gates check-results.json --json
```

Exit codes: `0` packet written, `1` error (bad ref, empty range, invalid version), `2` bad options.

## With the other gates

`skill-safe-deploy` runs the invariant engine and visual audit first, then runs this tool with their real results.
