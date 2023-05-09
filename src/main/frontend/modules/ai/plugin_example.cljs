(ns frontend.modules.ai.plugin-example
  (:require [frontend.modules.ai.protocol :as ai-protocol]
            [frontend.search.protocol :as search-protocol]
            [frontend.search.db :as search-db]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.db :as db]
            ["sse.js" :refer [SSE]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [promesa.core :as p]))

;; TODO: move this to logseq-ai-plugin

(def api "http://localhost:8000/")
(def db-host "http://localhost:6333")

(defn- fetch
  [uri opts]
  (util/fetch uri opts p/resolved p/rejected))

(defn- headers
  [token]
  (cond->
    {:Content-Type "application/json"}
    token
    (assoc :authorization (str "Bearer " token))))

(defn- get-collection-name
  [repo]
  (string/replace (config/get-local-dir repo) "/" "-"))

(defn -generate-text [q _opts token]
  (p/let [result (fetch (str api "openai/generate_text")
                        {:method "POST"
                         :headers (headers token)
                         :body (js/JSON.stringify
                                (bean/->js {:message q}))})]
    (:result result)))

(defn- -chat
  [conversation {:keys [model on-message on-finished]
                 :or {model "gpt-3.5-turbo"}
                 :as opts} token]
  (let [messages (->> (butlast conversation)
                      (map (fn [m] (-> (assoc m :agent (:role m))
                                       (dissoc :role)))))
        message (:message (last conversation))
        *buffer (atom "")
        sse ^js (SSE. (str api "openai/chat")
                      (bean/->js
                       {:headers (headers token)
                        :method "POST"
                        :payload (js/JSON.stringify
                                  (bean/->js {:messages messages
                                              :new_message message}))}))]
    (.addEventListener sse "message"
                       (fn [e]
                         (let [data (.-data e)]
                           (if (and (string? data)
                                    (= data "[DONE]"))
                             (do
                               (when on-finished (on-finished @*buffer))
                               (.close sse))
                             (try
                               (let [content (-> (bean/->clj (js/JSON.parse data))
                                                 :data)]
                                 (when content
                                   (swap! *buffer str content)
                                   (when on-message (on-message @*buffer))))
                               (catch :default e
                                 (prn "Chat request failed: " e)
                                 (.close sse)))))))

    (.stream sse)))

(defn -generate-image
  [description _opts token]
  (p/let [result (fetch (str api "openai/generate_image")
                        {:method "POST"
                         :headers (headers token)
                         :body (js/JSON.stringify
                                (bean/->js {:text description}))})]
    (:url result)))

(defn -query
  [repo q {:keys [limit filter]
           :or {limit 10}} token]
  (fetch (str api "db/search")
         {:method "POST"
          :headers (headers token)
          :body (js/JSON.stringify
                 (bean/->js
                  (cond->
                    {:db {:host db-host
                          :collection_name (get-collection-name repo)
                          ;; TODO: configurable
                          :embedding_model "all-MiniLM-L6-v2"}
                     :query q
                     :k limit}
                    filter
                    (assoc :filter filter))))}))

(defn- block-indice->item
  [b]
  (when (and (:uuid b) (not (string/blank? (:content b))))
    {:id (str (:uuid b))
     :content (:content b)
     :metadata (if (:page b)
                 {:page (:page b)}
                 {})}))

(defn- index-blocks!
  [repo blocks-indice token]
  (let [data (->> (map block-indice->item blocks-indice)
                  (remove nil?))]
    (fetch (str api "db/index")
          {:method "POST"
           :headers (headers token)
           :body (js/JSON.stringify
                  (bean/->js
                   {:db {:host db-host
                         :collection_name (get-collection-name repo)
                         ;; TODO: configurable
                         :embedding_model "all-MiniLM-L6-v2"}
                    :payload data}))})))

