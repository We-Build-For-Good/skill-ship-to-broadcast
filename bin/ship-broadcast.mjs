#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createReleasePacket } from "../lib/packet-writer.mjs";
import { allGatesPassed } from "../lib/broadcast-composer.mjs";

const HELP = `
We Build for Good: Ship to Broadcast (wb4g-broadcast)

Builds a release packet from git history: a manifest, a changelog section, and
announcement drafts marked PENDING_HUMAN_APPROVAL. It never publishes anything.

Usage: wb4g-broadcast [options]

  --dir <path>             Repository root (default: current directory)
  --version <tag>          Release name (default: short commit SHA)
  --since <ref>            Include commits after this ref (default: latest tag)
  --from <ref> --to <ref>  Explicit commit range
  --gates <file>           JSON file of check results to record, e.g. {"invariants":{"status":"PASSED"}}
  --output-dir <path>      Where packets go (default: <dir>/release-packets)
  --update-changelog       Add the section to CHANGELOG.md (skipped if that version is already there)
  --allow-empty            Write a packet even when the range has no commits
  --json                   Print the manifest as JSON
  --help, -h               Show this help

Exit codes: 0 packet written, 1 error, 2 bad options.
`;

function parseArgs(args) {
  const options = { dir: process.cwd(), version: null, since: null, from: null, to: null, gatesFile: null, outputDir: "./release-packets", updateChangelog: false, allowEmpty: false, json: false, help: false, errors: [] };
  const valueFlags = { "--dir": "dir", "--version": "version", "--since": "since", "--from": "from", "--to": "to", "--gates": "gatesFile", "--output-dir": "outputDir" };
  const boolFlags = { "--update-changelog": "updateChangelog", "--allow-empty": "allowEmpty", "--json": "json", "--help": "help", "-h": "help" };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (boolFlags[arg]) options[boolFlags[arg]] = true;
    else if (valueFlags[arg]) {
      if (i + 1 >= args.length || args[i + 1].startsWith("--")) options.errors.push(`${arg} needs a value.`);
      else options[valueFlags[arg]] = args[++i];
    } else options.errors.push(`Unknown option: ${arg}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return 0;
  }
  if (options.errors.length) {
    options.errors.forEach((e) => console.error(`Error: ${e}`));
    return 2;
  }
  if (options.gatesFile) {
    try {
      options.gates = JSON.parse(fs.readFileSync(options.gatesFile, "utf8"));
    } catch (err) {
      console.error(`Error: could not read --gates file: ${err.message}`);
      return 2;
    }
  }

  let result;
  try {
    result = createReleasePacket(options);
  } catch (err) {
    console.error(`Release packaging failed: ${err.message}`);
    return 1;
  }

  if (options.json) {
    console.log(JSON.stringify(result.manifest, null, 2));
    return 0;
  }

  const gates = options.gates
    ? Object.entries(options.gates).map(([k, v]) => `${k} ${(v && v.status) || v}`).join(", ")
    : "none supplied (the packet makes no verification claim)";
  const line = "=".repeat(59);
  console.log(line);
  console.log(" We Build for Good: Ship to Broadcast");
  console.log(` Repository   : ${result.metadata.repoName} (${result.metadata.branch})`);
  console.log(` Version      : ${result.version}`);
  console.log(` Head         : ${result.metadata.shortSha}`);
  console.log(` Commits      : ${result.commits.length} (${result.metadata.rangeSource})`);
  console.log(` Files        : ${result.diffStats.filesChanged} (+${result.diffStats.insertions} / -${result.diffStats.deletions})`);
  console.log(` Checks       : ${gates}${options.gates && !allGatesPassed(options.gates) ? " (NOT all passed)" : ""}`);
  console.log(" Approval     : PENDING_HUMAN_APPROVAL");
  console.log(` Packet       : ${path.resolve(result.packetDir)}`);
  console.log(line);
  for (const f of result.filesWritten) console.log(`  wrote ${path.basename(f)}`);
  if (result.changelogSkipped) console.log(`  ${result.changelogSkipped}`);
  console.log("\nNothing was published. Review BROADCAST-PENDING.md and rewrite it for customers before sending anything.");
  return 0;
}

process.exitCode = main();
