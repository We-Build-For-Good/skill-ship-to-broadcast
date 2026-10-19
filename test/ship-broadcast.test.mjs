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
  assert.equal(result.manifest.totalCommits, 2); // HEAD~2..HEAD
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
