import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { createReleasePacket } from "../lib/packet-writer.mjs";

const TMP_DIR = path.resolve("test/.tmp-broadcast-test");

test.beforeEach(() => {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_DIR, { recursive: true });

  // Initialize a mock git repository with conventional commits
  execSync("git init -b main", { cwd: TMP_DIR });
  execSync('git config user.name "Test Builder"', { cwd: TMP_DIR });
  execSync('git config user.email "builder@test.local"', { cwd: TMP_DIR });

  fs.writeFileSync(path.join(TMP_DIR, "file1.txt"), "Initial content\n");
  execSync("git add file1.txt", { cwd: TMP_DIR });
  execSync('git commit -m "feat(core): add initial platform foundation"', { cwd: TMP_DIR });

  fs.writeFileSync(path.join(TMP_DIR, "file2.txt"), "Second content\n");
  execSync("git add file2.txt", { cwd: TMP_DIR });
  execSync('git commit -m "fix(landing): resolve mobile layout blowout"', { cwd: TMP_DIR });

  fs.writeFileSync(path.join(TMP_DIR, "file3.txt"), "Third content\n");
  execSync("git add file3.txt", { cwd: TMP_DIR });
  execSync('git commit -m "chore(invariants): update Prettier baseline"', { cwd: TMP_DIR });
});

test.afterEach(() => {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
});

test("creates structured release manifest and packet files", () => {
  const result = createReleasePacket({
    dir: TMP_DIR,
    version: "v1.2.0",
    outputDir: "./release-packets",
  });

  assert.equal(result.version, "v1.2.0");
  assert.equal(result.manifest.approvalStatus, "PENDING_HUMAN_APPROVAL");
  assert.equal(result.manifest.totalCommits, 3); // all commits: 1.0.0 dropped the first commit
  assert.equal(result.categorized.fixes.length, 1);
  assert.equal(result.categorized.invariants.length, 1);

  assert.ok(fs.existsSync(path.join(result.packetDir, "RELEASE-MANIFEST.json")));
  assert.ok(fs.existsSync(path.join(result.packetDir, "CHANGELOG.md")));
  assert.ok(fs.existsSync(path.join(result.packetDir, "BROADCAST-PENDING.md")));
});

test("composes categorized changelog with clean markdown sections", () => {
  const result = createReleasePacket({
    dir: TMP_DIR,
    version: "v1.0.0",
    from: "HEAD~2",
    to: "HEAD",
  });

  const changelog = result.changelog;
  assert.match(changelog, /## \[v1\.0\.0\]/);
  assert.match(changelog, /### 🐛 Bug Fixes & Reliability/);
  assert.match(changelog, /resolve mobile layout blowout/);
  assert.match(changelog, /### 🛡️ Studio Invariants & Discipline/);
});

test("generates broadcast packet with strict human approval boundary", () => {
  const result = createReleasePacket({
    dir: TMP_DIR,
    version: "v2.0.0",
  });

  const broadcast = result.broadcast;
  assert.match(broadcast, /STATUS: PENDING HUMAN APPROVAL/);
  assert.match(broadcast, /Executive Summary/);
  assert.match(broadcast, /Customer Release Notes/);
  assert.match(broadcast, /Social & Community Broadcast Drafts/);
  assert.match(broadcast, /Short-Form/);
  assert.match(broadcast, /Long-Form/);
});

test("updates root CHANGELOG.md when requested", () => {
  createReleasePacket({
    dir: TMP_DIR,
    version: "v1.0.0",
    updateChangelog: true,
  });

  const rootChangelog = path.join(TMP_DIR, "CHANGELOG.md");
  assert.ok(fs.existsSync(rootChangelog));
  const content = fs.readFileSync(rootChangelog, "utf8");
  assert.match(content, /# Changelog/);
  assert.match(content, /## \[v1\.0\.0\]/);
});

test("enforces zero em dash invariant across all generated files", () => {
  const result = createReleasePacket({
    dir: TMP_DIR,
    version: "v1.0.0",
  });

  for (const filePath of result.filesWritten) {
    const content = fs.readFileSync(filePath, "utf8");
    assert.equal(
      content.includes("\u2014"),
      false,
      `File ${filePath} contains forbidden em dash!`
    );
  }
});

// Regression tests for the 2026-10-20 catalogue review.

test("never claims checks passed unless the caller supplied passing results", () => {
  const plain = createReleasePacket({ dir: TMP_DIR, version: "v3.0.0" });
  assert.equal(plain.manifest.verificationGates, "NOT_RECORDED");
  assert.doesNotMatch(plain.broadcast, /verified with|mechanically verified|passed our automated checks/i);

  const failing = createReleasePacket({ dir: TMP_DIR, version: "v3.0.1", gates: { invariants: { status: "PASSED" }, visual: { status: "NOT_RUN" } } });
  assert.doesNotMatch(failing.broadcast, /passed our automated checks/i);

  const passing = createReleasePacket({ dir: TMP_DIR, version: "v3.0.2", gates: { invariants: { status: "PASSED" } } });
  assert.match(passing.broadcast, /passed our automated checks: invariants/);
});

test("a ref that does not exist fails instead of producing an empty release", () => {
  assert.throws(() => createReleasePacket({ dir: TMP_DIR, version: "v4.0.0", since: "no-such-tag" }), /not found/);
});

test("refs cannot inject shell commands", () => {
  const marker = path.join(TMP_DIR, "pwned");
  assert.throws(() => createReleasePacket({ dir: TMP_DIR, version: "v4.0.1", since: `HEAD; touch ${marker}` }));
  assert.equal(fs.existsSync(marker), false);
});

test("an empty range fails unless --allow-empty", () => {
  execSync("git tag v5", { cwd: TMP_DIR });
  assert.throws(() => createReleasePacket({ dir: TMP_DIR, version: "v5.0.0" }), /No commits/);
  assert.equal(createReleasePacket({ dir: TMP_DIR, version: "v5.0.0", allowEmpty: true }).commits.length, 0);
});

test("--update-changelog is idempotent and versions cannot escape the packet folder", () => {
  createReleasePacket({ dir: TMP_DIR, version: "v6.0.0", updateChangelog: true });
  const second = createReleasePacket({ dir: TMP_DIR, version: "v6.0.0", updateChangelog: true });
  const text = fs.readFileSync(path.join(TMP_DIR, "CHANGELOG.md"), "utf8");
  assert.equal(text.split("## [v6.0.0]").length - 1, 1);
  assert.ok(second.changelogSkipped);
  assert.throws(() => createReleasePacket({ dir: TMP_DIR, version: "../../escape" }), /Invalid version/);
});

test("commit subjects containing | are kept whole", () => {
  fs.writeFileSync(path.join(TMP_DIR, "file4.txt"), "x\n");
  execSync("git add file4.txt", { cwd: TMP_DIR });
  execSync('git commit -m "feat: support a | b pipes"', { cwd: TMP_DIR });
  const r = createReleasePacket({ dir: TMP_DIR, version: "v7.0.0" });
  assert.ok(r.categorized.features.some((c) => c.subject === "support a | b pipes"));
});
