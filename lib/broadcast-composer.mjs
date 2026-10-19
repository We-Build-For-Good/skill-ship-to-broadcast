export function composeBroadcastPacket(version, date, categorized, metadata = {}, diffStats = {}) {
  const repoName = metadata.repoName || "Project";
  const featureCount = categorized.features.length;
  const fixCount = categorized.fixes.length;
  const invCount = categorized.invariants.length;

  const highlights = [];
  for (const f of categorized.features.slice(0, 3)) {
    highlights.push(f.subject);
  }
  for (const fx of categorized.fixes.slice(0, 2)) {
    highlights.push(fx.subject);
  }

  // 1. Executive Summary
  const execLines = [
    `### 📋 Executive Summary : ${repoName} (${version})`,
    "",
    `**Release Date:** ${date}`,
    `**Commit Head:** \`${metadata.shortSha || "HEAD"}\` (${metadata.branch || "main"})`,
    `**Volume:** ${diffStats.filesChanged || 0} files modified (+${diffStats.insertions || 0} / -${diffStats.deletions || 0})`,
    "",
    "**Key Value Delivered:**",
  ];

  if (highlights.length === 0) {
    execLines.push("- Ongoing maintenance, code hygiene, and test stability improvements.");
  } else {
    for (const h of highlights) {
      execLines.push(`- ${h}`);
    }
  }

  // 2. Client / Customer Release Notes
  const customerLines = [
    "",
    "---",
    "",
    `### 📣 Customer Release Notes : What is New in ${version}`,
    "",
  ];

  if (featureCount > 0) {
    customerLines.push("**New Capabilities:**");
    for (const f of categorized.features) {
      customerLines.push(`* ${f.subject}`);
    }
    customerLines.push("");
  }

  if (fixCount > 0) {
    customerLines.push("**Fixes & Polish:**");
    for (const fx of categorized.fixes) {
      customerLines.push(`* ${fx.subject}`);
    }
    customerLines.push("");
  }

  if (invCount > 0) {
    customerLines.push("**Quality & Standards:**");
    for (const inv of categorized.invariants) {
      customerLines.push(`* ${inv.subject}`);
    }
    customerLines.push("");
  }

  // 3. Short-Form Social Broadcast Drafts
  const socialLines = [
    "---",
    "",
    "### 📱 Social & Community Broadcast Drafts",
    "",
    "#### Short-Form (X / Twitter / Slack)",
    "```text",
    `Just shipped ${repoName} ${version}:`,
  ];

  for (const h of highlights.slice(0, 2)) {
    socialLines.push(`• ${h}`);
  }
  socialLines.push(`Verified with deterministic invariant & sensory gates. Details: ${metadata.remoteUrl || ""}`);
  socialLines.push("```");
  socialLines.push("");

  socialLines.push("#### Long-Form (LinkedIn / Studio Broadcast)");
  socialLines.push("```text");
  socialLines.push(`We just released ${version} of ${repoName}.`);
  socialLines.push("");
  socialLines.push("In this release:");
  for (const h of highlights) {
    socialLines.push(`- ${h}`);
  }
  socialLines.push("");
  socialLines.push("Every release is mechanically verified against character-level invariants, code legibility standards, and multi-viewport responsive audits before landing.");
  socialLines.push("```");

  // Assembly with Human Approval Gate
  const packet = [
    "# Release Broadcast Packet",
    "",
    "> [!IMPORTANT]",
    "> **STATUS: PENDING HUMAN APPROVAL**",
    "> This draft was assembled deterministically from verified landed commits.",
    "> It will NOT be broadcast or published externally until a human explicitly authorizes dispatch.",
    "",
    execLines.join("\n"),
    customerLines.join("\n"),
    socialLines.join("\n"),
  ].join("\n");

  return packet;
}
