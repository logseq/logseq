(ns logseq.outliner.page-mutation2-app-test
  "Second-run mutation survivors in logseq.outliner.page that only the app
  build reaches: a namespace path through an existing tag assocs onto its
  entity, which only entity-plus supports (nbb lacks it)."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(defn- tags-titled
  [db title]
  (d/q '[:find [?e ...] :in $ ?t :where [?e :block/title ?t] [?e :block/tags :logseq.class/Tag]] db title))

(deftest create-tag-under-an-existing-tag-reuses-it
  (let [conn (db-test/create-conn)
        [_ beta-uuid] (outliner-page/create! conn "Alpha/Beta" {:class? true :split-namespace? true})
        [_ gamma-uuid] (outliner-page/create! conn "Alpha/Beta/Gamma" {:class? true :split-namespace? true})
        gamma (d/entity @conn [:block/uuid gamma-uuid])]
    (is (= [beta-uuid] (map :block/uuid (:logseq.property.class/extends gamma))))
    (is (= 1 (count (tags-titled @conn "Beta"))))))

(deftest create-does-not-take-over-a-built-in-tag-on-its-path
  (let [conn (db-test/create-conn)]
    (is (nil? (outliner-page/create @conn "Root Tag/Task" {:class? true :split-namespace? true})))))
