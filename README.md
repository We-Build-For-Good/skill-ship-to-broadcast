# Ship to Broadcast (`skill-ship-to-broadcast`)

Turns the commits since your last release into a release packet: a JSON manifest, a changelog section, and announcement drafts, all marked `PENDING_HUMAN_APPROVAL`. It never publishes anything.

Part of the **We Build for Good** open-source skills library.

---

## What it writes

Into `release-packets/<version>/` in the repository (add `release-packets/` to your `.gitignore`):

| File | Contents |
|---|---|
| `RELEASE-MANIFEST.json` | Version, commit range and how it was chosen, head SHA, commit list, counts by type, diff stats, and check results **only if a caller supplied them** (otherwise `"NOT_RECORDED"`) |
| `CHANGELOG.md` | The commits grouped by conventional-commit type (`feat`, `fix`, `perf`, `refactor`, everything else), with GitHub commit links |
| `BROADCAST-PENDING.md` | A summary, customer notes, and short and long social drafts |

The drafts are built from commit messages, which are written for developers. Rewrite them before anyone outside the team sees them. The drafts claim the release "passed our automated checks" only when check results were supplied with `--gates` and every one of them passed.

## Which commits

* `--since <ref>`: commits after that ref.
* `--from <ref> --to <ref>`: an explicit range.
* Otherwise: commits since the latest tag. With no tags, the whole history up to 15 commits, or the last 15. The manifest records which rule was used.

A ref that does not exist is an error, and so is a range with no commits (unless `--allow-empty`).

## Install and use

Needs Node 18+ and git. No other dependencies.

```bash
git clone https://github.com/We-Build-For-Good/skill-ship-to-broadcast.git

node bin/ship-broadcast.mjs --dir path/to/repo --version v1.2.0 --since v1.1.0
node bin/ship-broadcast.mjs --dir path/to/repo --version v1.2.0 --update-changelog
node bin/ship-broadcast.mjs --dir path/to/repo --gates check-results.json --json
```

`--update-changelog` adds the section to the top of the repository's `CHANGELOG.md`, and skips it if that version is already there. Exit codes: `0` packet written, `1` error, `2` bad options.

`skill-safe-deploy` runs this tool automatically and passes it the real results of its checks.

## Tests

```bash
npm test
```

## License

MIT. We Build for Good
