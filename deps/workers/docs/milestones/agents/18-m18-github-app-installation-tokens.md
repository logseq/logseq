# M18: GitHub App Installation Tokens for Publish

Status: Proposed
Target: Replace static `GITHUB_TOKEN` publish auth with short-lived GitHub App installation tokens for `git push` and PR APIs.

## Goal
Use least-privilege, short-lived credentials for agent publish operations instead of a long-lived shared token.

## Why M18
- `GITHUB_TOKEN` is currently used as a fallback for both push and PR APIs.
- Long-lived repo-wide tokens increase blast radius if leaked.
- GitHub App installation tokens provide scoped, expiring credentials and clearer audit boundaries.
- Installation-token flow aligns better with multi-repo, multi-org safety requirements.

## Scope
1) Introduce GitHub App auth configuration for agents worker runtime:
- app id
- installation id (or resolution strategy)
- private key secret
- optional API base override support

2) Add token minting + caching flow:
- generate JWT signed by app private key
- call GitHub App installation access token endpoint
- cache token in-memory with expiry-aware refresh

3) Switch publish/auth paths to installation tokens:
- `git push` remote auth
- `create pull request`
- `find open pull request`
- `default branch` and `list branches` APIs

4) Remove static token path:
- remove `GITHUB_TOKEN` usage from publish auth path
- fail publish requests when GitHub App auth is not configured or minting fails

5) Update docs and operator setup:
- required secrets/vars
- permission model and required GitHub App scopes
- rollout plan and failure behavior

## Out of Scope
- Non-GitHub SCM providers.
- New publish product features unrelated to auth hardening.

## Workstreams

### WS1: Auth Model and Config
- Define env contract for GitHub App auth.
- Validate required settings at startup/runtime usage.
- Expose auth mode in debug logs/events without leaking secrets.

### WS2: Installation Token Provider
- Implement JWT signing for GitHub App auth.
- Implement installation token fetch and expiry-aware cache.
- Handle clock skew and API failure retries conservatively.

### WS3: Source Control Integration
- Route all GitHub API calls to use installation tokens.
- Route push remote URL token injection to installation tokens.
- Preserve current API behavior and error reporting shapes.

### WS4: Observability and Safety
- Emit structured reasons for auth state (`github-app`, `missing-auth`, `mint-failed`).
- Ensure logs never include raw tokens or private key data.
- Add alerts/metrics for token mint failures and publish auth failures.

### WS5: Rollout and Validation
- Stage rollout in staging first with GitHub App configured.
- Verify publish flows: push-only and push+PR.
- Validate fail-closed behavior when app auth is unavailable.

## Exit Criteria
1) Publish operations use GitHub App installation tokens by default in staging and production.
2) `GITHUB_TOKEN` is not used for publish auth.
3) Push-only and push+PR flows succeed with GitHub App installation-token auth.
4) Secrets handling and logs meet safety requirement: no token/private-key leakage.
5) Operator docs include setup, required permissions, and failure behavior.
