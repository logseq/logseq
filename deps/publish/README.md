## Description

Shared library for page publishing (snapshot payloads, SSR helpers, shared schemas, and storage contracts).

The Cloudflare Durable Object implementation is expected to use SQLite with the
Logseq datascript fork layered on top. Page publish payloads are expected to
send datoms (transit) so the DO can reconstruct/query datascript state.

See `deps/publish/worker` for a Cloudflare Worker skeleton that stores transit
blobs in R2 and metadata in a SQLite-backed Durable Object.

## API

Namespaces live under `logseq.publish`.

## Usage

This module is intended to be consumed by the Logseq app and the publishing worker.

## Dev

Keep this module aligned with the main repo's linting and testing conventions.
Most of the same linters are used, with configurations that are specific to this
library. See [this library's CI file](/.github/workflows/deps-publish.yml) for
linting examples.


### Local Testing

For one-time setup, install the [CloudFlare cli wrangler](https://developers.cloudflare.com/workers/wrangler/) with `npm install -g wrangler@latest`.

To test the publish feature locally, follow these steps:

* Run `yarn watch` or `yarn release` to build the publish worker js asset.
* Run `wrangler dev` in worker/ to start a local cloudflare worker server.
* In `frontend.config`, enable the commented out `PUBLISH-API-BASE` which points to a localhost url.
* Login on the desktop app.
* Go to any page and select `Publish` from its page menu.