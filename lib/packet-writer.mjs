import fs from "node:fs";
import path from "node:path";
import { getGitRepoMetadata, resolveCommitRange, parseCommitsInRange, getRangeDiffStats } from "./git-extractor.mjs";
import { categorizeCommits, composeChangelog } from "./changelog-composer.mjs";
import { composeBroadcastPacket } from "./broadcast-composer.mjs";
import { generateReleaseManifest } from "./manifest-generator.mjs";

export function createReleasePacket(options = {}) {
  const cwd = path.resolve(options.dir || process.cwd());
  const metadata = getGitRepoMetadata(cwd);

  if (!metadata) {
    throw new Error(`Target directory '${cwd}' is not a valid git repository.`);
  }

  const range = resolveCommitRange(cwd, options);
  metadata.range = range;

  const commits = parseCommitsInRange(cwd, range);
  const diffStats = getRangeDiffStats(cwd, range);
  const categorized = categorizeCommits(commits);

  const version = options.version || metadata.shortSha || "v1.0.0";
  const date = options.date || new Date().toISOString().slice(0, 10);

  const manifest = generateReleaseManifest(version, commits, categorized, metadata, diffStats, options.gates);
  const changelog = composeChangelog(version, date, categorized, metadata);
  const broadcast = composeBroadcastPacket(version, date, categorized, metadata, diffStats);

  const outBase = path.resolve(cwd, options.outputDir || "./release-packets");
  const packetDir = path.join(outBase, `${version}`);

  if (!fs.existsSync(packetDir)) {
    fs.mkdirSync(packetDir, { recursive: true });
  }

  const manifestPath = path.join(packetDir, "RELEASE-MANIFEST.json");
  const changelogPath = path.join(packetDir, "CHANGELOG.md");
  const broadcastPath = path.join(packetDir, "BROADCAST-PENDING.md");

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  fs.writeFileSync(changelogPath, changelog, "utf8");
  fs.writeFileSync(broadcastPath, broadcast, "utf8");

  if (options.updateChangelog) {
    const rootChangelog = path.join(cwd, "CHANGELOG.md");
    if (fs.existsSync(rootChangelog)) {
      const existing = fs.readFileSync(rootChangelog, "utf8");
      fs.writeFileSync(rootChangelog, `${changelog}\n\n---\n\n${existing}`, "utf8");
    } else {
      fs.writeFileSync(rootChangelog, `# Changelog\n\n${changelog}\n`, "utf8");
    }
  }

  return {
    version,
    date,
    metadata,
    commits,
    diffStats,
    categorized,
    manifest,
    changelog,
    broadcast,
    packetDir,
    filesWritten: [manifestPath, changelogPath, broadcastPath],
  };
}
