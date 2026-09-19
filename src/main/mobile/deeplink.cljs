(ns mobile.deeplink
  "Share/open link"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.mobile.intent :as intent]
            [frontend.state :as state]
            [frontend.util.text :as text-util]
            [frontend.util.url :as url-util]
            [goog :refer [Uri]]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def *link-to-another-graph (atom false))

(defn- redirect-url-target-route!
  [url-target link-to-another-graph?]
  (when-let [{:keys [to page-id block-id]} (:route url-target)]
    (js/setTimeout
     (fn []
       (case to
         :page
         (route-handler/redirect-to-page! page-id)

         :block
         (route-handler/redirect-to-page! block-id)

         nil)
       (reset! *link-to-another-graph false))
     (if link-to-another-graph?
       1000
       0))))

(defn- handle-web-url-target!
  [url-target]
  (when (seq url-target)
    (p/let [registry (graph-handler/<get-graph-registry)
            repos (->> (state/get-repos)
                       (remove #(= (:url %) config/demo-repo)))
            target-repo (:repo (graph-handler/resolve-registry-target
                                (concat registry
                                        (graph-handler/registry-from-repo-summaries repos))
                                url-target))]
      (if target-repo
        (let [link-to-another-graph? (not= target-repo (state/get-current-repo))]
          (when link-to-another-graph?
            (state/pub-event! [:graph/switch target-repo])
            (reset! *link-to-another-graph true))
          (redirect-url-target-route! url-target link-to-another-graph?))
        (when-let [graph-id (:graph-id url-target)]
          (notification/show! (t :deeplink/open-graph-error graph-id) :error false))))))

(defn deeplink [url]
  (let [url-target (url-util/parse-web-url-target url)]
    (if (seq url-target)
      (handle-web-url-target! url-target)
      (let [url (string/replace url "logseq.com/" "")
            ^js/Uri parsed-url (.parse Uri url)
            hostname (.getDomain parsed-url)
            pathname (.getPath parsed-url)
            search-params (.getQueryData parsed-url)
            current-repo-url (state/get-current-repo)
            get-graph-name-fn #(-> (text-util/get-graph-name-from-path %)
                                   (string/split "/")
                                   last
                                   string/lower-case)
            current-graph-name (get-graph-name-fn current-repo-url)
            repos (->> (state/get-repos)
                       (remove #(= (:url %) config/demo-repo))
                       (map :url))
            repo-names (map #(get-graph-name-fn %) repos)]
        (cond
          (and (= hostname "mobile") (= pathname "/go/audio"))
          (state/pub-event! [:mobile/start-audio-record])

          (and (= hostname "mobile") (= pathname "/go/quick-add"))
          (state/pub-event! [:mobile/set-tab "capture"])

          ;; logseq://sync-setup?url=<server>&token=<token> — from the /pair
          ;; page of a self-hosted sync server; confirmation happens in the
          ;; event handler.
          (= hostname "sync-setup")
          (state/pub-event! [:sync-server/pair-request
                             {:url (.get search-params "url")
                              :token (.get search-params "token")}])

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
                    (notification/show! (t :deeplink/open-graph-error graph-name) :error false))))

              (when (or (= graph-name current-graph-name)
                        @*link-to-another-graph)
                (js/setTimeout
                 (fn []
                   (cond
                     page-name
                     (p/let [block (db-async/<get-block (state/get-current-repo) page-name {:children? false})]
                       (if block
                         (route-handler/redirect-to-page! block-uuid)
                         (notification/show! (t :deeplink/open-page-error page-name) :error false)))

                     block-uuid
                     (p/let [block (db-async/<get-block (state/get-current-repo) block-uuid {:children? false})]
                       (if block
                         (route-handler/redirect-to-page! block-uuid)
                         (notification/show! (t :deeplink/open-block-error block-uuid) :error false)))

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
          nil)))))
