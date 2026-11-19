(ns frontend.common-keywords
  "There are some keywords scattered throughout the codebase."
  (:require [logseq.common.defkeywords :refer [defkeywords]]))

(defkeywords
  :route/eligible-for-recent? {:doc "Whether a route target is a visible page with a nonblank title."}
  :block/uuid      {:doc "block's uuid"}
  :block/name      {:doc "block name, lowercase, only page-blocks have this attr"}
  :block/raw-title {:doc "like `:block/title`,
                          but when eval `(:block/raw-title block-entity)`, return raw title of this block"}
  :kv/value        {:doc "Used to store key-value, the value could be anything,
                          e.g. {:db/ident :logseq.kv/xxx :kv/value value}"})

(defkeywords
  :stress/create-tree-uuids {:doc "Requested block UUIDs for an opted-in CLI stress tree trace."}
  :stress/create-tree-apply {:doc "Snapshot of the worker DB immediately after the traced tree apply."}
  :stress/lookup {:doc "Entity lookup wrapped by a traced CLI pull request."}
  :stress/entity {:doc "Entity returned by the original pull in a traced CLI request."}
  :stress/present {:doc "UUID presence flags in request order at an observed boundary."}
  :stress/at-ms {:doc "Wall clock timestamp in milliseconds of a presence snapshot."}
  :stress/returned-result {:doc "Whether the traced apply returned a non-nil outliner result."})
