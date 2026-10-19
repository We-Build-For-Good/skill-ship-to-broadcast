export function categorizeCommits(commits) {
  const categories = {
    features: [],
    fixes: [],
    performance: [],
    invariants: [],
    refactoring: [],
    maintenance: [],
  };

  for (const commit of commits) {
    const raw = commit.rawSubject.toLowerCase();

    if (raw.includes("invariant") || raw.includes("prettier") || raw.includes("em dash")) {
      categories.invariants.push(commit);
    } else if (commit.type === "feat") {
      categories.features.push(commit);
    } else if (commit.type === "fix") {
      categories.fixes.push(commit);
    } else if (commit.type === "perf") {
      categories.performance.push(commit);
    } else if (commit.type === "refactor") {
      categories.refactoring.push(commit);
    } else {
      categories.maintenance.push(commit);
    }
  }

  return categories;
}

export function formatChangelogSection(title, commits, remoteUrl) {
  if (!commits || commits.length === 0) return "";

  const lines = [`### ${title}`, ""];
  for (const c of commits) {
    let commitLink = `\`${c.shortHash}\``;
    if (remoteUrl && remoteUrl.includes("github.com")) {
      const cleanRemote = remoteUrl.replace(/\.git$/, "").replace(/^git@github\.com:/, "https://github.com/");
      commitLink = `[${c.shortHash}](${cleanRemote}/commit/${c.hash})`;
    }

    const scopePrefix = c.scope ? `**${c.scope}**: ` : "";
    lines.push(`- ${scopePrefix}${c.subject} (${commitLink})`);
  }
  lines.push("");
  return lines.join("\n");
}

export function composeChangelog(version, date, categorized, metadata = {}) {
  const header = `## [${version}] : ${date}`;
  const sections = [
    header,
    "",
    formatChangelogSection("✨ Features & Capabilities", categorized.features, metadata.remoteUrl),
    formatChangelogSection("🐛 Bug Fixes & Reliability", categorized.fixes, metadata.remoteUrl),
    formatChangelogSection("⚡ Performance & Optimization", categorized.performance, metadata.remoteUrl),
    formatChangelogSection("🛡️ Studio Invariants & Discipline", categorized.invariants, metadata.remoteUrl),
    formatChangelogSection("🔧 Refactoring & Architecture", categorized.refactoring, metadata.remoteUrl),
    formatChangelogSection("📦 Maintenance & Dependencies", categorized.maintenance, metadata.remoteUrl),
  ];

  return sections.filter((s) => s.length > 0).join("\n");
}
