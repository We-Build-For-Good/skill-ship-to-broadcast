# Ship to Broadcast Release Pipeline (`@webuildforgood/skill-ship-to-broadcast`)

Deterministic release packaging and multi-channel broadcast generator for agentic coding workflows.

Landing code on `main` is not the end of the software lifecycle. A release that sits quietly in git delivers zero commercial value; an announcement drafted by an AI hallucinating unbuilt features destroys customer trust.

The **Ship to Broadcast Engine** (`wb4g-broadcast`) bridges the gap between verified code execution and outward market communication. It deterministically compiles landed git commits into audit-grade release manifests, categorized changelogs, and multi-channel broadcast drafts with a strict, non-negotiable human approval boundary.

---

## Key Features

1. **Deterministic Commit Provenance**: Scans git history to extract commit hashes, conventional types (`feat`, `fix`, `perf`, `chore`), and author metadata.
2. **Audit-Grade Release Manifest**: Outputs structured JSON capturing commit range, diff statistics (+/- lines), and verification gate attestations.
3. **Categorized Changelog Composer**: Automatically groups changes into Features, Fixes, Performance, Invariants, and Maintenance sections.
4. **Multi-Channel Broadcast Packets**: Generates drafts tailored for Executive Briefs, Customer Release Notes, and Short-Form Social Announcements.
5. **Strict Human Sign-Off Gate**: Stamped with `STATUS: PENDING_HUMAN_APPROVAL`. Never dispatches outward communications without human authorization.

---

## Installation

```bash
git clone https://github.com/We-Build-For-Good/skill-ship-to-broadcast.git
cd skill-ship-to-broadcast
```

Zero external runtime dependencies. Requires only Node.js (v18+) and git.

---

## Usage

```bash
# Package the current repository's recent commits:
node bin/ship-broadcast.mjs

# Package a specific repository and specify version tag:
node bin/ship-broadcast.mjs --dir /path/to/project --version v1.2.0

# Prepend release notes directly to project root CHANGELOG.md:
node bin/ship-broadcast.mjs --dir /path/to/project --version v1.2.0 --update-changelog

# Output release manifest as JSON:
node bin/ship-broadcast.mjs --json
```

---

## Release Artifacts

Every invocation creates a dedicated version packet inside `./release-packets/<version>/`:
* `RELEASE-MANIFEST.json`: Complete structured ledger of the release.
* `CHANGELOG.md`: Clean Markdown changelog ready for documentation or GitHub Releases.
* `BROADCAST-PENDING.md`: Multi-channel broadcast copy ready for human review and sign-off.

---

## Testing

```bash
npm test
```

All 5 unit tests execute against an ephemeral mock git repository verifying conventional commit parsing, diff statistics, changelog categorization, broadcast generation, and character invariant compliance.

---

## License

MIT © We Build for Good
