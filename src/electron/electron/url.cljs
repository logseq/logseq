(ns electron.url
  (:require [electron.handler :as handler]
            [electron.state :as state]
            [electron.utils :refer [send-to-renderer get-URL-decoded-params]]
            [clojure.string :as string]
            [promesa.core :as p]))

(defn graph-name-error-handler
  [graph]
  (if graph
    (send-to-renderer "notification" {:type "error"
                                      :payload (str "Open link failed. Cannot match graph name `" graph "` to any linked graph for action `open`.")})
    (send-to-renderer "notification" {:type "error"
                                      :payload (str "Open link failed. Missing required parameter `graph=<graph name>` for action `open`.")})))

(defn local-url-handler
  "Given a URL with `open` as path, and `graph` (required), `page` (optional) and `block-id` (optional) as parameters,
   open the local graphs accordingly.
   `graph` is the name of the graph to open, e.g. `lambda`"
  [^js win parsed-url url-path]
  (cond
    (= "open" url-path)
    (let [[graph page-name block-id] (get-URL-decoded-params parsed-url ["graph" "page" "block-id"])
          graph-name (handler/get-graph-name graph)]
      (if graph-name
        (p/let [_ (handler/broadcast-persist-graph! graph-name)]
          ;; TODO: call open new window on new graph without renderer (remove the reliance on local storage)
          ;; TODO: allow open new window on specific page, without waiting for `graph ready` ipc then redirect to that page
          (when (or page-name block-id)
            (let [then-f (fn [win' graph-name']
                           (when (= graph-name graph-name')
                             (send-to-renderer win' "redirectWhenExists" {:page-name page-name
                                                                         :block-id block-id})))]
              (state/set-state! :window/once-graph-ready then-f)))
          (send-to-renderer win "openNewWindowOfGraph" graph-name))
        (graph-name-error-handler graph)))
    :else
    (send-to-renderer "notification" {:type "error"
                                      :payload (str "Open link failed. Cannot match `" url-path
                                                    "` to any action.")})))

(defn logseq-url-handler
  [^js win parsed-url]
  (let [url-host (.-host parsed-url)
        url-path (string/replace (.-pathname parsed-url) "/" "")]
    (cond
      (= "auth-callback" url-host)
      (send-to-renderer win "loginCallback" (.get (.-searchParams parsed-url) "code"))

      (= "local" url-host)
      (local-url-handler win parsed-url url-path)

      :else
      (send-to-renderer "notification" {:type "error"
                                        :payload (str "Open link failed. Cannot match `" url-host
                                                      "` to any target.")}))))