(ns frontend.sync.protocol)

(defprotocol Sync
  (get-client [this])
  (signed? [this])
  (get-dir [this path])
  (get-more-dir [this more-state])
  (create-file [this path contents])
  (update-file [this path contents])
  (get-file-contents-and-metadata [this path])
  (delete-file [this path]))
