(ns frontend.common-keywords
  "There are some keywords scattered throughout the codebase."
  (:require [logseq.common.defkeywords :refer [defkeywords]]))

(defkeywords
  :block/uuid      {:doc "block's uuid"}
  :block/name      {:doc "block name, lowercase, only page-blocks have this attr"}
  :block/type      {:doc "block type, *deprecated* in db-version"}
  :block/raw-title {:doc "like `:block/title`,
                          but when eval `(:block/raw-title block-entity)`, return raw title of this block"}
  :kv/value        {:doc "Used to store key-value, the value could be anything,
                          e.g. {:db/ident :logseq.kv/xxx :kv/value value}"}

;; :block.temp/xxx keywords
  :block.temp/load-status {:doc "`:full` means the block and its children have been loaded,
                                 `:self` means the block itself has been loaded."})
