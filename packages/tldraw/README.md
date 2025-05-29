# Developer Notes

## Background

This folder contains the JS codes for a custom build of Tldraw to fit the needs of Logseq, which originates from an abandoned next branch from the author of Tldraw.

## Development

### Prerequisites

Modern JS eco tools like Node.js and yarn.

### Run in dev mode

- install dependencies with `yarn`
- run dev mode with `yarn dev`, which will start a Vite server at http://127.0.0.1:3031/

Note, the dev mode is a standalone web app running a demo Tldraw app in `tldraw/demo/src/App.jsx`. The Logseq component renderers and handlers are all mocked to make sure Tldraw only functions can be isolatedly developed.

## Other useful commands

- fixing styles: `yarn fix:style`
- build: `yarn build`

## How it works

### Data flow between Tldraw & Logseq

The data flow between Tldraw & Logseq can be found here: https://whimsical.com/9sdt5j7MabK6DVrxgTZw25
