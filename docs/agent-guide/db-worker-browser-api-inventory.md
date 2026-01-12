# db-worker browser-only API inventory

## Worker entry
- frontend.worker.db-worker
  - importScripts
  - js/self postMessage
  - js/location.href
  - navigator.storage (OPFS)
  - Comlink expose/wrap/transfer
  - setInterval

## Shared service
- frontend.worker.shared-service
  - navigator.locks.request/query
  - BroadcastChannel
  - js/self postMessage

## RTC and crypto
- frontend.worker.rtc.ws
  - WebSocket
- frontend.worker.rtc.crypt
  - OPFS file access via frontend.common.file.opfs
  - js/self location

## Worker util
- frontend.worker-common.util
  - wfu/post-message (worker postMessage bridge)
