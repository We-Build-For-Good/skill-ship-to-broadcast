export function generateReleaseManifest(version, commits, categorized, metadata = {}, diffStats = {}, verificationGates = null) {
  const now = new Date().toISOString();
  const repoName = metadata.repoName || "project";

  return {
    releaseId: `rel-${repoName}-${version.replace(/^v/, "")}-${now.slice(0, 10)}`,
    version,
    releaseDate: now,
    approvalStatus: "PENDING_HUMAN_APPROVAL",
    repository: {
      name: repoName,
      remote: metadata.remoteUrl || null,
      branch: metadata.branch || "main",
      headSha: metadata.headSha || null,
      shortSha: metadata.shortSha || null,
    },
    commitRange: metadata.range || "HEAD",
    commitRangeSource: metadata.rangeSource || null,
    totalCommits: commits.length,
    categorizedSummary: {
      features: categorized.features.length,
      fixes: categorized.fixes.length,
      performance: categorized.performance.length,
      invariants: categorized.invariants.length,
      refactoring: categorized.refactoring.length,
      maintenance: categorized.maintenance.length,
    },
    diffStats: {
      filesChanged: diffStats.filesChanged || 0,
      insertions: diffStats.insertions || 0,
      deletions: diffStats.deletions || 0,
    },
    // Gate results are recorded only when a caller supplies them (e.g. skill-safe-deploy). Never assumed.
    verificationGates: verificationGates && Object.keys(verificationGates).length ? verificationGates : "NOT_RECORDED",
    commits: commits.map((c) => ({
      shortHash: c.shortHash,
      type: c.type,
      scope: c.scope,
      subject: c.subject,
      author: c.author,
      date: c.date,
    })),
  };
}
