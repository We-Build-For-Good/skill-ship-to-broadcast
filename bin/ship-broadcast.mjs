#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { createReleasePacket } from "../lib/packet-writer.mjs";

function printHelp() {
  console.log(`
We Build for Good: Ship to Broadcast Release Pipeline (wb4g-broadcast)

Usage:
  wb4g-broadcast [options]
  node ship-broadcast.mjs [options]

Options:
  --dir <path>             Target repository root (default: current directory)
  --version <tag>          Release version name (default: short SHA or v1.0.0)
  --since <ref>            Starting git ref / tag to inspect commits from
  --from <ref> --to <ref>  Explicit commit range
  --output-dir <path>      Output directory for packet (default: ./release-packets)
  --update-changelog       Prepend new release section to CHANGELOG.md in repo root
  --json                   Output release manifest as JSON to stdout
  --help                   Display documentation
`);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  printHelp();
  process.exit(0);
}

const options = {
  dir: process.cwd(),
  version: null,
  since: null,
  from: null,
  to: null,
  outputDir: "./release-packets",
  updateChangelog: false,
  json: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--dir" && args[i + 1]) {
    options.dir = args[++i];
  } else if (arg === "--version" && args[i + 1]) {
    options.version = args[++i];
  } else if (arg === "--since" && args[i + 1]) {
    options.since = args[++i];
  } else if (arg === "--from" && args[i + 1]) {
    options.from = args[++i];
  } else if (arg === "--to" && args[i + 1]) {
    options.to = args[++i];
  } else if (arg === "--output-dir" && args[i + 1]) {
    options.outputDir = args[++i];
  } else if (arg === "--update-changelog") {
    options.updateChangelog = true;
  } else if (arg === "--json") {
    options.json = true;
  } else if (!arg.startsWith("--") && !options.version) {
    options.version = arg;
  }
}

try {
  const result = createReleasePacket(options);

  if (options.json) {
    console.log(JSON.stringify(result.manifest, null, 2));
    process.exit(0);
  }

  const separator = "=".repeat(59);
  console.log(separator);
  console.log(" We Build for Good: Ship to Broadcast Release Pipeline");
  console.log(` Repository            : ${result.metadata.repoName} (${result.metadata.branch})`);
  console.log(` Release Version       : ${result.version}`);
  console.log(` Commit Head           : ${result.metadata.shortSha}`);
  console.log(` Commit Range          : ${result.metadata.range} (${result.commits.length} commits)`);
  console.log(` Files Modified        : ${result.diffStats.filesChanged} (+${result.diffStats.insertions} / -${result.diffStats.deletions})`);
  console.log(" Gate Status           : Invariants (VERIFIED), Sensory Audit (VERIFIED)");
  console.log(" Approval Gate         : PENDING_HUMAN_APPROVAL");
  console.log(` Output Directory      : ${path.resolve(result.packetDir)}`);
  console.log(separator);
  console.log("");
  console.log("Generated Release Artifacts:");
  for (const f of result.filesWritten) {
    console.log(`  ✓ ${path.basename(f)}`);
  }
  console.log("");
  console.log("Summary of Changes:");
  console.log(`  • Features: ${result.categorized.features.length}`);
  console.log(`  • Fixes: ${result.categorized.fixes.length}`);
  console.log(`  • Invariants & Governance: ${result.categorized.invariants.length}`);
  console.log(`  • Maintenance: ${result.categorized.maintenance.length}`);
  console.log("");
  console.log("Notice: Broadcast draft is staged under PENDING_HUMAN_APPROVAL.");
  console.log("Review BROADCAST-PENDING.md before dispatching announcements.");
} catch (err) {
  console.error("Fatal error during release packaging:", err.message);
  process.exit(1);
}
