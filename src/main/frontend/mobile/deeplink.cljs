(ns frontend.mobile.deeplink 
  (:require
   [clojure.string :as string]
   [frontend.db.model :as db-model]
   [frontend.handler.editor :as editor-handler]
   [frontend.handler.notification :as notification]
   [frontend.handler.route :as route-handler]
   [frontend.handler.user :as user-handler]
   [frontend.state :as state]
   [frontend.text :as text]))

(defn deeplink [url]
  (let [parsed-url (js/URL. url)
        hostname (.-hostname parsed-url)
        pathname (.-pathname parsed-url)
        search-params (.-searchParams parsed-url)
        current-repo-url (state/get-current-repo)
        current-graph-name (-> (text/get-graph-name-from-path current-repo-url)
                               (string/split "/")
                               last
                               string/lower-case)]

    (cond
      (= hostname "auth-callback")
      (when-let [code (.get search-params  "code")]
        (user-handler/login-callback code))

      (= hostname "graph")
      (let [graph-name (some-> pathname
                               (string/replace "/" "")
                               string/lower-case)
            [page-name block-uuid] (map #(.get search-params %)
                                        ["page" "block-id"])]

        (when-not (string/blank? graph-name)
          (if (= graph-name current-graph-name)
            (cond
              page-name
              (let [db-page-name (db-model/get-redirect-page-name page-name)]
                (editor-handler/insert-first-page-block-if-not-exists! db-page-name))

              block-uuid
              (if (db-model/get-block-by-uuid block-uuid)
                (route-handler/redirect-to-page! block-uuid)
                (notification/show! (str "Open link failed. Block-id `" block-uuid "` doesn't exist in the graph.") :error false))

              :else
              (notification/show! (str "Opening File link is not supported on mobile.") :error false))
            (notification/show! (str "The SCHEME across graphs has not been supported yet.") :error false))))

      :else
      (notification/show! (str "The url  has not been supported yet.") :error false))))
