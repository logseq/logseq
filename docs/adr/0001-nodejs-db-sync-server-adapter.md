# ADR 0001: Node.js DB Sync Server Adapter for Self-Hosting

Date: 2026-01-30
Status: Proposed

## Context
Logseq's DB sync currently assumes a hosted environment for the sync server. This limits users who want to self-host the server on their own infrastructure and avoid reliance on Cloudflare-specific services.

We need a portable server adapter that can run on standard Node.js runtimes (Docker, bare metal, VPS, or on-prem) while preserving the existing DB sync protocol and client behavior.

## Decision
Create a Node.js server adapter for DB sync that:
- Runs on a standard Node.js runtime (LTS) without Cloudflare dependencies.
- Implements the existing DB sync protocol and endpoints without breaking client compatibility.
- Supports self-hosting via a documented configuration (env vars, ports, storage backends).
- Allows pluggable storage and auth providers to match the current hosted behavior.

The adapter will be a peer implementation of the existing server entrypoint, sharing protocol definitions and core logic where possible.

## Options Considered
1) Continue Cloudflare-only hosting
- Pros: no new maintenance
- Cons: blocks self-hosting; vendor lock-in

2) Rewrite the sync server in a new standalone service
- Pros: full control, clean slate
- Cons: high risk, larger scope, protocol divergence risk

3) Add a Node.js adapter around the existing sync server logic (chosen)
- Pros: minimizes protocol drift; faster to ship; leverages existing logic
- Cons: requires adapter layer and some refactoring for portability

## Consequences
- Additional maintenance surface for Node.js runtime compatibility.
- Requires careful separation of platform-specific code from shared sync logic.
- Enables self-hosting and reduces dependence on Cloudflare.
- May require new CI coverage for Node.js adapter builds and basic integration tests.

## Follow-up Work
- Identify Cloudflare-specific APIs and replace with portable interfaces.
- Define storage and auth provider interfaces for the adapter.
- Add documentation for self-hosting setup and deployment examples.
- Add minimal integration tests to validate protocol compatibility.
