;; src/main/frontend/modules/memo/index.cljs
(ns frontend.modules.memo.index
  (:require [datascript.core :as d]
            [logseq.memo.schema :as memo-schema]))

(def conn (atom nil))

(defn index-key [repo]
  (keyword (str "logseq.memo/" repo)))

(defn init-index! [repo]
  (let [setting-schema (merge
                         memo-schema/setting-schema
                         {:logseq.memo/relations {:db/cardinality :db.cardinality/many}})]
    (reset! conn (d/create-conn setting-schema))))

(defn index-setting! [setting]
  (when @conn
    (d/transact! @conn [setting])))

(defn get-settings-by-type [type]
  (when @conn
    (d/q '[:find (pull ?e [*])
           :in $ ?type
           :where
           [?e :logseq.memo/type ?type]]
         @conn type)))

(defn get-all-settings []
  (when @conn
    (d/q '[:find (pull ?e [*])
           :where
           [?e :logseq.memo/id]]
         @conn)))

(defn get-settings-as-entities []
  (get-all-settings))
