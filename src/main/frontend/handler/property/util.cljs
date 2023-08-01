(ns frontend.handler.property.util
  (:require [frontend.config :as config]
            [frontend.state :as state]
            [frontend.config :as config]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util :as gp-util]
            [frontend.db :as db]))

(defn lookup
  "Get the value of coll's (a map) `key`"
  [coll key]
  (let [repo (state/get-current-repo)]
    (if (and (config/db-based-graph? repo)
             (keyword? key)
             (contains? gp-property/db-built-in-properties-keys key))
      (when-let [property (db/entity repo [:block/name (gp-util/page-name-sanity-lc (name key))])]
        (get coll (:block/uuid property)))
      (get coll key))))

(defn get-property
  "Get the value of block's property `key`"
  [block key]
  (let [block (db/entity (:db/id block))]
    (when-let [properties (:block/properties block)]
      (lookup properties key))))

(defn block->shape [block]
  (get-property block :logseq.tldraw.shape))

(defn page-block->tldr-page [block]
  (get-property block :logseq.tldraw.page))

(defn shape-block? [block]
  (= :whiteboard-shape (get-property block :ls-type)))
