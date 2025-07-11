(ns frontend.mobile.deeplink
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db.async :as db-async]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.intent :as intent]
            [frontend.state :as state]
            [frontend.util.text :as text-util]
            [goog :refer [Uri]]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

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
                   (remove #(= (:url %) config/demo-repo))
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
                 (p/let [block (db-async/<get-block (state/get-current-repo) page-name {:children? false})]
                   (if block
                     (route-handler/redirect-to-page! block-uuid)
                     (notification/show! (str "Open link failed. Page `" page-name "` doesn't exist in the graph."
                                              :result block) :error false)))

                 block-uuid
                 (p/let [block (db-async/<get-block (state/get-current-repo) block-uuid {:children? false})]
                   (if block
                     (route-handler/redirect-to-page! block-uuid)
                     (notification/show! (str "Open link failed. Block-id `" block-uuid "` doesn't exist in the graph."
                                              :result block) :error false)))

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
          (let [raw (common-util/safe-decode-uri-component (:payload result))
                payload (-> raw
                            js/JSON.parse
                            (js->clj :keywordize-keys true))]
            (intent/handle-payload payload))
          (intent/handle-result result)))

      :else
      nil)))
