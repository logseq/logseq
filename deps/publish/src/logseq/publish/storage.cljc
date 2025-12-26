(ns logseq.publish.storage
  "Contracts for durable storage backends.")

(defprotocol PublishStore
  "Storage for published page snapshots. Implementations should use SQLite as
  the durable store and run the Logseq datascript fork on top of it."
  (put-snapshot! [this page-id snapshot])
  (get-snapshot [this page-id])
  (delete-snapshot! [this page-id]))
