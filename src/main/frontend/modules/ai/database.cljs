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

(defn delete-collection!
  [graph-id]
  (fetch (str api "collections/" graph-id)
         {:method "DELETE"
          :headers {:Content-Type "application/json"}}))

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
  (map (fn [block]
         {:id (str (:block/uuid block))
          ;; :vector result
          :payload block}) blocks))

(defn index-graph!
  [graph-id]
  (p/let [blocks (get-blocks)
          block-contents (map :block/content blocks)
          vectors-result (embedding/sentence-transformer block-contents)
          vectors (zipmap block-contents vectors-result)
          blocks (map (fn [b] (assoc b :vector (get vectors (get-in b [:payload :block/content]))))
                   (blocks->points blocks))
          segments (partition-all 500 blocks)]
    (p/loop [segments segments]
      (when-let [segment (first segments)]
        (p/let [_ (fetch (str api "collections/" graph-id "/points?wait=true")
                         {:method "PUT"
                          :headers {:Content-Type "application/json"}
                          :body (js/JSON.stringify
                                 (bean/->js {:points segment}))})]
          (p/recur (rest segments)))))))

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

(defn- re-index-graph!
  [graph-id]
  (p/do!
    (delete-collection! graph-id)
    (create-collection! graph-id)
    (let [start (system-time)]
      (p/let [_ (index-graph! graph-id)
              end (system-time)]
        (prn "Re-index vector db time: " (- end start))))))

(comment
  (defn q
    [query]
    (prn "Matched results: ")
    (p/let [result (get-top-k "docs" query {})]
      (doseq [{:keys [id]} (:result result)]
        (let [block (-> (db/pull [:block/uuid (uuid id)])
                        (select-keys [:block/content :block/page :block/uuid]))]
          (prn block)))))

  )
