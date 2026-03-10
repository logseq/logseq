# M8: Sprites Repo Clone per Session

## Target
Clone the project repo into the sandbox workspace on session provision.

## Scope
- Use repo URL from project metadata in session.
- Clone per session (Sprites has no fork support yet).
- Provide read/write permissions for agent.
- Add override command env (e.g., `SPRITES_REPO_CLONE_COMMAND`).

## Acceptance
1) Repo is cloned before first agent message.
2) Agent can read/write files in repo.
3) Override command works for custom clone flows.
