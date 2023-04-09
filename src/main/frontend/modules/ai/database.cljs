(ns frontend.modules.ai.database
  (:require [frontend.util :as util]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.modules.ai.embedding.local :as embedding]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

(def api "http://localhost:6333/")

(defn- fetch
  [uri opts]
  (util/fetch uri opts p/resolved p/rejected))

(defn create-collection!
  [graph-id]
  ;; FIXME: generate uuid for each graph if not exists
  (let [graph-id (db/get-short-repo-name (frontend.state/get-current-repo))]
    (fetch (str api "collections/" graph-id)
           {:method "PUT"
            :headers {:Content-Type "application/json"}
            :body (js/JSON.stringify
                   (bean/->js {:vectors {:size 384 ; all-MiniLM-L6-v2
                                         :distance "Dot"}}))})))

(defn get-collection
  [graph-id]
  (fetch (str api "collections/" graph-id)
         {:method "GET"
          :headers {:Content-Type "application/json"}}))

(defn- get-blocks
  []
  (->> (db-model/get-all-block-contents)
       (map #(select-keys % [:block/uuid :block/content]))))

(defn- blocks->points
  [blocks]
  (p/all
   (map (fn [block]
          (p/let [content (:block/content block)
                  result (embedding/sentence-transformer content)]
            {:id (str (:block/uuid block))
             :vector result
             :payload block})) blocks)))

(defn add-points!
  [graph-id]
  (let [blocks (partition-all 100 (get-blocks))]
    (doseq [segment blocks]
      (p/let [points (blocks->points segment)]
        (fetch (str api "collections/" graph-id "/points?wait=true")
               {:method "PUT"
                :headers {:Content-Type "application/json"}
                :body (js/JSON.stringify
                       (bean/->js {:points points}))})))))

(defn get-top-k
  [graph-id q {:keys [top]
               :or {top 5}}]
  (p/let [vector (embedding/sentence-transformer q)]
    (fetch (str api "collections/" graph-id "/points/search")
           {:method "POST"
            :headers {:Content-Type "application/json"}
            :body (js/JSON.stringify
                   (bean/->js {:vector vector
                               :top top}))})))


(comment
  (p/let [result (get-top-k "docs" "new to logseq" {})]
    (doseq [{:keys [id]} (:result result)]
      (let [block (-> (db/pull [:block/uuid (uuid id)])
                      (select-keys [:block/content :block/page :block/uuid]))]
        (prn block))))
  )
