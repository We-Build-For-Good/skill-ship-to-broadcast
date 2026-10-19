---
name: ship-to-broadcast
description: Deterministic release packaging and multi-channel broadcast generator. Compiles git commits into structured release manifests, categorized changelogs, and staged announcements with strict human approval boundaries.
license: MIT
metadata:
  author: We Build for Good
  version: "1.0.0"
---

# Ship to Broadcast: Deterministic Release Packaging

Landing code on `main` is not the end of the software lifecycle. A release that sits quietly in git delivers zero commercial value; an announcement drafted by an AI hallucinating unbuilt features destroys customer trust.

The **Ship to Broadcast Engine** (`wb4g-broadcast`) bridges the gap between verified code execution and outward market communication. It deterministically compiles landed git commits into audit-grade release manifests, categorized changelogs, and multi-channel broadcast drafts with a strict, non-negotiable human approval boundary.

---

## The Prime Directive

**Never dispatch external broadcasts without deterministic commit provenance and explicit human sign-off.**

AI agents may assemble, format, and stage release materials from verified commits, but they must never publish outward communications to clients, users, or social channels autonomously.

---

## Release Artifacts

Every release invocation produces a versioned packet inside `./release-packets/<version>/`:

### 1. The Release Manifest (`RELEASE-MANIFEST.json`)
* **Purpose:** Audit-grade ledger of the release for clients, compliance, and internal tracking.
* **Fields:** Release ID, version, timestamp, git head SHA, commit range, categorized summary, diff statistics (files changed, insertions, deletions), and verification gate attestations.

### 2. The Categorized Changelog (`CHANGELOG.md`)
* **Purpose:** Human-readable release notes conforming to Keep a Changelog standards.
* **Sections:** Features & Capabilities (`feat`), Bug Fixes & Reliability (`fix`), Performance (`perf`), Studio Invariants & Discipline (`rule`, `inv`), Refactoring (`refactor`), and Maintenance (`chore`, `docs`).
* **Links:** Automatic GitHub commit links mapped to repository origin.

### 3. The Broadcast Packet (`BROADCAST-PENDING.md`)
* **Purpose:** Staged communications ready for founder or executive review.
* **Channels Included:**
  - Executive / Client Brief: Business value delivered with zero technical jargon.
  - Customer Release Notes: Public-facing bulleted updates.
  - Short-Form Social Drafts: Ready for X / Twitter, LinkedIn, and Slack announcement channels.
* **Status:** Stamped with `STATUS: PENDING_HUMAN_APPROVAL`.

---

## CLI Usage

### Basic Release Packaging
Run in the current repository:
```bash
node /Users/lizzie/wb4g-skills/skill-ship-to-broadcast/bin/ship-broadcast.mjs
```

### Specify Version and Target Directory
```bash
node /Users/lizzie/wb4g-skills/skill-ship-to-broadcast/bin/ship-broadcast.mjs --dir /Users/lizzie/departure-alarm --version v1.2.0
```

### Prepend to Repository Root CHANGELOG.md
```bash
node /Users/lizzie/wb4g-skills/skill-ship-to-broadcast/bin/ship-broadcast.mjs --dir /Users/lizzie/departure-alarm --version v1.2.0 --update-changelog
```

### Machine-Readable JSON Manifest Output
```bash
node /Users/lizzie/wb4g-skills/skill-ship-to-broadcast/bin/ship-broadcast.mjs --json
```

---

## The Complete Three-Gate Autonomous Pipeline

The We Build for Good studio workflow operates across three sequential gates:

1. **Gate 1: Policy & Syntax Discipline (`skill-system-invariant-engine`)**
   Enforces character invariants (no em dashes), Prettier formatting, file boundaries (<400 lines), and brand integrity.
2. **Gate 2: Sensory Perception (`skill-visual-sensory-audit`)**
   Drives headless Chrome across mobile, tablet, and desktop viewports to catch layout blowouts, broken assets, and runtime errors.
3. **Gate 3: Packaging & Broadcast (`skill-ship-to-broadcast`)**
   Compiles verified changes into release manifests, changelogs, and human-gated broadcast packets.

Only when all three gates have executed cleanly is work considered complete.
