import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export function getGitRepoMetadata(cwd = process.cwd()) {
  try {
    const isGit = execSync("git rev-parse --is-inside-work-tree", { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    if (isGit !== "true") return null;

    const rootDir = execSync("git rev-parse --show-toplevel", { cwd, encoding: "utf8" }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd, encoding: "utf8" }).trim();
    const headSha = execSync("git rev-parse HEAD", { cwd, encoding: "utf8" }).trim();
    const shortSha = headSha.slice(0, 7);

    let remoteUrl = "";
    try {
      remoteUrl = execSync("git remote get-url origin", { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    } catch {
      // No remote configured
    }

    let repoName = path.basename(rootDir);
    if (remoteUrl) {
      const match = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
      if (match && match[1]) repoName = match[1];
    }

    return { rootDir, branch, headSha, shortSha, remoteUrl, repoName };
  } catch {
    return null;
  }
}

export function resolveCommitRange(cwd = process.cwd(), options = {}) {
  if (options.from && options.to) {
    return `${options.from}..${options.to}`;
  }
  if (options.since) {
    return `${options.since}..HEAD`;
  }

  // Check for the most recent tag
  try {
    const latestTag = execSync("git describe --tags --abbrev=0", { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
    if (latestTag) {
      return `${latestTag}..HEAD`;
    }
  } catch {
    // No tags found
  }

  // Fallback to recent commits
  try {
    const countStr = execSync("git rev-list --count HEAD", { cwd, encoding: "utf8" }).trim();
    const count = parseInt(countStr, 10);
    if (count <= 1) {
      return "HEAD";
    }
    const limit = Math.min(count - 1, options.maxCommits || 15);
    return `HEAD~${limit}..HEAD`;
  } catch {
    return "HEAD";
  }
}

export function parseCommitsInRange(cwd = process.cwd(), range = "HEAD") {
  const delimiter = "---COMMIT_DELIMITER---";
  const cmd = range === "HEAD"
    ? `git log -n 1 --pretty=format:"%H|%h|%an|%ad|%s${delimiter}" --date=short`
    : `git log ${range} --pretty=format:"%H|%h|%an|%ad|%s${delimiter}" --date=short`;

  let raw = "";
  try {
    raw = execSync(cmd, { cwd, encoding: "utf8" });
  } catch {
    return [];
  }

  const chunks = raw.split(delimiter).map((c) => c.trim()).filter(Boolean);
  const commits = [];

  for (const chunk of chunks) {
    const parts = chunk.split("|");
    if (parts.length < 5) continue;

    const [hash, shortHash, author, date, ...subjectParts] = parts;
    const rawSubject = subjectParts.join("|").trim();

    // Parse conventional commit pattern: type(scope): message
    const convMatch = rawSubject.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
    let type = "other";
    let scope = null;
    let subject = rawSubject;

    if (convMatch) {
      type = convMatch[1].toLowerCase();
      scope = convMatch[2];
      subject = convMatch[3];
    }

    commits.push({
      hash,
      shortHash,
      author,
      date,
      type,
      scope,
      rawSubject,
      subject,
    });
  }

  return commits;
}

export function getRangeDiffStats(cwd = process.cwd(), range = "HEAD") {
  const cmd = range === "HEAD"
    ? "git diff --shortstat HEAD~1 HEAD"
    : `git diff --shortstat ${range}`;

  try {
    const statLine = execSync(cmd, { cwd, encoding: "utf8" }).trim();
    if (!statLine) return { filesChanged: 0, insertions: 0, deletions: 0, raw: "" };

    const filesMatch = statLine.match(/(\d+)\s+files?\s+changed/);
    const insMatch = statLine.match(/(\d+)\s+insertions?\(\+\)/);
    const delMatch = statLine.match(/(\d+)\s+deletions?\(-\)/);

    return {
      filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
      insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
      deletions: delMatch ? parseInt(delMatch[1], 10) : 0,
      raw: statLine,
    };
  } catch {
    return { filesChanged: 0, insertions: 0, deletions: 0, raw: "" };
  }
}
