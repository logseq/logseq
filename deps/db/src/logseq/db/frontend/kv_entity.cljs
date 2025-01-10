(ns logseq.db.frontend.kv-entity
  "kv entities used by logseq db"
  (:require [logseq.common.defkeywords :refer [defkeywords]]))

(defkeywords
  :logseq.kv/db-type                      {:doc "Set to \"db\" if it's a db-graph"}
  :logseq.kv/graph-uuid                   {:doc "Store graph-uuid if it's a rtc enabled graph"
                                           :rtc {:rtc/ignore-entity-when-init-upload true
                                                 :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/import-type                  {:doc "If graph is imported, identifies how a graph is imported including which UI or CLI import process. CLI scripts can set this to a custom value.
                                                 UI values include :file-graph and :sqlite-db and CLI values start with :cli e.g. :cli/default."}
  :logseq.kv/imported-at                  {:doc "Time if graph is imported"}
  :logseq.kv/graph-local-tx               {:doc "local rtc tx-id"
                                           :rtc {:rtc/ignore-entity-when-init-upload true
                                                 :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/schema-version               {:doc "Graph's current schema version"}
  :logseq.kv/graph-created-at             {:doc "Graph's created at time"}
  :logseq.kv/latest-code-lang             {:doc "Latest lang used by a #Code-block"
                                           :rtc {:rtc/ignore-entity-when-init-upload true
                                                 :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/graph-backup-folder          {:doc "Backup folder for automated backup feature"
                                           :rtc {:rtc/ignore-entity-when-init-upload true
                                                 :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/graph-initial-schema-version {:doc "Graph's schema version when created"})
