---
description: Git branch strategy and workflow for the Refine project
---

# Git Branch Strategy

// turbo-all

## Branch Naming Convention

All branches must follow `{type}/{short-description}` format:

| Prefix | 용도 | 예시 |
|--------|------|------|
| `feature/` | 새 기능 | `feature/infinite-scroll` |
| `fix/` | 버그 수정 | `fix/dark-mode-colors` |
| `refactor/` | 리팩터링 (기능 변화 없음) | `refactor/supabase-client` |
| `chore/` | 설정, 의존성, CI, 문서 등 | `chore/cleanup-stale-branches` |
| `perf/` | 성능 개선 | `perf/image-loading` |

**금지**: `issue-N`, `Update`, `test`, 한글 브랜치명

---

## Workflow Steps

### 1. Start a new branch

```bash
./scripts/git-start.sh {type}/{description}
```

What it does:
1. Switch to `main` and pull latest
2. Validate the branch name format
3. Create and switch to the new branch

### 2. Commit changes (Conventional Commits)

Format: `{type}({scope}): {description}`

| Type | Description |
|------|-------------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 코드 리팩터링 |
| `chore` | 설정/빌드/문서 |
| `perf` | 성능 개선 |
| `docs` | 문서만 변경 |
| `style` | 포맷팅 (코드 의미 변화 없음) |
| `test` | 테스트 추가/수정 |

Examples:
```
feat(share): add category auto-detection
fix(profile): prevent full data fetch on stats page
refactor(supabase): remove deprecated client file
chore(deps): remove unused pg package
```

### 3. Push & create PR

```bash
./scripts/git-finish.sh
```

What it does:
1. Push current branch to origin
2. Print GitHub PR creation URL
3. PR title = latest commit message (Conventional Commit format)

### 4. After merge — cleanup

```bash
./scripts/git-cleanup.sh
```

What it does:
1. List all local branches already merged into `main`
2. Interactively confirm deletion of each
3. Prune remote tracking branches

---

## Rules for the Agent

When working on the Refine project, always:

1. **Check current branch** before starting work: `git branch --show-current`
2. **Create a new branch** if on `main`: use `./scripts/git-start.sh`
3. **Use Conventional Commits** for all commit messages
4. **One feature per branch** — don't mix unrelated changes
5. **Push before finishing** — use `./scripts/git-finish.sh`
6. **Cleanup after merge** — use `./scripts/git-cleanup.sh`

---

## Quick Reference

```bash
# Start new feature
./scripts/git-start.sh feature/my-feature

# Commit with convention
git add -A && git commit -m "feat(module): add awesome feature"

# Push & get PR link
./scripts/git-finish.sh

# Cleanup merged branches
./scripts/git-cleanup.sh

# See all branches and their merge status
git branch -a --merged main
```