(defn -rebuild-blocks-indice!
  [repo token]
  (let [blocks-indice (search-db/build-blocks-indice-edn repo)
        ;; pages-indice  (search-db/build-pages-indice-edn repo)
        segments (partition-all 2000 blocks-indice)]
    (p/loop [segments segments]
      (when-let [segment (first segments)]
        (p/let [_ (index-blocks! repo segment token)]
          (p/recur (rest segments)))))))

(defn -transact-blocks!
  [repo {:keys [blocks-to-remove-set
                blocks-to-add]} token]
  (p/let [_ (when (seq blocks-to-remove-set)
              (let [remove-ids (map (comp str :block/uuid) (map db/entity blocks-to-remove-set))]
                (fetch (str api "db/items")
                       {:method "DELETE"
                        :headers (headers token)
                        :body (js/JSON.stringify
                               (bean/->js
                                {:db {:host db-host
                                      :collection_name (get-collection-name repo)
                                      ;; TODO: configurable
                                      :embedding_model "all-MiniLM-L6-v2"}
                                 :item_ids remove-ids}))})))]
    (when (seq blocks-to-add)
      (index-blocks! repo blocks-to-add token))))

(defn- new-collection!
  [repo token]
  (fetch (str api "db/collections")
         {:method "POST"
          :headers (headers token)
          :body (js/JSON.stringify
                 (bean/->js {:host db-host
                             :collection_name (get-collection-name repo)
                             ;; TODO: configurable
                             :embedding_model "all-MiniLM-L6-v2"}))}))

(defn- -remove-db!
  [repo token]
  (fetch (str api "db/collections")
         {:method "DELETE"
          :headers (headers token)
          :body (js/JSON.stringify
                 (bean/->js {:host db-host
                             :collection_name (get-collection-name repo)}))}))

(defn -truncate-blocks!
  [repo token]
  (p/let [_ (-remove-db! repo token)]
    (new-collection! repo token)))

(defrecord AIProxy [repo token]
  ai-protocol/AI
  (generate-text [_this q opts]
    (-generate-text q opts token))
  (chat [_this conversation opts]
    (-chat conversation opts token))
  (generate-image [this description opts]
    (-generate-image description opts token))
  (speech-to-text [this audio opts])

  search-protocol/Engine
  (query [_this q opts]
    (-query repo q opts token))
  (rebuild-blocks-indice! [_this]
    (-rebuild-blocks-indice! repo token))
  (transact-blocks! [_this data]
    (-transact-blocks! repo data token))
  (truncate-blocks! [_this]
    (-truncate-blocks! repo token))
  (remove-db! [_this]
    (-remove-db! repo token))
  (query-page [_this q opts])
  (transact-pages! [_this data]))


(comment
  (def ai-proxy (->AIProxy (frontend.state/get-current-repo) ""))

  (p/let [result (ai-protocol/generate-text ai-proxy "hello" {})]
    (prn {:result result}))

  (p/let [result (ai-protocol/generate-image ai-proxy "A dog with a cat" {})]
    (prn {:result result}))

  (ai-protocol/chat ai-proxy
                    [{:role "ai"
                      :message "I know everything about Basketball!"}
                     {:role "user"
                      :message "Write a javascript program to list all the players in Spurs"}]
                    {:on-message (fn [message]
                                   (prn "received: " message))
                     :on-finished (fn [] (prn "finished"))})

  (p/let [_ (prn "start: " (js/Date.))
          _ (search-protocol/rebuild-blocks-indice! ai-proxy)]
    (prn "Semantic db rebuilt successfully!")
    (prn "end: " (js/Date.)))

  (p/let [result (search-protocol/query ai-proxy
                   "logseq what"
                   {})]
    (prn "Search result: " result))

  (search-protocol/remove-db! ai-proxy)
  (search-protocol/truncate-blocks! ai-proxy)
  (search-protocol/transact-blocks! ai-proxy {:blocks-to-remove-set #{31 20}})
  )
