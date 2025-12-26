## Description

Shared library for page publishing (snapshot payloads, SSR helpers, shared schemas, and storage contracts).

The Cloudflare Durable Object implementation is expected to use SQLite with the
Logseq datascript fork layered on top.

## API

Namespaces live under `logseq.publish`.

## Usage

This module is intended to be consumed by the Logseq app and the publishing worker.

## Dev

Keep this module aligned with the main repo's linting and testing conventions.
