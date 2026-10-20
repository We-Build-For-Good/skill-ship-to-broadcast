import { execFileSync } from "node:child_process";
import path from "node:path";

// git is always called with an argument list (never a shell string), so refs cannot inject commands.
function git(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }).trim();
}

export function getGitRepoMetadata(cwd = process.cwd()) {
  try {
    if (git(["rev-parse", "--is-inside-work-tree"], cwd) !== "true") return null;
    const rootDir = git(["rev-parse", "--show-toplevel"], cwd);
    const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
    const headSha = git(["rev-parse", "HEAD"], cwd);

    let remoteUrl = "";
    try {
      remoteUrl = git(["remote", "get-url", "origin"], cwd);
    } catch {
      // No remote configured
    }

    let repoName = path.basename(rootDir);
    const match = remoteUrl.match(/[/:]([^/:]+?)(\.git)?$/);
    if (match && match[1]) repoName = match[1];

    return { rootDir, branch, headSha, shortSha: headSha.slice(0, 7), remoteUrl, repoName };
  } catch {
    return null;
  }
}

/** Returns { range, source }. Throws if an explicit ref does not exist. */
export function resolveCommitRange(cwd = process.cwd(), options = {}) {
  const verify = (ref) => {
    try {
      git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], cwd);
    } catch {
      throw new Error(`Git ref not found: ${ref}`);
    }
  };

  if (options.from || options.to) {
    if (!options.from || !options.to) throw new Error("--from and --to must be given together.");
    verify(options.from);
    verify(options.to);
    return { range: `${options.from}..${options.to}`, source: "explicit range" };
  }
  if (options.since) {
    verify(options.since);
    return { range: `${options.since}..HEAD`, source: `since ${options.since}` };
  }

  try {
    const latestTag = git(["describe", "--tags", "--abbrev=0"], cwd);
    if (latestTag) return { range: `${latestTag}..HEAD`, source: `since latest tag ${latestTag}` };
  } catch {
    // No tags
  }

  const limit = options.maxCommits || 15;
  const count = parseInt(git(["rev-list", "--count", "HEAD"], cwd), 10);
  if (count <= limit) return { range: "HEAD", source: `all ${count} commits (no tags found)` };
  return { range: `HEAD~${limit}..HEAD`, source: `last ${limit} commits (no tags found; pass --since to choose)` };
}

const FIELD = "\x1f";
const RECORD = "\x1e";

export function parseCommitsInRange(cwd = process.cwd(), range = "HEAD") {
  const raw = git(["log", range, `--pretty=format:%H${FIELD}%h${FIELD}%an${FIELD}%ad${FIELD}%s${RECORD}`, "--date=short"], cwd);
  return raw
    .split(RECORD)
    .map((chunk) => chunk.replace(/^\n/, ""))
    .filter(Boolean)
    .map((chunk) => {
      const [hash, shortHash, author, date, rawSubject = ""] = chunk.split(FIELD);
      const conv = rawSubject.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
      return {
        hash,
        shortHash,
        author,
        date,
        type: conv ? conv[1].toLowerCase() : "other",
        scope: conv ? conv[2] || null : null,
        breaking: conv ? Boolean(conv[3]) : false,
        rawSubject,
        subject: conv ? conv[4] : rawSubject
      };
    });
}

const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

export function getRangeDiffStats(cwd = process.cwd(), range = "HEAD") {
  // "HEAD" means the whole history, so compare against the empty tree.
  const statLine = range === "HEAD"
    ? git(["diff", "--shortstat", EMPTY_TREE, "HEAD"], cwd)
    : git(["diff", "--shortstat", range], cwd);
  const num = (re) => {
    const m = statLine.match(re);
    return m ? parseInt(m[1], 10) : 0;
  };
  return {
    filesChanged: num(/(\d+)\s+files?\s+changed/),
    insertions: num(/(\d+)\s+insertions?\(\+\)/),
    deletions: num(/(\d+)\s+deletions?\(-\)/),
    raw: statLine
  };
}
