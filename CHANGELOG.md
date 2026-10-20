# Changelog

## 2.0.0 (2026-10-20)

Fixes from an independent review.

- **No more invented verification claims.** 1.0.0 recorded the invariant and visual checks as `VERIFIED` in every manifest and printed "Gate Status: VERIFIED" whether or not anything ran, and its social drafts said every release was "mechanically verified". Check results are now recorded only when supplied with `--gates`, and the drafts mention them only when all passed.
- **git is called without a shell**, so a ref such as `--since "v1; rm -rf ~"` can no longer run commands.
- A ref that does not exist, or an empty range, is an error instead of a silently empty packet (`--allow-empty` to override).
- With no tags, the first commit is no longer dropped.
- Commit subjects and author names containing `|` are parsed correctly.
- `--update-changelog` does not add the same version twice.
- Versions are validated, so a version cannot write outside `release-packets/`.
- Unknown options exit with code 2. The docs no longer contain the author's local file paths.
