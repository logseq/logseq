(ns frontend.mobile.deeplink
  (:require
   [clojure.string :as string]
   [goog :refer [Uri]]
   [frontend.config :as config]
   [frontend.db.model :as db-model]
   [frontend.handler.editor :as editor-handler]
   [frontend.handler.notification :as notification]
   [frontend.handler.route :as route-handler]
   [frontend.mobile.intent :as intent]
   [frontend.state :as state]
   [frontend.util.text :as text-util]
   [logseq.graph-parser.util :as gp-util]))

(def *link-to-another-graph (atom false))

(defn deeplink [url]
  (let [^js/Uri parsed-url (.parse Uri url)
        hostname (.getDomain parsed-url)
        pathname (.getPath parsed-url)
        search-params (.getQueryData parsed-url)
        current-repo-url (state/get-current-repo)
        get-graph-name-fn #(-> (text-util/get-graph-name-from-path %)
                               (string/split "/")
                               last
                               string/lower-case)
        current-graph-name (get-graph-name-fn current-repo-url)
        repos (->> (state/sub [:me :repos])
                   (remove #(= (:url %) config/local-repo))
                   (map :url))
        repo-names (map #(get-graph-name-fn %) repos)]
    (cond
      (= hostname "graph")
      (let [graph-name (some-> pathname
                               (string/replace "/" "")
                               string/lower-case)
            [page-name block-uuid] (map #(.get search-params %)
                                        ["page" "block-id"])]

        (when-not (string/blank? graph-name)
          (when-not (= graph-name current-graph-name)
            (let [graph-idx (.indexOf repo-names graph-name)
                  graph-url (when (not= graph-idx -1)
                              (nth repos graph-idx))]
              (if graph-url
                (do (state/pub-event! [:graph/switch graph-url])
                    (reset! *link-to-another-graph true))
                (notification/show! (str "Open graph failed. Graph `" graph-name "` doesn't exist.") :error false))))

          (when (or (= graph-name current-graph-name)
                    @*link-to-another-graph)
            (js/setTimeout
             (fn []
               (cond
                 page-name
                 (let [db-page-name (db-model/get-redirect-page-name page-name)]
                   (editor-handler/insert-first-page-block-if-not-exists! db-page-name))

                 block-uuid
                 (if (db-model/get-block-by-uuid block-uuid)
                   (route-handler/redirect-to-page! block-uuid)
                   (notification/show! (str "Open link failed. Block-id `" block-uuid "` doesn't exist in the graph.") :error false))

                 :else
                 nil)
               (reset! *link-to-another-graph false))
             (if @*link-to-another-graph
               1000
               0)))))

      (= hostname "shared")
      (let [result (into {} (map (fn [key]
                                   [(keyword key) (.get search-params key)])
                                 ["title" "url" "type" "payload"]))]
        (if (:payload result)
          (let [raw (gp-util/safe-decode-uri-component (:payload result))
                payload (-> raw
                            js/JSON.parse
                            (js->clj :keywordize-keys true))]
            (intent/handle-payload payload))
          (intent/handle-result result)))

      :else
      nil)))
