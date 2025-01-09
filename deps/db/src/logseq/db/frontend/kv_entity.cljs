(ns logseq.db.frontend.kv-entity
  "Define kv entities used by logseq db"
  (:require [logseq.common.defkeywords :refer [defkeywords]]))

(defkeywords
  :logseq.kv/db-type {:doc ":kv/value = \"db\" if it's a db-graph"}
  :logseq.kv/graph-uuid {:doc "store graph-uuid if it's a rtc enabled graph"
                         :rtc {:rtc/ignore-entity-when-init-upload true
                               :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/import-type {:doc ":sqlite-db if import from sqlite.
                                FIXME: any other values?"
                          :rtc {:rtc/ignore-entity-when-init-upload true
                                :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/imported-at {:doc "graph-import time"
                          :rtc {:rtc/ignore-entity-when-init-upload true
                                :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/graph-local-tx {:doc "local rtc tx-id"
                             :rtc {:rtc/ignore-entity-when-init-upload true
                                   :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/schema-version {:doc "schema version"}
  :logseq.kv/graph-created-at {:doc "graph create time"}
  :logseq.kv/latest-code-lang {:doc "latest lang used by code-block"
                               :rtc {:rtc/ignore-entity-when-init-upload true
                                     :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/graph-backup-folder {:doc "graph backup-folder"
                                  :rtc {:rtc/ignore-entity-when-init-upload true
                                        :rtc/ignore-entity-when-init-download true}}
  :logseq.kv/graph-initial-schema-version {:doc "schema-version when graph created"})
