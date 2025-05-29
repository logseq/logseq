(ns frontend.common.file-based.db
  "Database fns for file graphs that are used by worker and frontend"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db.file-based.rules :as file-rules]))

(defn get-namespace-pages
  "Accepts both sanitized and unsanitized namespaces"
  [db namespace']
  (assert (string? namespace'))
  (let [namespace'' (common-util/page-name-sanity-lc namespace')
        pull-attrs [:db/id :block/name :block/original-name :block/namespace
                    {:block/file [:db/id :file/path]}]]
    (d/q
     [:find [(list 'pull '?c pull-attrs) '...]
      :in '$ '% '?namespace
      :where
      ['?p :block/name '?namespace]
      (list 'namespace '?p '?c)]
     db
     (:namespace file-rules/rules)
     namespace'')))

(defn get-pages-by-name-partition
  [db partition']
  (when-not (string/blank? partition')
    (let [partition'' (common-util/page-name-sanity-lc (string/trim partition'))
          ids (->> (d/datoms db :aevt :block/name)
                   (filter (fn [datom]
                             (let [page (:v datom)]
                               (string/includes? page partition''))))
                   (map :e))]
      (when (seq ids)
        (d/pull-many db
                     '[:db/id :block/name :block/title]
                     ids)))))
